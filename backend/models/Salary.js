const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    
    basicSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    totalPaid: { type: Number, required: true },
    
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'Online'], required: true },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
    
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Salary', salarySchema);
