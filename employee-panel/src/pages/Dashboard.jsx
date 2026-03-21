import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Play, Square, Coffee, Zap } from 'lucide-react';

export default function Dashboard() {
    const [time, setTime] = useState(new Date());
    const [attendance, setAttendance] = useState(null);
    const [company, setCompany] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pendingChoice, setPendingChoice] = useState(null); // { photo, location, status }
    const [actionCountdown, setActionCountdown] = useState(5);
    const name = localStorage.getItem('name') || 'Employee';

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchDashboard();
        return () => clearInterval(timer);
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data.todayAttendance);
            setCompany(res.data.company);
            setUserProfile(res.data.user);
        } catch (err) {
            console.error(err);
        }
    };

    const getCurrentLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                toast.error("Geolocation is not supported by your browser");
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.error("Location error:", err);
                    let msg = "Location access denied.";
                    if (err.code === 1) msg = "Please allow location access to continue.";
                    else if (err.code === 2) msg = "Location unavailable.";
                    else if (err.code === 3) msg = "Location timeout.";

                    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                        msg = "Mobile browsers block Location on HTTP. Please use HTTPS link (https://<your-ip>).";
                    }

                    toast.error(msg);
                    resolve(null);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    };

    // Auto-countdown effect for modal
    useEffect(() => {
        let timer;
        if (pendingChoice && actionCountdown > 0) {
            timer = setInterval(() => {
                setActionCountdown(prev => prev - 1);
            }, 1000);
        } else if (pendingChoice && actionCountdown === 0) {
            setPendingChoice(null);
        }
        return () => clearInterval(timer);
    }, [pendingChoice, actionCountdown]);

    const handleAction = async (endpoint, explicitAction = null) => {
        // 1. Get Location first
        const location = pendingChoice?.location || await getCurrentLocation();
        if (!location) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            let res;
            if (explicitAction) {
                res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/smart-punch`, {
                    location,
                    photo: pendingChoice?.photo,
                    action: explicitAction
                }, { headers: { Authorization: `Bearer ${token}` } });
                setPendingChoice(null);
            } else {
                res = await axios.post(`${import.meta.env.VITE_API_URL}/employee/${endpoint}`, {
                    location
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            toast.success(res.data.message);
            fetchDashboard();
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

    const formatHours = (hours) => {
        if (!hours) return { h: '00h', m: '00m', s: '00s' };
        const totalSecs = Math.round(hours * 3600);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return { h: `${String(h).padStart(2, '0')}h`, m: `${String(m).padStart(2, '0')}m`, s: `${String(s).padStart(2, '0')}s` };
    };

    const isPunchedIn = attendance && attendance.punchIn && !attendance.punchOut;
    const isPunchedOut = attendance && attendance.punchOut;
    const inBreak = attendance && attendance.breaks && attendance.breaks.length > 0 && !attendance.breaks[attendance.breaks.length - 1].breakEnd;
    const workTime = formatHours(attendance?.totalWorkHours);
    const breakTime = formatHours(attendance ? (attendance.totalBreakTime / 60) : 0);

    return (
        <div className="p-4 md:p-8 max-w-8xl space-y-8 relative">
            {/* Action Selection Modal */}
            {pendingChoice && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"></div>
                    
                    <div className="relative w-full max-w-lg bg-slate-900 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-10 duration-500">
                        {/* Countdown Bar */}
                        <div className="absolute top-0 left-0 h-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-linear" style={{ width: `${(actionCountdown / 5) * 100}%` }}></div>

                        <div className="p-8 sm:p-12 text-center">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                                <Play size={48} className="text-white fill-white" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">Hi, {name}!</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">What would you like to do?</p>

                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => handleAction(null, 'break')}
                                    className="group relative bg-orange-600 hover:bg-orange-500 text-white py-5 px-8 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-lg shadow-orange-600/20 overflow-hidden"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Zap size={24} className="fill-white" />
                                        <span>{pendingChoice.status === 'on_break' ? 'Finish Break' : 'Take Break'}</span>
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => handleAction(null, 'attendance')}
                                    className="group relative bg-white/5 hover:bg-white/10 text-white py-5 px-8 rounded-2xl font-black text-lg uppercase tracking-widest transition-all duration-200 active:scale-95 border border-white/10"
                                >
                                    <div className="flex items-center justify-center gap-3 text-slate-300">
                                        <Clock size={24} />
                                        <span>Clock Out</span>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Auto-cancel in {actionCountdown}s</p>
                                <button onClick={() => setPendingChoice(null)} className="text-slate-400 hover:text-white text-xs font-black uppercase underline underline-offset-4 decoration-2">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full border-8 border-white opacity-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full border-8 border-white opacity-10 blur-xl"></div>
                <div className="relative z-[9] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Good Morning, {name}</h1>
                        <p className="text-blue-100 font-medium tracking-wide">Shift Target: {company?.openingTime || '--:--'} to {company?.closingTime || '--:--'}</p>
                        {attendance && (
                            <span className={`inline-block mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner ${attendance.status === 'Late' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                                Status: {attendance.status}
                            </span>
                        )}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 text-center min-w-[200px] shadow-sm">
                        <p className="text-sm font-semibold uppercase tracking-widest text-blue-100 mb-1">Current Time</p>
                        <p className="text-4xl font-extrabold tracking-tight tabular-nums">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Punch In', id: 'punch-in', icon: Play, color: 'green', disabled: isPunchedIn || isPunchedOut },
                    { label: 'Start Break', id: 'break/start', icon: Coffee, color: 'amber', disabled: !isPunchedIn || inBreak },
                    { label: 'End Break', id: 'break/end', icon: Clock, color: 'blue', disabled: !inBreak },
                    { label: 'Punch Out', id: 'punch-out', icon: Square, color: 'rose', disabled: !isPunchedIn || inBreak }
                ].map(action => (
                    <button key={action.id} onClick={() => handleAction(action.id)} disabled={loading || action.disabled} className={`group bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col items-center gap-4 transition-all hover:-translate-y-1 ${!action.disabled ? `text-${action.color}-600 hover:bg-${action.color}-50` : 'opacity-40'}`}>
                        <div className={`h-16 w-16 bg-${action.color}-100 text-${action.color}-600 rounded-full flex items-center justify-center group-hover:bg-${action.color}-600 group-hover:text-white transition-all`}>
                            <action.icon size={28} />
                        </div>
                        <span className="font-bold text-slate-700">{action.label}</span>
                    </button>
                ))}
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-10">Today's Summary</h2>
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 grid grid-cols-2 lg:grid-cols-5 gap-8 divide-x divide-slate-100 text-center">
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Punch In</p><p className="text-2xl font-black text-slate-800 tabular-nums">{formatTime(attendance?.punchIn)}</p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Punch Out</p><p className="text-2xl font-black text-slate-400 tabular-nums">{formatTime(attendance?.punchOut)}</p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Break Time</p><p className="text-2xl font-black text-slate-800 tabular-nums">{breakTime.h} <span className="text-sm font-bold text-slate-500">{breakTime.m} {breakTime.s}</span></p></div>
                <div><p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Work hours</p><p className="text-2xl font-black text-green-600 tabular-nums">{workTime.h} <span className="text-sm font-bold text-green-500/70">{workTime.m} {workTime.s}</span></p></div>
                <div><p className="text-xs font-black tracking-widest text-emerald-500 uppercase mb-2">Day Salary</p><p className="text-2xl font-black text-emerald-600 tabular-nums">{attendance?.earnedSalary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(attendance.earnedSalary) : '₹0.00'}</p></div>
            </div>
        </div>
    );
}
