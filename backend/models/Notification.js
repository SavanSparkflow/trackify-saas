const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['rule', 'leave', 'general'], default: 'general' },
    isRead: { type: Boolean, default: false },
    link: { type: String } // Optional: Link to navigate to
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
