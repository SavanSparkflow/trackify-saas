import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, CalendarHeart } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Holidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', date: '' });
    const [holidayConfig, setHolidayConfig] = useState('all-sundays');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchHolidays();
        fetchHolidayConfig();
    }, [currentPage]);

    const fetchHolidayConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/holiday-config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidayConfig(res.data.holidayConfig || 'all-sundays');
        } catch (err) {
            console.error('Failed to load holiday config');
        }
    };

    const updateHolidayConfig = async (newConfig) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/admin/holiday-config`, { holidayConfig: newConfig }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidayConfig(newConfig);
            toast.success('Holiday policy updated');
        } catch (err) {
            toast.error('Failed to update policy');
        }
    };

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/holidays`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: itemsPerPage
                }
            });
            setHolidays(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/admin/holidays`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Holiday added');
            setShowModal(false);
            setFormData({ name: '', date: '' });
            fetchHolidays();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error adding holiday');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/admin/holidays/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Holiday deleted');
            fetchHolidays();
        } catch (err) {
            toast.error('Error deleting holiday');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    if (loading) return <div className="p-8 font-bold text-slate-500">Loading holidays...</div>;

    return (
        <div className="p-4 md:p-8 max-w-8xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <CalendarHeart className="text-blue-600" /> Holidays
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage company-wide holidays and off-days.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200"
                >
                    <Plus size={20} /> Add Holiday
                </button>
            </div>

            {/* Weekend Policy Section */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8">
                <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarHeart className="text-rose-500" size={24} /> Weekend Holiday Policy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { id: 'all-sundays', label: 'Only Sundays Off', desc: 'Every Sunday' },
                        { id: 'all-saturdays-sundays', label: 'Sat & Sun Off', desc: 'Full Weekends' },
                        { id: '1-3-saturdays', label: '1st & 3rd Sat Off', desc: 'Plus All Sundays' },
                        { id: '2-4-saturdays', label: '2nd & 4th Sat Off', desc: 'Plus All Sundays' },
                    ].map((policy) => (
                        <div
                            key={policy.id}
                            onClick={() => updateHolidayConfig(policy.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                holidayConfig === policy.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-100 hover:border-blue-200'
                            }`}
                        >
                            <p className={`font-black ${holidayConfig === policy.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                {policy.label}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{policy.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">Details</th>
                                <th className="p-5 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50/50 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="p-8 text-center text-slate-400 font-bold">No holidays added yet.</td>
                                </tr>
                            ) : holidays.map(holiday => (
                                <tr key={holiday._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5">
                                        <p className="font-bold text-slate-800 text-lg">{holiday.name}</p>
                                        <p className="text-sm font-bold text-slate-400 tracking-wide mt-1">
                                            {new Date(holiday.date).toLocaleDateString('en-US', {
                                                weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button onClick={() => handleDelete(holiday._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[999999]">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Add New Holiday</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Holiday Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    placeholder="e.g. Diwali"
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
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                                    Add Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
