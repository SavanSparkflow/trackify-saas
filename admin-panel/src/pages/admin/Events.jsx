import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarDays, MapPin, Clock, Info } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        type: 'event'
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchEvents();
    }, [currentPage]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/events`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: itemsPerPage
                }
            });
            // Backend returns array directly in current implementation, if paginated it would be res.data.data
            setEvents(res.data);
            // setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/events`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Event created and notifications sent!');
            setShowModal(false);
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                type: 'event'
            });
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error creating event');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Event deleted');
            fetchEvents();
        } catch (err) {
            toast.error('Error deleting event');
        }
    };

    if (loading) return <div className="p-8 font-bold text-slate-500 text-center">Loading events...</div>;

    return (
        <div className="p-4 md:p-8 max-w-8xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-blue-600" /> Event Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Schedule events and notify all employees automatically.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200"
                >
                    <Plus size={20} /> Create Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 ? (
                    <div className="col-span-full bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                        <Info className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-xl font-bold text-slate-400">No events scheduled yet.</p>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="mt-4 text-blue-600 font-bold hover:underline"
                        >
                            Create your first event
                        </button>
                    </div>
                ) : events.map(event => (
                    <div key={event._id} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 hover:shadow-xl transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(event._id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        
                        <div className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider mb-4">
                            {event.type}
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 mb-2 truncate pr-8">{event.title}</h3>
                        <p className="text-slate-500 text-sm mb-6 line-clamp-2 h-10">{event.description || 'No description provided.'}</p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                <CalendarDays size={16} className="text-blue-500" />
                                {new Date(event.date).toLocaleDateString('en-US', {
                                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                                })}
                            </div>
                            {event.time && (
                                <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                    <Clock size={16} className="text-blue-500" />
                                    {event.time}
                                </div>
                            )}
                            {event.location && (
                                <div className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                    <MapPin size={16} className="text-blue-500" />
                                    {event.location}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Create New Event</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="e.g. Annual Meetup"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium h-24 resize-none"
                                        placeholder="Tell employees about the event..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="e.g. Conference Hall B"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
