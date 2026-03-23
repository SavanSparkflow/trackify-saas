const { 
    getTodayRecord, 
    processPunchIn, 
    processPunchOut, 
    processBreakStart, 
    processBreakEnd 
} = require('../services/attendanceService');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Company = require('../models/Company');
const { emitToCompany } = require('../utils/socket');
const Notification = require('../models/Notification');
const moment = require('moment');

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
        const { location, photo } = req.body;
        const result = await processPunchIn({
            userId: req.user.id,
            companyId: req.user.companyId,
            location,
            photo,
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const punchOut = async (req, res) => {
    try {
        const { photo, location } = req.body;
        const result = await processPunchOut({
            userId: req.user.id,
            companyId: req.user.companyId,
            location,
            photo
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const breakStart = async (req, res) => {
    try {
        const { location } = req.body;
        const result = await processBreakStart({
            userId: req.user.id,
            companyId: req.user.companyId,
            location
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const breakEnd = async (req, res) => {
    try {
        const { location, photo } = req.body;
        const result = await processBreakEnd({
            userId: req.user.id,
            companyId: req.user.companyId,
            location,
            photo
        });
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const smartPunch = async (req, res) => {
    try {
        const { location, photo, action = 'auto' } = req.body;
        const userId = req.user.id;
        const companyId = req.user.companyId;

        const attendance = await getTodayRecord(userId);
        let result;

        if (action === 'auto') {
            if (!attendance || !attendance.punchIn) {
                // Automatically Punch In if not clocked in
                result = await processPunchIn({
                    userId,
                    companyId,
                    location: location || { lat: 0, lng: 0 },
                    photo: photo || 'Mobile App',
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
                });
            } else if (!attendance.punchOut) {
                // Already in? Demand a choice (Option 3)
                return res.status(200).json({ 
                    requiresActionChoice: true, 
                    status: attendance.breaks.find(b => !b.breakEnd) ? 'on_break' : 'punched_in',
                    message: 'What would you like to do?'
                });
            } else {
                return res.status(400).json({ message: 'Already finished shift for today.' });
            }
        } else if (action === 'break') {
            if (!attendance || !attendance.punchIn) {
                return res.status(400).json({ message: 'Must punch in before taking a break.' });
            }
            if (attendance.punchOut) {
                return res.status(400).json({ message: 'Already finished shift for today.' });
            }

            const openBreak = attendance.breaks.find(b => !b.breakEnd);
            if (openBreak) {
                result = await processBreakEnd({ userId, companyId, location: location || { lat: 0, lng: 0 }, photo });
            } else {
                result = await processBreakStart({ userId, companyId, location: location || { lat: 0, lng: 0 }, photo });
            }
        } else if (action === 'attendance') {
            // Explicit Attendance Action (Force Punch Out if already in)
            if (!attendance || !attendance.punchIn) {
                result = await processPunchIn({
                    userId,
                    companyId,
                    location: location || { lat: 0, lng: 0 },
                    photo: photo || 'Mobile App',
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
                });
            } else if (!attendance.punchOut) {
                result = await processPunchOut({ userId, companyId, location: location || { lat: 0, lng: 0 }, photo: photo || 'Mobile App' });
            } else {
                return res.status(400).json({ message: 'Already finished shift for today.' });
            }
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    endOvertimeBreak,
    smartPunch
};
