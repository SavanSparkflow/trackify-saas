const express = require('express');
const { protect, roleAuth } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/tenantMiddleware');
const {
    getEmployeeDashboard,
    punchIn,
    punchOut,
    breakStart,
    breakEnd,
    applyLeave,
    getHistory,
    getLeaves,
    getCloudinarySignature,
    getCompanyHolidays,
    requestOvertime,
    startOvertime,
    endOvertime,
    startOvertimeBreak,
    endOvertimeBreak,
    smartPunch
} = require('../controllers/employeeController');
const { getRules } = require('../controllers/ruleController');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationController');

const router = express.Router();

router.use(protect, roleAuth('employee'), checkSubscription);

router.get('/signature', getCloudinarySignature);
router.get('/dashboard', getEmployeeDashboard);
router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.post('/break/start', breakStart);
router.post('/break/end', breakEnd);
router.post('/smart-punch', smartPunch);
router.post('/leave', applyLeave);
router.post('/overtime/request', requestOvertime);
router.post('/overtime/start', startOvertime);
router.post('/overtime/end', endOvertime);
router.post('/overtime/break/start', startOvertimeBreak);
router.post('/overtime/break/end', endOvertimeBreak);

router.get('/history', getHistory);
router.get('/leaves', getLeaves);
router.get('/holidays', getCompanyHolidays);
router.get('/rules', getRules);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);
router.put('/notifications/read-all', markAllAsRead);
router.delete('/notifications/:id', deleteNotification);

module.exports = router;
