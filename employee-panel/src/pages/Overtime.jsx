import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Timer, Send, Play, Coffee, Square, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Overtime() {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data.todayAttendance);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOT = async () => {
        if (!message) return toast.error('Please enter a reason/message for overtime.');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/overtime/request`, {
                message
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(res.data.message);
            setAttendance(res.data.attendance);
            setMessage('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleOTAction = async (endpoint) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/overtime/${endpoint}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message);
            setAttendance(res.data.attendance);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '--:--';
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (hours) => {
        if (!hours) return '0h 0m';
        const mins = Math.round(hours * 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const ot = attendance?.overtime || {};
    const isApproved = ot.status === 'Approved';
    const isPending = ot.status === 'Pending';
    const isStarted = ot.startTime && !ot.endTime;
    const isEnded = ot.endTime;
    const inBreak = ot.breaks?.length > 0 && !ot.breaks[ot.breaks.length - 1].breakEnd;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Timer className="text-indigo-600" size={32} /> Overtime Dashboard
                    </h1>
                    <p className="text-slate-500 font-medium">Manage your overtime requests and tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Request Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 h-full">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Send size={20} className="text-indigo-500" /> Request Overtime
                        </h2>
                        {ot.requested ? (
                            <div className={`p-4 rounded-2xl flex flex-col gap-3 ${
                                ot.status === 'Approved' ? 'bg-green-50 text-green-700' : 
                                ot.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 
                                'bg-amber-50 text-amber-700'
                            }`}>
                                <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-xs">
                                    {ot.status === 'Approved' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    Status: {ot.status}
                                </div>
                                <p className="text-sm font-medium opacity-80">Message: {ot.message}</p>
                                {isPending && <p className="text-[10px] uppercase font-black opacity-50 tracking-tighter">Waiting for admin approval...</p>}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Explain why you need overtime..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-[120px] font-medium"
                                />
                                <button 
                                    onClick={handleRequestOT}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Send Request
                                </button>
                            </div>
                        )}
                        {isApproved && !isStarted && !isEnded && (
                            <div className="mt-4 p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 flex items-center gap-3">
                                <CheckCircle2 size={24} className="shrink-0" />
                                <p className="text-xs font-bold leading-tight uppercase tracking-wider">Your request is approved! You can now start tracking your overtime.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Action Buttons */}
                    <div className="bg-slate-900/5 backdrop-blur-sm p-4 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Start OT', id: 'start', icon: Play, color: 'indigo', disabled: !isApproved || isStarted || isEnded },
                                { label: 'OT Break', id: 'break/start', icon: Coffee, color: 'amber', disabled: !isStarted || inBreak || isEnded },
                                { label: 'End Break', id: 'break/end', icon: Clock, color: 'blue', disabled: !inBreak || isEnded },
                                { label: 'End OT', id: 'end', icon: Square, color: 'rose', disabled: !isStarted || inBreak || isEnded }
                            ].map(action => (
                                <button 
                                    key={action.id} 
                                    onClick={() => handleOTAction(action.id)}
                                    disabled={loading || action.disabled}
                                    className={`group bg-white rounded-[1.5rem] shadow-md border border-slate-100 p-5 flex flex-col items-center gap-3 transition-all ${!action.disabled ? `hover:-translate-y-1 hover:shadow-xl text-${action.color}-600` : 'opacity-40 grayscale pointer-events-none'}`}
                                >
                                    <div className={`h-12 w-12 bg-${action.color}-100 text-${action.color}-600 rounded-full flex items-center justify-center group-hover:bg-${action.color}-600 group-hover:text-white transition-all`}>
                                        <action.icon size={22} />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-700">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">OT Start</p>
                            <p className="text-2xl font-black text-slate-800 tabular-nums">{formatTime(ot.startTime)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">OT End</p>
                            <p className="text-2xl font-black text-slate-800 tabular-nums">{formatTime(ot.endTime)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Auto Break</p>
                            <p className="text-2xl font-black text-amber-600 tabular-nums">{ot.autoBreakDuration || 0}<span className="text-xs ml-1">min</span></p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 text-center ring-2 ring-indigo-600 ring-offset-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total OT</p>
                            <p className="text-2xl font-black text-indigo-600 tabular-nums">{formatDuration(ot.totalHours)}</p>
                        </div>
                    </div>

                    {/* OT History Line / Details */}
                    {isEnded && (
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                                <div>
                                    <h3 className="text-xl font-black mb-2 uppercase tracking-widest">OT Session Summary</h3>
                                    <p className="text-indigo-100 font-medium">Session closed for {new Date(attendance.date).toLocaleDateString()}</p>
                                </div>
                                <div className="px-8 py-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30">
                                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Approved By</p>
                                    <p className="text-lg font-black tracking-tighter tabular-nums">ADMINISTRATOR</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
