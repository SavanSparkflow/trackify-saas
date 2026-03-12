import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CalendarHeart } from 'lucide-react';

export default function Holidays() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/holidays`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHolidays(res.data);
        } catch (err) {
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 font-bold text-slate-500">Loading holidays...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl max-w-7xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <CalendarHeart className="text-indigo-600" /> Company Holidays
                </h1>
                <p className="text-slate-500 font-medium mt-1">Upcoming official firm off-days configured by your admin.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50/50">Holiday Details</th>
                                <th className="p-5 text-sm font-black text-slate-500 uppercase tracking-widest bg-slate-50/50 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="p-8 text-center text-slate-400 font-bold">No holidays currently scheduled.</td>
                                </tr>
                            ) : holidays.map(holiday => (
                                <tr key={holiday._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5">
                                        <p className="font-bold text-slate-800 text-lg">{holiday.name}</p>
                                    </td>
                                    <td className="p-5 text-right">
                                        <p className="font-bold text-slate-600">
                                            {new Date(holiday.date).toLocaleDateString('en-US', {
                                                weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
