const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
