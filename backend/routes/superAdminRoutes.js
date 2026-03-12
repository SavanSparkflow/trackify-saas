const express = require('express');
const { protect, roleAuth } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    createCompany,
    updateCompanyStatus,
    updateCompany,
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getCompanies,
    getRevenueAnalytics,
    getSystemSettings,
    updateSystemSettings
} = require('../controllers/superAdminController');

const router = express.Router();

router.use(protect, roleAuth('superadmin'));

router.get('/dashboard', getDashboardStats);

router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.patch('/companies/:id/status', updateCompanyStatus);
router.put('/companies/:id', updateCompany);

router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

router.get('/revenue', getRevenueAnalytics);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

module.exports = router;
