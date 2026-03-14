const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const birthdayCron = () => {
    // Run every morning at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Birthday Check Cron Job...');
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            // Find users who have birthday today
            const birthdayUsers = await User.find({
                status: 'active',
                role: 'employee',
                dob: { $exists: true }
            });

            const todayBirthdayUsers = birthdayUsers.filter(user => {
                const dob = new Date(user.dob);
                return (dob.getMonth() + 1) === month && dob.getDate() === day;
            });

            for (const user of todayBirthdayUsers) {
                // Send in-app notification
                await Notification.create({
                    userId: user._id,
                    companyId: user.companyId,
                    title: 'Happy Birthday! 🎂',
                    message: `Wishing you a very Happy Birthday, ${user.name}! Have a fantastic day!`,
                    type: 'general'
                });

                // Send WhatsApp notification
                if (user.phone) {
                    const waMessage = `🎉 *Happy Birthday, ${user.name}!* 🎂\n\nWishing you a wonderful day filled with joy and success. Team Trackify is happy to have you with us!\n\nHave a great one! 🎈`;
                    sendWhatsAppMessage(user.phone, waMessage).catch(err => console.error("Birthday WA Error:", err));
                }
            }
        } catch (error) {
            console.error('Error in Birthday Cron:', error);
        }
    });
};

module.exports = birthdayCron;
