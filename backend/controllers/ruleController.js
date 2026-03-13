const Rule = require('../models/Rule');
const { emitToCompany } = require('../utils/socket');
const Notification = require('../models/Notification');
const User = require('../models/User');

const getRules = async (req, res) => {
    try {
        const rules = await Rule.find({ companyId: req.user.companyId });
        res.json(rules);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching rules' });
    }
};

const addRule = async (req, res) => {
    try {
        const rule = new Rule({
            ...req.body,
            companyId: req.user.companyId
        });
        await rule.save();

        // Notify employees via Socket
        emitToCompany(req.user.companyId, 'new_rule', {
            title: rule.title,
            message: 'New rules and regulations added.'
        });

        // Save notifications to DB for all employees
        const employees = await User.find({ companyId: req.user.companyId, role: 'employee' });
        const notifications = employees.map(emp => ({
            userId: emp._id,
            companyId: req.user.companyId,
            title: '📜 New Rule Added',
            message: rule.title,
            type: 'rule',
            link: '/rules'
        }));
        await Notification.insertMany(notifications);

        res.status(201).json(rule);
    } catch (err) {
        res.status(500).json({ message: 'Error adding rule' });
    }
};

const updateRule = async (req, res) => {
    try {
        const rule = await Rule.findOneAndUpdate(
            { _id: req.params.id, companyId: req.user.companyId },
            req.body,
            { new: true }
        );
        if (!rule) return res.status(404).json({ message: 'Rule not found' });

        // Notify employees
        emitToCompany(req.user.companyId, 'rule_updated', {
            title: rule.title,
            message: 'Rules and regulations updated.'
        });

        // Save notifications to DB for all employees
        const employees = await User.find({ companyId: req.user.companyId, role: 'employee' });
        const notifications = employees.map(emp => ({
            userId: emp._id,
            companyId: req.user.companyId,
            title: '⚖️ Rule Updated',
            message: rule.title,
            type: 'rule',
            link: '/rules'
        }));
        await Notification.insertMany(notifications);

        res.json(rule);
    } catch (err) {
        res.status(500).json({ message: 'Error updating rule' });
    }
};

const deleteRule = async (req, res) => {
    try {
        const rule = await Rule.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json({ message: 'Rule deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting rule' });
    }
};

module.exports = {
    getRules,
    addRule,
    updateRule,
    deleteRule
};
