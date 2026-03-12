const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    siteName: { type: String, default: 'Trackify' },
    supportEmail: { type: String, default: 'support@trackify.com' },
    contactNumber: { type: String, default: '+1234567890' },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    currency: { type: String, default: 'USD' },
    taxPercentage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
