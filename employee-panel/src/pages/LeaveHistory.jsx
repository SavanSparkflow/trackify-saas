import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function LeaveHistory() {
    const [loading, setLoading] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/leaves`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
        } catch (err) {
            toast.error('Failed to load leaves');
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/employee/leave`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Leave Application Submitted Successfully!');
            setFormData({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (err) {
            toast.error('Failed to submit leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-8xl space-y-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Leave Application Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 col-span-1 lg:col-span-1 h-fit sticky top-24">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mb-6">Apply Leave</h2>

                <form onSubmit={handleApply} className="space-y-5">
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-sm font-bold text-slate-600 tracking-wide uppercase mb-2">From</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                className="w-full px-3 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 shadow-sm transition-shadow"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-bold text-slate-600 tracking-wide uppercase mb-2">To</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                                className="w-full px-3 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 shadow-sm transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 tracking-wide uppercase mb-2">Reason (Type & Info)</label>
                        <textarea
                            required rows={4}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Detailed reason... (Sick, Casual, etc)"
                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 resize-none shadow-sm transition-shadow"
                        ></textarea>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold tracking-widest uppercase rounded-xl py-3.5 shadow-md flex justify-center items-center gap-2 transition-all active:scale-[0.98]">
                        {loading ? 'Submitting...' : <><Send size={18} /> Submit Request</>}
                    </button>
                </form>
            </div>

            {/* Leave History List */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mb-2">Past Applications</h2>

                <div className="space-y-4">
                    {leaves.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-500 font-medium">No leave applications found.</div>
                    ) : leaves.map((l) => {
                        const StatusIcon = l.status === 'Approved' ? CheckCircle2 : l.status === 'Rejected' ? XCircle : Clock;
                        const colorClass = l.status === 'Approved' ? 'bg-green-50 text-green-500' : l.status === 'Rejected' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500';

                        return (
                            <div key={l._id} className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow flex flex-col md:flex-row items-center justify-between gap-4 group">

                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className={`h-14 w-14 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${colorClass}`}>
                                        <StatusIcon strokeWidth={2.5} size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">Leave Request</h3>
                                        <div className="text-sm font-bold text-slate-400 mt-1 mb-2 tracking-wide uppercase">
                                            {new Date(l.startDate).toLocaleDateString()} &rarr; {new Date(l.endDate).toLocaleDateString()}
                                        </div>
                                        <p className="text-slate-500 font-medium italic break-words">{l.reason}</p>
                                    </div>
                                </div>

                                <div className="text-right whitespace-nowrap">
                                    <span className={`px-4 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-widest ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {l.status}
                                    </span>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
