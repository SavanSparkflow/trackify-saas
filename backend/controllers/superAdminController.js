const Company = require('../models/Company');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const bcrypt = require('bcryptjs');

const getDashboardStats = async (req, res) => {
    try {
        const totalCompanies = await Company.countDocuments();
        const activeCompanies = await Company.countDocuments({ status: 'active' });
        const totalEmployees = await User.countDocuments({ role: 'employee' });

        // Example mock revenue: in real world sum up subscriptions
        const companies = await Company.find().populate('planId');
        let monthlyRevenue = 0;
        companies.forEach(company => {
            if (company.planId && company.status === 'active') {
                monthlyRevenue += (company.planId.price || 0);
            }
        });

        const expiredSubscriptions = await Company.countDocuments({
            subscriptionEnd: { $lt: new Date() }
        });

        const topCompanies = await Company.find().limit(5).sort({ createdAt: -1 });

        res.json({
            totalCompanies,
            activeCompanies,
            totalEmployees,
            monthlyRevenue,
            expiredSubscriptions,
            topCompanies
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const createCompany = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const company = new Company({
            ...req.body,
            password: hashedPassword
        });
        await company.save();
        res.status(201).json(company);
    } catch (err) {
        res.status(500).json({ message: 'Error creating company', error: err.message });
    }
};

const updateCompanyStatus = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(company);
    } catch (err) {
        res.status(500).json({ message: 'Error updating company status' });
    }
};

const updateCompany = async (req, res) => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(company);
    } catch (err) {
        res.status(500).json({ message: 'Error updating company details', error: err.message });
    }
};

const getPlans = async (req, res) => {
    const plans = await SubscriptionPlan.find();
    res.json(plans);
};

const createPlan = async (req, res) => {
    const plan = new SubscriptionPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
};

const updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: 'Error updating plan' });
    }
};

const deletePlan = async (req, res) => {
    try {
        await SubscriptionPlan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting plan' });
    }
};

const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find().populate('planId');
        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching companies' });
    }
};

const getRevenueAnalytics = async (req, res) => {
    try {
        const companies = await Company.find({ status: 'active' }).populate('planId');

        let totalSubscriptions = 0;
        let activeRevenue = 0;

        companies.forEach(company => {
            if (company.planId) {
                activeRevenue += (company.planId.price || 0);
                totalSubscriptions++;
            }
        });

        // Generate some visual chart data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        const revenueHistory = [];

        for (let i = 5; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            revenueHistory.push({
                name: monthNames[m],
                revenue: Math.floor(activeRevenue * (0.8 + Math.random() * 0.4)),
                companies: Math.floor(totalSubscriptions * (0.8 + Math.random() * 0.4))
            });
        }

        res.json({
            activeRevenue,
            totalSubscriptions,
            totalGrowth: 15.5, // Mock percentage
            revenueHistory
        });
    } catch (err) {
        res.status(500).json({ message: 'Revenue calculation error' });
    }
};

const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
};

const updateSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update settings' });
    }
};

module.exports = {
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
};

