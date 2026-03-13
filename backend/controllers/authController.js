const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helper = require('../utils/helper');

const generateToken = (id, role, companyId) => {
    return jwt.sign({ id, role, companyId }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

const registerCompany = async (req, res) => {
    try {
        const { companyName, companyEmail, ownerName, ownerEmail: rawOwnerEmail, password } = req.body;
        const ownerEmail = rawOwnerEmail.toLowerCase().trim();

        console.log(`[Register Company] Email: ${ownerEmail}`);

        let existingUser = await User.findOne({ email: ownerEmail });
        let existingCompany = await Company.findOne({ ownerEmail });

        if (existingUser || existingCompany) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const newCompany = new Company({
            companyName,
            companyEmail: companyEmail.toLowerCase(),
            ownerName,
            ownerEmail,
            role: req.body.role || 'admin',
            password: await helper.passwordEncryptor(password),
            status: 'active'
        });

        await newCompany.save();

        res.status(201).json({
            _id: newCompany._id,
            name: newCompany.ownerName,
            email: newCompany.ownerEmail,
            role: newCompany.role,
            companyId: newCompany._id,
            token: generateToken(newCompany._id, newCompany.role, newCompany._id),
            message: 'Registration Successful'
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const getCompaniesPublic = async (req, res) => {
    try {
        const companies = await Company.find({ status: 'active' }).select('companyName _id');
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching companies' });
    }
};

const registerEmployee = async (req, res) => {
    try {
        const { name, email: rawEmail, password, companyId, phone, parentPhone } = req.body;
        const email = rawEmail.toLowerCase().trim();

        let existingUser = await User.findOne({ email });
        let existingCompany = await Company.findOne({ ownerEmail: email });

        if (existingUser || existingCompany) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const validCompany = await Company.findById(companyId);
        if (!validCompany || validCompany.status !== 'active') {
            return res.status(400).json({ message: 'Invalid or inactive company selected' });
        }

        const newUser = new User({
            name,
            email,
            password: await helper.passwordEncryptor(password),
            role: 'employee',
            companyId: validCompany._id,
            phone,
            parentPhone,
            status: 'active'
        });

        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: 'employee',
            companyId: newUser.companyId,
            token: generateToken(newUser._id, 'employee', newUser.companyId),
            message: 'Employee Registration Successful'
        });

    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error during employee registration' });
    }
};

const loginUser = async (req, res) => {
    const { email: rawEmail, password, panel } = req.body;
    const email = rawEmail.toLowerCase().trim();

    try {
        if (email === 'super@trackify.com' && password === 'admin123') {
            if (panel === 'employee') {
                return res.status(403).json({ message: 'Superadmin cannot login from employee panel' });
            }
            return res.json({
                _id: 'superadmin_id',
                name: 'Super Admin',
                email: 'super@trackify.com',
                role: 'superadmin',
                companyId: null,
                token: generateToken('superadmin_id', 'superadmin', null),
            });
        }

        let isCompanyOwner = false;
        let company = await Company.findOne({
            $or: [
                { ownerEmail: { $regex: new RegExp(`^${email}$`, 'i') } },
                { companyEmail: { $regex: new RegExp(`^${email}$`, 'i') } }
            ]
        });

        if (company) {
            const decPass = await helper.passwordDecryptor(company.password);
            if (decPass === password) {
                isCompanyOwner = true;
            } else if (await bcrypt.compare(password, company.password)) {
                isCompanyOwner = true;
            }
        }

        let user;
        if (!isCompanyOwner) {
            user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const decPass = await helper.passwordDecryptor(user.password);
            if (decPass !== password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            }
        }

        if (panel === 'admin' && !isCompanyOwner) {
            return res.status(403).json({ message: 'Employees cannot log into the Admin panel' });
        }

        if (panel === 'employee' && isCompanyOwner) {
            return res.status(403).json({ message: 'Company Admins cannot log into the Employee panel' });
        }

        if (isCompanyOwner) {
            const companyRole = company.role || 'admin';
            res.json({
                _id: company._id,
                name: company.ownerName,
                email: company.ownerEmail,
                role: companyRole,
                companyId: company._id,
                token: generateToken(company._id, companyRole, company._id),
            });
        } else {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                token: generateToken(user._id, user.role, user.companyId),
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error parsing login' });
    }
};

const getMe = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const company = await Company.findById(req.user.id);
            return res.json({
                name: company.ownerName,
                companyName: company.companyName,
                email: company.ownerEmail,
                role: 'admin',
                phone: company.companyPhone,
                address: company.address,
                openingTime: company.openingTime,
                closingTime: company.closingTime,
                lunchStartTime: company.lunchStartTime,
                lunchEndTime: company.lunchEndTime,
                lateGracePeriod: company.lateGracePeriod,
                monthlyWorkingDays: company.monthlyWorkingDays || [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26]
            });
        }

        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
}

const updateProfile = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const company = await Company.findByIdAndUpdate(req.user.id, req.body, { new: true });
            return res.json(company);
        }

        const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
}

module.exports = { loginUser, registerCompany, registerEmployee, getCompaniesPublic, getMe, updateProfile };
