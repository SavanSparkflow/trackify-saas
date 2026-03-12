const Company = require('../models/Company');

const checkSubscription = async (req, res, next) => {
    if (req.user.role === 'superadmin') return next();
    try {
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        if (company.status !== 'active') return res.status(403).json({ message: 'Company is inactive' });
        if (company.subscriptionEnd && new Date(company.subscriptionEnd) < new Date()) {
            return res.status(403).json({ message: 'Subscription expired.' });
        }
        req.company = company;
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error tenantMiddleware' });
    }
};

module.exports = { checkSubscription };
