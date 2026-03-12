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
    deleteHoliday
} = require('../controllers/adminController');

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

module.exports = router;
