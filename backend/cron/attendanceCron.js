const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Company = require('../models/Company');

const markAbsentCron = () => {
    // Run at 11:59 PM every day
    cron.schedule('59 23 * * *', async () => {
        try {
            console.log('Running absent cron job');
            const date = new Date();
            date.setHours(0, 0, 0, 0);

            // Fetch all active companies
            const companies = await Company.find({ status: 'active' });
            for (let company of companies) {
                // Fetch active employees for company
                const employees = await User.find({ companyId: company._id, status: 'active', role: 'employee' });

                for (let employee of employees) {
                    const attendance = await Attendance.findOne({
                        userId: employee._id,
                        date: { $gte: date, $lte: new Date(date).setHours(23, 59, 59, 999) }
                    });

                    if (!attendance) {
                        await Attendance.create({
                            companyId: company._id,
                            userId: employee._id,
                            date: new Date(),
                            status: 'Absent'
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Cron job error', e);
        }
    });
};

module.exports = markAbsentCron;
