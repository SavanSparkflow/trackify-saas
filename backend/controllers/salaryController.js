const Salary = require('../models/Salary');
const User = require('../models/User');

const getSalaries = async (req, res) => {
    try {
        const { month, year, userId } = req.query;
        let query = { companyId: req.user.companyId };
        
        if (month) query.month = parseInt(month);
        if (year) query.year = parseInt(year);
        if (userId) query.userId = userId;

        const salaries = await Salary.find(query)
            .populate('userId', 'name email employeeId')
            .sort({ paymentDate: -1 });
        
        res.json(salaries);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salaries' });
    }
};

const paySalary = async (req, res) => {
    try {
        const { userId, month, year, basicSalary, bonus, deductions, totalPaid, paymentMethod, remarks } = req.body;

        // Check if already paid for this month/year
        const existing = await Salary.findOne({ companyId: req.user.companyId, userId, month, year });
        if (existing) {
            return res.status(400).json({ message: 'Salary already paid for this month/year' });
        }

        const salary = new Salary({
            companyId: req.user.companyId,
            userId,
            month,
            year,
            basicSalary,
            bonus,
            deductions,
            totalPaid,
            paymentMethod,
            remarks
        });

        await salary.save();
        res.status(201).json(salary);
    } catch (err) {
        res.status(500).json({ message: 'Error recording salary payment' });
    }
};

const getSalaryHistory = async (req, res) => {
    try {
        const employee = await User.findOne({ _id: req.params.employeeId, companyId: req.user.companyId })
            .select('name salaryHistory')
            .populate('salaryHistory.updatedBy', 'name');
        
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        
        res.json(employee.salaryHistory);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching salary history' });
    }
};

module.exports = {
    getSalaries,
    paySalary,
    getSalaryHistory
};
