const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Holiday = require('../models/Holiday');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const { emitToUser } = require('../utils/socket');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../config/cloudinary');
const helper = require('../utils/helper');

const getAdminDashboard = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const totalEmployees = await User.countDocuments({ companyId, role: 'employee' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const presentToday = await Attendance.countDocuments({ companyId, date: { $gte: todayStart }, status: 'Present' });
        const onLeave = await Leave.countDocuments({ companyId, status: 'Approved', startDate: { $lte: todayStart }, endDate: { $gte: todayStart } });
        const lateEmployees = 0; // custom logic for late

        // recent attendance
        const recentAttendance = await Attendance.find({ companyId }).sort({ createdAt: -1 }).limit(10).populate('userId', 'name email');

        res.json({
            totalEmployees,
            presentToday,
            lateEmployees,
            onLeave,
            recentAttendance
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
}

const addEmployee = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let attendancePhoto = req.body.attendancePhoto;
        if (attendancePhoto && attendancePhoto.startsWith('data:image')) {
            const url = await uploadToCloudinary(attendancePhoto, 'profiles');
            if (url) attendancePhoto = url;
        }

        const employee = new User({
            ...req.body,
            attendancePhoto,
            email: req.body.email.toLowerCase().trim(),
            companyId: req.user.companyId,
            role: 'employee',
            password: await helper.passwordEncryptor(req.body.password)
        });
        await employee.save();
        
        const empObj = employee.toObject();
        if (empObj.password) {
            empObj.password = await helper.passwordDecryptor(empObj.password);
        }
        res.status(201).json(empObj);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists in the system.` });
        }
        res.status(500).json({ message: err.message || 'Error adding employee' });
    }
}

const getEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search } = req.query;

        let query = { companyId: req.user.companyId, role: 'employee' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await User.find(query)
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        // Decrypt password for admin view
        const decryptedEmployees = await Promise.all(employees.map(async (emp) => {
            const empObj = emp.toObject();
            if (empObj.password) {
                empObj.password = await helper.passwordDecryptor(empObj.password);
            }
            return empObj;
        }));

        res.json({
            data: decryptedEmployees,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employees' });
    }
}

const updateEmployee = async (req, res) => {
    try {
        const { password, ...updateData } = req.body;

        if (password) {
            updateData.password = await helper.passwordEncryptor(password);
        }

        if (updateData.email) {
            updateData.email = updateData.email.toLowerCase();
        }

        let currentAttendancePhoto = req.body.attendancePhoto;
        if (currentAttendancePhoto && currentAttendancePhoto.startsWith('data:image')) {
            const url = await uploadToCloudinary(currentAttendancePhoto, 'profiles');
            if (url) updateData.attendancePhoto = url;
        } else if (currentAttendancePhoto) {
            updateData.attendancePhoto = currentAttendancePhoto;
        }

        const existingEmployee = await User.findOne({ _id: req.params.id, companyId: req.user.companyId });
        if (!existingEmployee) return res.status(404).json({ message: 'Employee not found' });

        // Salary history tracking
        if (updateData.monthlySalary && Number(updateData.monthlySalary) !== existingEmployee.monthlySalary) {
            updateData.$push = {
                salaryHistory: {
                    oldSalary: existingEmployee.monthlySalary,
                    newSalary: Number(updateData.monthlySalary),
                    updatedBy: req.user.id,
                    updatedAt: new Date()
                }
            };
        }

        const employee = await User.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            updateData,
            { new: true }
        );

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const empObj = employee.toObject();
        if (empObj.password) {
            empObj.password = await helper.passwordDecryptor(empObj.password);
        }
        res.json(empObj);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.` });
        }
        res.status(500).json({ message: 'Error updating employee' });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting employee' });
    }
}

const getAttendance = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, date } = req.query;

        let query = { companyId: req.user.companyId };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        if (search) {
            const users = await User.find({
                companyId: req.user.companyId,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const attendance = await Attendance.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Attendance.countDocuments(query);

        res.json({
            data: attendance,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
}

const getLeaves = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search } = req.query;

        let query = { companyId: req.user.companyId };

        if (search) {
            const users = await User.find({
                companyId: req.user.companyId,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const leaves = await Leave.find(query)
            .populate('userId', 'name email')
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Leave.countDocuments(query);

        res.json({
            data: leaves,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching leaves' });
    }
}

const updateLeaveStatus = async (req, res) => {
    try {
        const leave = await Leave.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            { status: req.body.status },
            { new: true }
        );
        
        if (leave) {
            const statusLabel = req.body.status === 'Approved' ? '✅ Approved' : (req.body.status === 'Rejected' ? '❌ Rejected' : req.body.status);
            
            // Create DB Notification
            const notification = new Notification({
                userId: leave.userId,
                companyId: req.user.companyId,
                title: `Leave ${req.body.status}`,
                message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} has been ${req.body.status.toLowerCase()}.`,
                type: 'leave',
                link: '/leaves'
            });
            await notification.save();

            // Emit via Socket
            emitToUser(leave.userId, 'notification', {
                title: `Leave ${statusLabel}`,
                message: `Your leave request has been ${req.body.status.toLowerCase()}.`,
                type: 'leave'
            });
        }

        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: 'Error updating leave status' });
    }
}

const getWeeklyStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const stats = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const present = await Attendance.countDocuments({ companyId, date: { $gte: date, $lt: nextDate }, status: 'Present' });
            const late = await Attendance.countDocuments({ companyId, date: { $gte: date, $lt: nextDate }, status: 'Late' });
            const absentArr = await Attendance.countDocuments({ companyId, date: { $gte: date, $lt: nextDate }, status: 'Absent' });

            stats.push({ day: dayName, present, late, absent: absentArr });
        }

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching weekly stats' });
    }
}

const getReports = async (req, res) => {
    try {
        const { month, year, employeeId, page = 1, limit = 5 } = req.query;
        const companyId = req.user.companyId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let usersQuery = { companyId, role: 'employee' };
        if (employeeId) {
            usersQuery._id = employeeId;
        }

        const totalEmployees = await User.countDocuments(usersQuery);
        const employees = await User.find(usersQuery, 'name email phone parentPhone monthlySalary shiftStart')
            .skip(skip)
            .limit(limitNum);

        // Fetch attendance only for the paginated employees
        const empIds = employees.map(emp => emp._id);
        let matchQuery = { companyId, userId: { $in: empIds } };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            matchQuery.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(matchQuery)
            .populate('userId', 'name email phone parentPhone monthlySalary')
            .sort({ date: -1 });

        // Decrypt password for reports view
        const decryptedEmployees = await Promise.all(employees.map(async (emp) => {
            const empObj = emp.toObject();
            if (empObj.password) {
                empObj.password = await helper.passwordDecryptor(empObj.password);
            }
            return empObj;
        }));

        const company = await Company.findById(companyId);

        res.json({
            attendance,
            employees: decryptedEmployees,
            company,
            total: totalEmployees,
            page: pageNum,
            totalPages: Math.ceil(totalEmployees / limitNum)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching reports' });
    }
}

const getHolidays = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const holidays = await Holiday.find({ companyId: req.user.companyId })
            .sort({ date: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Holiday.countDocuments({ companyId: req.user.companyId });

        res.json({
            data: holidays,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching holidays' });
    }
}

const addHoliday = async (req, res) => {
    try {
        const { name, date } = req.body;
        const holiday = new Holiday({
            companyId: req.user.companyId,
            name,
            date
        });
        await holiday.save();
        res.status(201).json(holiday);
    } catch (err) {
        res.status(500).json({ message: 'Error adding holiday' });
    }
}

const deleteHoliday = async (req, res) => {
    try {
        await Holiday.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        res.json({ message: 'Holiday deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting holiday' });
    }
}

const updateOvertimeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const attendance = await Attendance.findOne({
            _id: req.params.id,
            companyId: req.user.companyId
        });

        if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

        attendance.overtime.status = status;
        attendance.overtime.approvedBy = req.user.id;
        await attendance.save();

        const statusLabel = status === 'Approved' ? '✅ Approved' : (status === 'Rejected' ? '❌ Rejected' : status);
        
        const notification = new Notification({
            userId: attendance.userId,
            companyId: req.user.companyId,
            title: `Overtime ${status}`,
            message: `Your overtime request for ${new Date(attendance.date).toLocaleDateString()} has been ${status.toLowerCase()}.`,
            type: 'overtime',
            link: '/dashboard'
        });
        await notification.save();

        emitToUser(attendance.userId, 'notification', {
            title: `Overtime ${statusLabel}`,
            message: `Your overtime request has been ${status.toLowerCase()}.`,
            type: 'overtime'
        });

        res.json({ message: `Overtime ${status.toLowerCase()} successfully`, attendance });
    } catch (err) {
        res.status(500).json({ message: 'Error updating overtime status' });
    }
}

module.exports = {
    getAdminDashboard,
    addEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee,
    getAttendance,
    getLeaves,
    getWeeklyStats,
    updateLeaveStatus,
    getReports,
    getHolidays,
    addHoliday,
    deleteHoliday,
    updateOvertimeStatus,
    getHolidayConfig: async (req, res) => {
        try {
            const company = await Company.findById(req.user.companyId).select('holidayConfig');
            res.json(company);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching holiday config' });
        }
    },
    updateHolidayConfig: async (req, res) => {
        try {
            const { holidayConfig } = req.body;
            const company = await Company.findByIdAndUpdate(
                req.user.companyId,
                { holidayConfig },
                { new: true }
            ).select('holidayConfig');
            res.json(company);
        } catch (err) {
            res.status(500).json({ message: 'Error updating holiday config' });
        }
    }
};
