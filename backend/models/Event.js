const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String }, // e.g., "10:00"
    location: { type: String },
    type: { type: String, enum: ['event', 'meeting', 'celebration', 'other'], default: 'event' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
