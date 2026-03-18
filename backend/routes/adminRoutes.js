const express = require('express');
const { protect, roleAuth } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/tenantMiddleware');
const {
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
    getHolidayConfig,
    updateHolidayConfig,
    kioskPunch,
    manualAttendance,
    updateLatePolicy,
    getEmployeesKiosk,
    getMonthlyAttendanceSheet,
    getLatePolicy
} = require('../controllers/adminController');
const { getRules, addRule, updateRule, deleteRule } = require('../controllers/ruleController');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');
const { getSalaries, paySalary, getSalaryHistory } = require('../controllers/salaryController');

const router = express.Router();

router.use(protect, roleAuth('admin'), checkSubscription);

router.get('/dashboard', getAdminDashboard);
router.post('/employees', addEmployee);
router.get('/employees', getEmployees);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.get('/attendance', getAttendance);
router.get('/reports', getReports);
router.get('/leaves', getLeaves);
router.get('/stats/weekly', getWeeklyStats);
router.patch('/leaves/:id/status', updateLeaveStatus);
router.get('/holidays', getHolidays);
router.post('/holidays', addHoliday);
router.delete('/holidays/:id', deleteHoliday);
router.get('/holiday-config', getHolidayConfig);
router.put('/holiday-config', updateHolidayConfig);
router.put('/overtime/:id/status', updateOvertimeStatus);
router.get('/kiosk/employees', getEmployeesKiosk);
router.post('/kiosk/punch', kioskPunch);
router.post('/attendance/manual', manualAttendance);
router.get('/attendance/sheet', getMonthlyAttendanceSheet);
router.get('/late-policy', getLatePolicy);
router.put('/late-policy', updateLatePolicy);

router.get('/rules', getRules);
router.post('/rules', addRule);
router.put('/rules/:id', updateRule);
router.delete('/rules/:id', deleteRule);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);
router.get('/salaries', getSalaries);
router.post('/salaries/pay', paySalary);
router.get('/salaries/history/:employeeId', getSalaryHistory);

module.exports = router;
