import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, Calendar, Clock, Coffee, Timer } from 'lucide-react';

export default function MyAttendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchHistory();
    }, [month]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Simple filtering for selected month on frontend for now
            const filtered = res.data.filter(r => r.date.startsWith(month));
            setRecords(filtered);
        } catch (err) {
            toast.error('Failed to load attendance history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatHours = (hours) => {
        if (!hours) return '00h 00m 00s';
        const totalSecs = Math.round(hours * 3600);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700';
            case 'Late': return 'bg-amber-100 text-amber-700';
            case 'Absent': return 'bg-rose-100 text-rose-700';
            case 'On Leave': return 'bg-blue-100 text-blue-700';
            case 'Half Day': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-8xl space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800">Attendance History</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest font-bold">Review your past work logs & performance</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="month"
                            className="pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm bg-white"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-widest text-[10px] font-black text-slate-400">
                                <th className="p-6">Date</th>
                                <th className="p-6"><div className="flex items-center gap-2"><Clock size={14} /> Punch In</div></th>
                                <th className="p-6"><div className="flex items-center gap-2"><Clock size={14} /> Punch Out</div></th>
                                <th className="p-6"><div className="flex items-center gap-2"><Coffee size={14} /> Total Break</div></th>
                                <th className="p-6"><div className="flex items-center gap-2"><Timer size={14} /> Net Working</div></th>
                                <th className="p-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found for this period</p>
                                    </td>
                                </tr>
                            ) : records.map((r) => (
                                <tr key={r._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-6">
                                        <p className="font-extrabold text-slate-700 tracking-tight">{formatDate(r.date)}</p>
                                    </td>
                                    <td className="p-6 font-bold text-slate-600">
                                        {formatTime(r.punchIn)}
                                    </td>
                                    <td className="p-6 font-bold text-slate-600">
                                        {formatTime(r.punchOut)}
                                    </td>
                                    <td className="p-6 font-bold text-slate-500">
                                        {formatHours(r.totalBreakTime / 60)}
                                    </td>
                                    <td className="p-6">
                                        <span className="font-black text-slate-800 tracking-tight">{formatHours(r.totalWorkHours)}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest block text-center shadow-sm ${getStatusColor(r.status)}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>Total Logs: {records.length}</span>
                    <span>Trackify Persistence</span>
                </div>
            </div>
        </div>
    );
}
