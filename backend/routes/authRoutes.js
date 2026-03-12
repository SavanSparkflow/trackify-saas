const express = require('express');
const { loginUser, registerCompany, registerEmployee, getCompaniesPublic, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerCompany);
router.post('/employee/register', registerEmployee);
router.get('/companies', getCompaniesPublic);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
