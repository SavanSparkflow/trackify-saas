const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { emitToCompany } = require('../utils/socket');

// Admin: Create Event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, time, location, type } = req.body;
        const companyId = req.user.companyId;

        const event = new Event({
            companyId,
            title,
            description,
            date,
            time,
            location,
            type
        });

        await event.save();

        // Notify all employees of this company
        const employees = await User.find({ companyId, role: 'employee', status: 'active' });
        
        const notifications = employees.map(emp => ({
            userId: emp._id,
            companyId,
            title: `New Event: ${title}`,
            message: `A new event "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}.`,
            type: 'general'
        }));

        await Notification.insertMany(notifications);

        // Real-time notification via Socket.io
        emitToCompany(companyId, 'notification', {
            title: `📢 New Event: ${title}`,
            message: `A new event has been scheduled for ${new Date(date).toLocaleDateString()}.`,
            type: 'general'
        });

        // Optional: Send WhatsApp notification
        for (const emp of employees) {
            if (emp.phone) {
                const waMessage = `📢 *New Event: ${title}*\n\n📅 Date: ${new Date(date).toLocaleDateString()}\n🕒 Time: ${time || 'N/A'}\n📍 Location: ${location || 'N/A'}\n\n${description || ''}\n\nRegards,\nTrackify Team`;
                // We don't await each to avoid blocking, but in production consider a queue
                sendWhatsAppMessage(emp.phone, waMessage).catch(err => console.error("WA Error:", err));
            }
        }

        res.status(201).json({ message: 'Event created and notifications sent', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all events for a company (Admin/Employee)
exports.getEvents = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const events = await Event.find({ companyId }).sort({ date: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Delete Event
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await Event.findOneAndDelete({ _id: id, companyId: req.user.companyId });
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: Update Event
exports.updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: id, companyId: req.user.companyId },
            req.body,
            { new: true }
        );
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
