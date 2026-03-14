const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyEmail: { type: String, required: true },
    companyPhone: { type: String },
    address: { type: String },
    logo: { type: String },

    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },

    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    openingTime: { type: String, default: '09:00' },
    closingTime: { type: String, default: '18:00' },
    lunchStartTime: { type: String, default: '13:00' },
    lunchEndTime: { type: String, default: '14:00' },
    lateGracePeriod: { type: Number, default: 15 },
    monthlyWorkingDays: { type: [Number], default: [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26] }, // Array of 12 values for Jan to Dec
    holidayConfig: {
        type: String,
        enum: ['all-sundays', 'all-saturdays-sundays', '1-3-saturdays', '2-4-saturdays'],
        default: 'all-sundays'
    }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
