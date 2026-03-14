const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Company = require('../models/Company');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { uploadToCloudinary } = require('../config/cloudinary');
const { emitToCompany } = require('../utils/socket');
const Notification = require('../models/Notification');
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

const getEmployeeDashboard = async (req, res) => {
    try {
        const todayAttendance = await getTodayRecord(req.user.id);
        const company = await Company.findById(req.user.companyId);
        const user = await User.findById(req.user.id).select('attendancePhoto');
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json({ todayAttendance, company, user });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching dashboard' });
    }
};

const cloudinary = require('cloudinary').v2;

const getCloudinarySignature = async (req, res) => {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        folder: `trackify/attendance`
    }, process.env.CLOUDINARY_API_SECRET);

    res.json({
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
};

const punchIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location, photo } = req.body;
        const user = await User.findById(userId);
        let attendance = await getTodayRecord(userId);

        const now = new Date();

        if (attendance) {
            if (attendance.punchIn) return res.status(400).json({ message: 'Already punched in today.' });
        } else {
            let status = 'Present';
            let lateMinutes = 0;
            let penaltyAmount = 0;

            // Shift Logic
            const company = await Company.findById(req.user.companyId);
            const gracePeriod = company.lateGracePeriod !== undefined ? company.lateGracePeriod : 15;
            const shiftTime = user.shiftStart || company.openingTime || '09:00';

            if (shiftTime) {
                const [shiftHour, shiftMin] = shiftTime.split(':').map(Number);
                const expectedStart = moment(now).set({ hour: shiftHour, minute: shiftMin, second: 0, millisecond: 0 });

                if (moment(now).isAfter(expectedStart)) {
                    lateMinutes = moment(now).diff(expectedStart, 'minutes');
                    if (lateMinutes > gracePeriod) { // Company defined grace period
                        status = 'Late';
                        if (user.latePenaltyRate) {
                            penaltyAmount = lateMinutes * user.latePenaltyRate;
                        }
                    } else {
                        lateMinutes = 0;
                    }
                }
            }

            attendance = new Attendance({
                companyId: req.user.companyId,
                userId,
                date: now,
                status,
                lateMinutes,
                penaltyAmount
            });
        }

        // Upload to Cloudinary if photo provided
        if (photo && photo.startsWith('data:image')) {
            const cloudinaryUrl = await uploadToCloudinary(photo, `attendance/punchin/${userId}`);
            if (cloudinaryUrl) attendance.photo = cloudinaryUrl;
        } else if (photo && photo.startsWith('http')) {
            attendance.photo = photo;
        }

        attendance.punchIn = now;
        attendance.locationIn = location;
        attendance.location = location; // sync legacy
        attendance.ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await attendance.save();

        await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n✔ Arrived at ${moment(now).format('hh:mm A')} ${attendance.status === 'Late' ? '(LATE)' : ''}\n- Trackify System`);

        res.status(200).json({ message: `Punched In Successfully${attendance.status === 'Late' ? ' (Late)' : ''}`, attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const punchOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { photo, location } = req.body;
        const attendance = await getTodayRecord(userId);

        if (!attendance || !attendance.punchIn) return res.status(400).json({ message: 'Must punch in first.' });
        if (attendance.punchOut) return res.status(400).json({ message: 'Already punched out.' });

        const now = new Date();

        // Close any open break
        const openBreak = attendance.breaks.find(b => !b.breakEnd);
        if (openBreak) {
            openBreak.breakEnd = now;
            openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
            attendance.totalBreakTime = (attendance.totalBreakTime || 0) + openBreak.duration;

            // Late Break Penalty if closed at punch out
            const company = await Company.findById(req.user.companyId);
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

        // Upload Punch Out photo if provided
        if (photo && photo.startsWith('data:image')) {
            const cloudinaryUrl = await uploadToCloudinary(photo, `attendance/punchout/${userId}`);
            if (cloudinaryUrl) attendance.photoOut = cloudinaryUrl;
        } else if (photo && photo.startsWith('http')) {
            attendance.photoOut = photo;
        }

        attendance.punchOut = now;
        attendance.locationOut = location;

        const user = await User.findById(userId);
        const company = await Company.findById(req.user.companyId);

        // Calculate early punch-in adjustment
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

        // Default thresholds (removed from Rule configuration)
        const halfDayHrs = 4;
        const fullDayHrs = 8;
        const graceMins = company?.lateGracePeriod || 15;

        // Determine status based on hours
        if (attendance.totalWorkHours < halfDayHrs) {
            attendance.status = 'Absent';
        } else if (attendance.totalWorkHours < fullDayHrs) {
            attendance.status = 'Half Day';
        } else {
            // Already set to Present or Late in punchIn, keep it unless it qualifies for Full Day now
            if (attendance.status === 'Absent' || attendance.status === 'Half Day') {
                attendance.status = 'Present';
            }
        }

        if (user && user.monthlySalary) {
            // Find expected net minutes
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

            // Lookup manually entered working days for the current month
            const currentMonthIdx = moment(now).month(); // 0 (Jan) to 11 (Dec)
            const workingDays = (company.monthlyWorkingDays && company.monthlyWorkingDays[currentMonthIdx]) || 26;

            // (Monthly Salary / Total Company Working Days) -> Daily Salary
            const dailyFullSalary = user.monthlySalary / workingDays;

            // Divide total expected working hours (to get hourly rate essentially) then multiply by actual work hours
            const expectedHours = expectedNetMins / 60;
            const actualHours = (attendance.totalWorkHours || netMinutes / 60);

            // Daily Salary / Expected Hours * Actual Hours
            const grossSalary = (dailyFullSalary / expectedHours) * actualHours;

            // Rounding to nearest whole number as per user requirement (₹180.55 -> ₹181)
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

        res.status(200).json({ message: 'Punched Out Successfully', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const breakStart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location } = req.body;
        const attendance = await getTodayRecord(userId);

        if (!attendance || !attendance.punchIn) return res.status(400).json({ message: 'Must punch in first.' });
        if (attendance.punchOut) return res.status(400).json({ message: 'Already punched out' });

        const openBreak = attendance.breaks.find(b => !b.breakEnd);
        if (openBreak) return res.status(400).json({ message: 'Already on break.' });

        const now = new Date();
        attendance.breaks.push({ breakStart: now, locationStart: location });
        await attendance.save();

        await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n☕ Started Break at ${moment(now).format('hh:mm A')}\n- Trackify System`);

        res.status(200).json({ message: 'Break Started', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const breakEnd = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location } = req.body;
        const attendance = await getTodayRecord(userId);

        if (!attendance) return res.status(400).json({ message: 'No attendance record.' });

        const openBreak = attendance.breaks.find(b => !b.breakEnd);
        if (!openBreak) return res.status(400).json({ message: 'Not on break.' });

        const now = new Date();
        openBreak.breakEnd = now;
        openBreak.locationEnd = location;
        openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
        attendance.totalBreakTime = (attendance.totalBreakTime || 0) + openBreak.duration;

        // Late Break Penalty Logic
        const Company = require('../models/Company');
        const company = await Company.findById(req.user.companyId);
        if (company && company.lunchEndTime) {
            const [leH, leM] = company.lunchEndTime.split(':').map(Number);
            const lunchEndMoment = moment(now).set({ hour: leH, minute: leM, second: 0, millisecond: 0 });
            
            // If break started before/during lunch and ended after lunch
            if (moment(openBreak.breakStart).isBefore(lunchEndMoment) && moment(now).isAfter(lunchEndMoment)) {
                const lateMins = moment(now).diff(lunchEndMoment, 'minutes');
                if (lateMins > 0) {
                    attendance.lateBreakMinutes = (attendance.lateBreakMinutes || 0) + lateMins;
                }
            }
        }

        await attendance.save();

        await notifyParent(userId, (user) => `Hello,\nYour child ${user.name} has:\n🔁 Ended Break at ${moment(now).format('hh:mm A')}\n- Trackify System`);

        res.status(200).json({ message: 'Break Ended', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const leave = new Leave({
            companyId: req.user.companyId,
            userId: req.user.id,
            startDate,
            endDate,
            reason
        });
        await leave.save();

        const user = await User.findById(req.user.id);
        
        // Notify Admin via Socket (Admins join room named after companyId)
        emitToUser(req.user.companyId, 'new_leave_request', {
            employeeName: user.name,
            startDate: startDate,
            message: `${user.name} has applied for leave.`
        });

        // Save DB Notification for Admin (using companyId as the target ID for admin)
        const adminNotification = new Notification({
            userId: req.user.companyId, // Admins use companyId as their user ID
            companyId: req.user.companyId,
            title: '📅 New Leave Request',
            message: `${user.name} applied for leave from ${new Date(startDate).toLocaleDateString()}.`,
            type: 'leave',
            link: '/leaves'
        });
        await adminNotification.save();

        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ message: 'Error applying leave' });
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await Attendance.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user.id }).sort({ startDate: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const requestOvertime = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;
        let attendance = await getTodayRecord(userId);

        if (!attendance) {
            const now = new Date();
            attendance = new Attendance({
                companyId: req.user.companyId,
                userId,
                date: now,
                status: 'Absent'
            });
        }

        attendance.overtime.requested = true;
        attendance.overtime.message = message;
        attendance.overtime.status = 'Pending';
        await attendance.save();

        const user = await User.findById(userId);
        
        const adminNotification = new Notification({
            userId: req.user.companyId,
            companyId: req.user.companyId,
            title: '⏰ New Overtime Request',
            message: `${user.name} has requested overtime: "${message}"`,
            type: 'overtime',
            link: '/attendance'
        });
        await adminNotification.save();

        res.json({ message: 'Overtime request sent successfully', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const startOvertime = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await getTodayRecord(userId);

        if (!attendance || !attendance.overtime.requested) {
            return res.status(400).json({ message: 'Please request overtime first.' });
        }
        if (!attendance.punchOut) {
            return res.status(400).json({ message: 'Please punch out of your regular shift before starting overtime.' });
        }
        if (attendance.overtime.status !== 'Approved') {
            return res.status(400).json({ message: 'Overtime is not approved yet.' });
        }
        if (attendance.overtime.startTime) {
            return res.status(400).json({ message: 'Overtime already started.' });
        }

        const now = new Date();
        attendance.overtime.startTime = now;

        const company = await Company.findById(req.user.companyId);
        const closingTime = company.closingTime || '18:00';
        const [cH, cM] = closingTime.split(':').map(Number);
        const closingMoment = moment(attendance.date).set({ hour: cH, minute: cM, second: 0, millisecond: 0 });

        if (moment(now).isAfter(closingMoment)) {
            const autoBreak = moment(now).diff(closingMoment, 'minutes');
            attendance.overtime.autoBreakDuration = Math.max(0, autoBreak);
        }

        await attendance.save();
        res.json({ message: 'Overtime started', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const endOvertime = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await getTodayRecord(userId);

        if (!attendance || !attendance.overtime.startTime) {
            return res.status(400).json({ message: 'Overtime not started.' });
        }
        if (attendance.overtime.endTime) {
            return res.status(400).json({ message: 'Overtime already ended.' });
        }

        const now = new Date();
        attendance.overtime.endTime = now;

        const openBreak = attendance.overtime.breaks.find(b => !b.breakEnd);
        if (openBreak) {
            openBreak.breakEnd = now;
            openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
            attendance.overtime.breakDuration = (attendance.overtime.breakDuration || 0) + openBreak.duration;
        }

        const grossOTMins = moment(now).diff(moment(attendance.overtime.startTime), 'minutes');
        const netOTMins = grossOTMins - (attendance.overtime.breakDuration || 0);
        attendance.overtime.totalHours = Math.max(0, netOTMins / 60);

        // Recalculate salary to include OT
        const user = await User.findById(userId);
        const company = await Company.findById(req.user.companyId);

        if (user && user.monthlySalary) {
             const currentMonthIdx = moment(attendance.date).month();
             const workingDays = (company.monthlyWorkingDays && company.monthlyWorkingDays[currentMonthIdx]) || 26;
             const dailyFullSalary = user.monthlySalary / workingDays;
             
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
             const expectedHours = expectedNetMins / 60;

             const totalHours = (attendance.totalWorkHours || 0) + (attendance.overtime.totalHours || 0);
             const grossSalary = (dailyFullSalary / expectedHours) * totalHours;
             attendance.earnedSalary = Math.round(Math.max(0, grossSalary - (attendance.penaltyAmount || 0)));
        }

        await attendance.save();
        res.json({ message: 'Overtime ended', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const startOvertimeBreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await getTodayRecord(userId);

        if (!attendance || !attendance.overtime.startTime) return res.status(400).json({ message: 'Overtime not started.' });
        if (attendance.overtime.endTime) return res.status(400).json({ message: 'Overtime already ended.' });

        const openBreak = attendance.overtime.breaks.find(b => !b.breakEnd);
        if (openBreak) return res.status(400).json({ message: 'Already on overtime break.' });

        const now = new Date();
        attendance.overtime.breaks.push({ breakStart: now });
        await attendance.save();

        res.json({ message: 'Overtime break started', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const endOvertimeBreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const attendance = await getTodayRecord(userId);

        if (!attendance) return res.status(400).json({ message: 'No attendance record.' });

        const openBreak = attendance.overtime.breaks.find(b => !b.breakEnd);
        if (!openBreak) return res.status(400).json({ message: 'Not on overtime break.' });

        const now = new Date();
        openBreak.breakEnd = now;
        openBreak.duration = moment(now).diff(moment(openBreak.breakStart), 'minutes');
        attendance.overtime.breakDuration = (attendance.overtime.breakDuration || 0) + openBreak.duration;

        await attendance.save();
        res.json({ message: 'Overtime break ended', attendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getCompanyHolidays = async (req, res) => {
    try {
        const Holiday = require('../models/Holiday');
        const holidays = await Holiday.find({ companyId: req.user.companyId }).sort({ date: 1 });
        const company = await Company.findById(req.user.companyId).select('holidayConfig');
        res.json({ holidays, holidayConfig: company.holidayConfig });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getEmployeeDashboard,
    getCloudinarySignature,
    punchIn,
    punchOut,
    breakStart,
    breakEnd,
    applyLeave,
    getHistory,
    getLeaves,
    getCompanyHolidays,
    requestOvertime,
    startOvertime,
    endOvertime,
    startOvertimeBreak,
    endOvertimeBreak
};
