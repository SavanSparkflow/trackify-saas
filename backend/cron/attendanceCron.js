const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');
const moment = require('moment');

const markAbsentCron = () => {
    // 1. Absent Cron - Run at 11:59 PM every day
    cron.schedule('59 23 * * *', async () => {
        try {
            console.log('Running absent cron job');
            const date = new Date();
            date.setHours(0, 0, 0, 0);

            const companies = await Company.find({ status: 'active' });
            for (let company of companies) {
                const employees = await User.find({ companyId: company._id, status: 'active', role: 'employee' });

                for (let employee of employees) {
                    const attendance = await Attendance.findOne({
                        userId: employee._id,
                        date: { $gte: date, $lte: new Date(date).setHours(23, 59, 59, 999) }
                    });

                    if (!attendance) {
                        await Attendance.create({
                            companyId: company._id,
                            userId: employee._id,
                            date: new Date(),
                            status: 'Absent'
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Absent cron error', e);
        }
    });

    // 2. Auto Punch-Out Cron - Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
        try {
            console.log('Running Auto Punch-Out check...');
            const Rule = require('../models/Rule');
            const today = moment().startOf('day').toDate();
            const nowMoment = moment();

            // Find all attendance records where punchOut is null and status is not Absent
            const activeAttendances = await Attendance.find({
                date: { $gte: today },
                punchOut: null,
                status: { $ne: 'Absent' }
            });

            for (let attendance of activeAttendances) {
                const user = await User.findById(attendance.userId);
                if (!user) continue;

                const company = await Company.findById(attendance.companyId);
                if (!company) continue;

                // Priority: User shiftEnd > Company closingTime
                const endTimeStr = user.shiftEnd || company.closingTime || '18:00';
                
                // Construct shift end moment for today
                const [hrs, mins] = endTimeStr.split(':');
                const shiftEndMoment = moment().set({ hour: hrs, minute: mins, second: 0 });

                // If current time is past shift end time
                if (nowMoment.isAfter(shiftEndMoment)) {
                    console.log(`Auto Punching Out user: ${user.name}`);

                    // Use shift end time as punch out time for fairness, or current time? 
                    // Usually auto punch out happens AT the shift end or when it's detected it passed.
                    const punchOutTime = shiftEndMoment.toDate();
                    
                    // Close open breaks
                    const openBreak = attendance.breaks.find(b => !b.breakEnd);
                    if (openBreak) {
                        openBreak.breakEnd = punchOutTime;
                        openBreak.duration = moment(punchOutTime).diff(moment(openBreak.breakStart), 'minutes');
                        attendance.totalBreakTime = (attendance.totalBreakTime || 0) + openBreak.duration;

                        // Late Break Penalty Logic
                        if (company && company.lunchEndTime) {
                            const [leH, leM] = company.lunchEndTime.split(':').map(Number);
                            const lunchEndMoment = moment(punchOutTime).set({ hour: leH, minute: leM, second: 0, millisecond: 0 });
                            if (moment(openBreak.breakStart).isBefore(lunchEndMoment) && moment(punchOutTime).isAfter(lunchEndMoment)) {
                                const lateMins = moment(punchOutTime).diff(lunchEndMoment, 'minutes');
                                if (lateMins > 0) {
                                    attendance.lateBreakMinutes = (attendance.lateBreakMinutes || 0) + lateMins;
                                }
                            }
                        }
                    }

                    attendance.punchOut = punchOutTime;
                    attendance.locationOut = "Auto Punch Out";

                    // Calculate early punch-in adjustment
                    const shiftStartStr = user.shiftStart || company.openingTime || '09:00';
                    const [sH, sM] = shiftStartStr.split(':').map(Number);
                    const shiftStartMoment = moment(attendance.date).set({ hour: sH, minute: sM, second: 0, millisecond: 0 });

                    let effectivePunchIn = attendance.punchIn;
                    if (moment(attendance.punchIn).isBefore(shiftStartMoment)) {
                        effectivePunchIn = shiftStartMoment.toDate();
                    }

                    const grossMinutes = moment(punchOutTime).diff(moment(effectivePunchIn), 'minutes');
                    const netMinutes = grossMinutes - (attendance.totalBreakTime || 0) - (attendance.lateBreakMinutes || 0);
                    attendance.totalWorkHours = Math.max(0, netMinutes / 60);

                    // Default thresholds (dynamically removed from rules by user request)
                    const halfDayHrs = 4;
                    const fullDayHrs = 8;

                    if (attendance.totalWorkHours < halfDayHrs) {
                        attendance.status = 'Absent';
                    } else if (attendance.totalWorkHours < fullDayHrs) {
                        attendance.status = 'Half Day';
                    } else {
                        attendance.status = 'Present';
                    }

                    await attendance.save();
                }
            }
        } catch (e) {
            console.error('Auto Punch Out cron error', e);
        }
    });
};

module.exports = markAbsentCron;
