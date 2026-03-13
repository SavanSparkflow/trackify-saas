const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: false },

    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: { type: String, enum: ['superadmin', 'admin', 'employee'], required: true },

    phone: { type: String },
    parentPhone: { type: String },

    department: { type: String },
    employeeId: { type: String },
    attendancePhoto: { type: String }, // Base64 or URL for face matching

    shiftStart: { type: String }, // e.g. "09:00"
    shiftEnd: { type: String },   // e.g. "18:00"
    latePenaltyRate: { type: Number, default: 0 },
    monthlySalary: { type: Number, default: 0 },
    salaryHistory: [
        {
            oldSalary: Number,
            newSalary: Number,
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            updatedAt: { type: Date, default: Date.now }
        }
    ],

    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
