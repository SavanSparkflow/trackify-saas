const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Company = require('../models/Company');
const { sendWhatsAppMessage } = require('./whatsappService');
const { uploadToCloudinary } = require('../config/cloudinary');
const moment = require('moment');

const getTodayRecord = async (userId) => {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();
    return await Attendance.findOne({ userId, date: { $gte: startOfDay, $lte: endOfDay } });
};

const notifyParent = async (userId, bodyFunc) => {
    try {
        const user = await User.findById(userId);
        if (user && user.parentPhone) {
            const message = bodyFunc(user);
            await sendWhatsAppMessage(user.parentPhone, message);
        }
    } catch (err) {
        console.error('WhatsApp notify error:', err);
    }
};

const processPunchIn = async ({ userId, companyId, location, photo, ipAddress }) => {
    const user = await User.findById(userId);
    let attendance = await getTodayRecord(userId);
    const now = new Date();

    if (attendance) {
        if (attendance.punchIn) throw new Error('Already punched in today.');
    } else {
        let status = 'Present';
        let lateMinutes = 0;
        let penaltyAmount = 0;

        const company = await Company.findById(companyId);
        const gracePeriod = company.lateGracePeriod !== undefined ? company.lateGracePeriod : 15;
        const shiftTime = user.shiftStart || company.openingTime || '09:00';

        attendance = new Attendance({
            companyId,
            userId,
            date: now,
            status,
            lateMinutes,
            penaltyAmount,
            penaltyDays: 0 // Will update if late rules trigger
        });

        if (shiftTime) {
            const [shiftHour, shiftMin] = shiftTime.split(':').map(Number);
            const expectedStart = moment(now).set({ hour: shiftHour, minute: shiftMin, second: 0, millisecond: 0 });

            if (moment(now).isAfter(expectedStart)) {
                lateMinutes = moment(now).diff(expectedStart, 'minutes');
                attendance.lateMinutes = lateMinutes;
                
                if (lateMinutes > gracePeriod) {
                    attendance.status = 'Late';
                    
                    // 1. Minute-wise penalty
                    if (user.latePenaltyRate) {
                        attendance.penaltyAmount = lateMinutes * user.latePenaltyRate;
                    }

                    // 2. Late Policy Logic
                    if (company.latePolicy && user.monthlySalary) {
                        const currentMonthIdx = moment(now).month();
                        const workingDays = (company.monthlyWorkingDays && company.monthlyWorkingDays[currentMonthIdx]) || 26;
                        const dailySalary = user.monthlySalary / workingDays;
                        const policy = company.latePolicy;

                        // A. Severe Late Deduction
                        if (policy.enableSevereLateDeduction && lateMinutes >= policy.severeLateMinutes) {
                            attendance.penaltyAmount += dailySalary * policy.severeLateDeduction;
                            attendance.penaltyDays += policy.severeLateDeduction;
                        }

                        // B. Cumulative Late Days Deduction
                        if (policy.enableLateDeduction) {
                            const startOfMonth = moment(now).startOf('month').toDate();
                            const lateCount = await Attendance.countDocuments({
                                userId,
                                companyId,
                                status: 'Late',
                                date: { $gte: startOfMonth, $lt: moment(now).startOf('day').toDate() }
                            });

                            if ((lateCount + 1) % policy.lateDaysThreshold === 0) {
                                attendance.penaltyAmount += dailySalary * policy.lateDaysDeduction;
                                attendance.penaltyDays += policy.lateDaysDeduction;
                            }
                        }
                    }
                } else {
                    attendance.lateMinutes = 0;
                }
            }
        }
    }

    if (photo && photo.startsWith('data:image')) {
        const cloudinaryUrl = await uploadToCloudinary(photo, `attendance/punchin/${userId}`);
        if (cloudinaryUrl) attendance.photo = cloudinaryUrl;
    } else if (photo && photo.startsWith('http')) {
        attendance.photo = photo;
    }

    attendance.punchIn = now;
    attendance.locationIn = location;
    attendance.location = location; 
    attendance.ipAddress = ipAddress;
    await attendance.save();

    await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n✔ Arrived at ${moment(now).format('hh:mm A')} ${attendance.status === 'Late' ? '(LATE)' : ''}\n- Trackify System`);

    return { message: `Punched In Successfully${attendance.status === 'Late' ? ' (Late)' : ''}`, attendance };
};

const processPunchOut = async ({ userId, companyId, location, photo }) => {
    const attendance = await getTodayRecord(userId);

    if (!attendance || !attendance.punchIn) throw new Error('Must punch in first.');
    if (attendance.punchOut) throw new Error('Already punched out.');

    const now = new Date();

    const openBreak = attendance.breaks.find(b => !b.breakEnd);
    if (openBreak) {
        openBreak.breakEnd = now;
        openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
        attendance.totalBreakTime = (attendance.totalBreakTime || 0) + openBreak.duration;

        const company = await Company.findById(companyId);
        if (company && company.lunchEndTime) {
            const [leH, leM] = company.lunchEndTime.split(':').map(Number);
            const lunchEndMoment = moment(now).set({ hour: leH, minute: leM, second: 0, millisecond: 0 });
            if (moment(openBreak.breakStart).isBefore(lunchEndMoment) && moment(now).isAfter(lunchEndMoment)) {
                const lateMins = moment(now).diff(lunchEndMoment, 'minutes');
                if (lateMins > 0) {
                    attendance.lateBreakMinutes = (attendance.lateBreakMinutes || 0) + lateMins;
                }
            }
        }
    }

    if (photo && photo.startsWith('data:image')) {
        const cloudinaryUrl = await uploadToCloudinary(photo, `attendance/punchout/${userId}`);
        if (cloudinaryUrl) attendance.photoOut = cloudinaryUrl;
    } else if (photo && photo.startsWith('http')) {
        attendance.photoOut = photo;
    }

    attendance.punchOut = now;
    attendance.locationOut = location;

    const user = await User.findById(userId);
    const company = await Company.findById(companyId);

    const shiftStartStr = user.shiftStart || company.openingTime || '09:00';
    const [sH, sM] = shiftStartStr.split(':').map(Number);
    const shiftStartMoment = moment(attendance.date).set({ hour: sH, minute: sM, second: 0, millisecond: 0 });

    let effectivePunchIn = attendance.punchIn;
    if (moment(attendance.punchIn).isBefore(shiftStartMoment)) {
        effectivePunchIn = shiftStartMoment.toDate();
    }

    const grossMinutes = moment(now).diff(moment(effectivePunchIn), 'minutes');
    const netMinutes = grossMinutes - (attendance.totalBreakTime || 0) - (attendance.lateBreakMinutes || 0);
    attendance.totalWorkHours = Math.max(0, netMinutes / 60);

    const halfDayHrs = 4;
    const fullDayHrs = 8;

    if (attendance.totalWorkHours < halfDayHrs) {
        attendance.status = 'Absent';
    } else if (attendance.totalWorkHours < fullDayHrs) {
        attendance.status = 'Half Day';
    } else {
        if (attendance.status === 'Absent' || attendance.status === 'Half Day') {
            attendance.status = 'Present';
        }
    }

    if (user && user.monthlySalary) {
        const shiftStartStr = user.shiftStart || company.openingTime || '09:00';
        const shiftEndStr = company.closingTime || '18:00';
        const [sH, sM] = shiftStartStr.split(':').map(Number);
        const [eH, eM] = shiftEndStr.split(':').map(Number);
        const expectedShiftMins = (eH * 60 + eM) - (sH * 60 + sM);

        const lunchStartStr = company.lunchStartTime || '13:00';
        const lunchEndStr = company.lunchEndTime || '14:00';
        const [lsH, lsM] = lunchStartStr.split(':').map(Number);
        const [leH, leM] = lunchEndStr.split(':').map(Number);
        const lunchMins = (leH * 60 + leM) - (lsH * 60 + lsM);

        const expectedNetMins = Math.max(1, expectedShiftMins - lunchMins);
        const currentMonthIdx = moment(now).month();
        const workingDays = (company.monthlyWorkingDays && company.monthlyWorkingDays[currentMonthIdx]) || 26;
        const dailyFullSalary = user.monthlySalary / workingDays;
        const expectedHours = expectedNetMins / 60;
        const actualHours = (attendance.totalWorkHours || netMinutes / 60);
        const grossSalary = (dailyFullSalary / expectedHours) * actualHours;
        attendance.earnedSalary = Math.round(Math.max(0, grossSalary - (attendance.penaltyAmount || 0)));
    }

    await attendance.save();

    await notifyParent(userId, (user) => {
        const hours = Math.floor(netMinutes / 60);
        const mins = Math.floor(netMinutes % 60);
        const breakMins = attendance.totalBreakTime || 0;
        const bHours = Math.floor(breakMins / 60);
        const bMins = Math.floor(breakMins % 60);

        return `Hello,\nYour child *${user.name}* has finished their shift.\n\n🚪 *Left Office:* ${moment(now).format('hh:mm A')}\n\n📊 *Today's Statistics:*\n- Total Working Hours: *${hours}h ${mins}m*\n- Total Break Time: *${bHours}h ${bMins}m*\n\nThank you,\n- Trackify System`;
    });

    return { message: 'Punched Out Successfully', attendance };
};

const processBreakStart = async ({ userId, companyId, location, photo }) => {
    const attendance = await getTodayRecord(userId);

    if (!attendance || !attendance.punchIn) throw new Error('Must punch in first.');
    if (attendance.punchOut) throw new Error('Already punched out');

    const openBreak = attendance.breaks.find(b => !b.breakEnd);
    if (openBreak) throw new Error('Already on break.');

    const now = new Date();
    let photoUrl = photo;
    if (photo && photo.startsWith('data:image')) {
        const url = await uploadToCloudinary(photo, `attendance/breakstart/${userId}`);
        if (url) photoUrl = url;
    }

    attendance.breaks.push({ breakStart: now, locationStart: location, photoStart: photoUrl });
    await attendance.save();

    await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n☕ Started Break at ${moment(now).format('hh:mm A')}\n- Trackify System`);

    return { message: 'Break Started', attendance };
};

const processBreakEnd = async ({ userId, companyId, location, photo }) => {
    const attendance = await getTodayRecord(userId);

    if (!attendance) throw new Error('No attendance record.');

    const openBreak = attendance.breaks.find(b => !b.breakEnd);
    if (!openBreak) throw new Error('Not on break.');

    const now = new Date();
    openBreak.breakEnd = now;
    openBreak.locationEnd = location;
    openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
    attendance.totalBreakTime = (attendance.totalBreakTime || 0) + openBreak.duration;

    const company = await Company.findById(companyId);
    if (company && company.lunchEndTime) {
        const [leH, leM] = company.lunchEndTime.split(':').map(Number);
        const lunchEndMoment = moment(now).set({ hour: leH, minute: leM, second: 0, millisecond: 0 });
        
        if (moment(openBreak.breakStart).isBefore(lunchEndMoment) && moment(now).isAfter(lunchEndMoment)) {
            const lateMins = moment(now).diff(lunchEndMoment, 'minutes');
            if (lateMins > 0) {
                attendance.lateBreakMinutes = (attendance.lateBreakMinutes || 0) + lateMins;
            }
        }
    }

    let photoUrl = photo;
    if (photo && photo.startsWith('data:image')) {
        const url = await uploadToCloudinary(photo, `attendance/breakend/${userId}`);
        if (url) photoUrl = url;
    }

    openBreak.photoEnd = photoUrl;
    await attendance.save();

    await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n🔁 Ended Break at ${moment(now).format('hh:mm A')}\n- Trackify System`);

    return { message: 'Break Ended', attendance };
};

module.exports = {
    getTodayRecord,
    processPunchIn,
    processPunchOut,
    processBreakStart,
    processBreakEnd
};
