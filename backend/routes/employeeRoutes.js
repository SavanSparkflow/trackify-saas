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
    getCompanyHolidays
} = require('../controllers/employeeController');

const router = express.Router();

router.use(protect, roleAuth('employee'), checkSubscription);

router.get('/signature', getCloudinarySignature);
router.get('/dashboard', getEmployeeDashboard);
router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.post('/break/start', breakStart);
router.post('/break/end', breakEnd);
router.post('/leave', applyLeave);
router.get('/history', getHistory);
router.get('/leaves', getLeaves);
router.get('/holidays', getCompanyHolidays);

module.exports = router;
