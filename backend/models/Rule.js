const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Text of the rule

    weeklyOff: { type: [String], default: ['Sunday'] }, // ['Sunday', 'Saturday']
    
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Rule', ruleSchema);
