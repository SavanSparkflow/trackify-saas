const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: Date, required: true },

    punchIn: { type: Date },
    punchOut: { type: Date },

    breaks: [
        {
            breakStart: { type: Date },
            breakEnd: { type: Date },
            duration: { type: Number, default: 0 }, // Minutes
            locationStart: {
                lat: { type: Number },
                lng: { type: Number }
            },
            locationEnd: {
                lat: { type: Number },
                lng: { type: Number }
            }
        }
    ],

    totalWorkHours: { type: Number, default: 0 },
    totalBreakTime: { type: Number, default: 0 },
    lateBreakMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    penaltyAmount: { type: Number, default: 0 },
    penaltyDays: { type: Number, default: 0 }, // Deduced days
    earnedSalary: { type: Number, default: 0 },

    ipAddress: { type: String },
    locationIn: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    locationOut: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    location: { // Legacy field, keeping it for now
        lat: { type: Number },
        lng: { type: Number }
    },
    photo: { type: String },
    photoOut: { type: String },

    status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'On Leave', 'Late'], default: 'Present' },

    overtime: {
        requested: { type: Boolean, default: false },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        message: { type: String },
        startTime: { type: Date },
        endTime: { type: Date },
        breaks: [
            {
                breakStart: { type: Date },
                breakEnd: { type: Date },
                duration: { type: Number, default: 0 } // Minutes
            }
        ],
        totalHours: { type: Number, default: 0 }, // Hours
        breakDuration: { type: Number, default: 0 }, // Minutes
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        autoBreakDuration: { type: Number, default: 0 } // Minutes between shift end and OT start
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
