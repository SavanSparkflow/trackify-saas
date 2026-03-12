const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    employeeLimit: { type: Number, required: true },
    duration: { type: Number, required: true }, // in days
    features: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
