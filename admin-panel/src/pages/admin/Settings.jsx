import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, Shield, Bell, Save, Map } from 'lucide-react';

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        openingTime: '09:00',
        closingTime: '18:00',
        lunchStartTime: '13:00',
        lunchEndTime: '14:00',
        lateGracePeriod: 15,
        geofencing: false,
        faceRecognition: true,
        ipRestrictions: false,
        whatsappAlerts: true,
        latePolicy: {
            enableLateDeduction: false,
            lateDaysThreshold: 5,
            lateDaysDeduction: 1,
            enableSevereLateDeduction: false,
            severeLateMinutes: 15,
            severeLateDeduction: 2
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(prev => ({
                ...prev,
                openingTime: res.data.openingTime || '09:00',
                closingTime: res.data.closingTime || '18:00',
                lunchStartTime: res.data.lunchStartTime || '13:00',
                lunchEndTime: res.data.lunchEndTime || '14:00',
                lateGracePeriod: res.data.lateGracePeriod !== undefined ? res.data.lateGracePeriod : 15,
                monthlyWorkingDays: res.data.monthlyWorkingDays || [26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26],
                latePolicy: res.data.latePolicy || {
                    enableLateDeduction: false,
                    lateDaysThreshold: 5,
                    lateDaysDeduction: 1,
                    enableSevereLateDeduction: false,
                    severeLateMinutes: 15,
                    severeLateDeduction: 2
                }
            }));
        } catch (err) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/auth/profile`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Settings updated successfully');
        } catch (err) {
            toast.error('Failed to save settings');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading settings...</div>;

    return (
        <div className="p-4 md:p-8 max-w-8xl space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Shield className="text-blue-600" /> Company Compliance
                </h1>
                <p className="text-slate-500 font-medium mt-1">Manage attendance shifts and verification settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Verification Controls */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Shift Timing */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <Clock className="text-indigo-600" /> Shift Timings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Opening Time</label>
                                <input
                                    type="time"
                                    value={settings.openingTime}
                                    onChange={e => setSettings({ ...settings, openingTime: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Closing Time</label>
                                <input
                                    type="time"
                                    value={settings.closingTime}
                                    onChange={e => setSettings({ ...settings, closingTime: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Lunch Start</label>
                                <input
                                    type="time"
                                    value={settings.lunchStartTime}
                                    onChange={e => setSettings({ ...settings, lunchStartTime: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Lunch End</label>
                                <input
                                    type="time"
                                    value={settings.lunchEndTime}
                                    onChange={e => setSettings({ ...settings, lunchEndTime: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Late Grace (Mins)</label>
                                <input
                                    type="number"
                                    value={settings.lateGracePeriod}
                                    onChange={e => setSettings({ ...settings, lateGracePeriod: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                />
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-bold text-rose-500 uppercase tracking-widest italic">
                            * Punch-in after (Opening Time + Grace Period) will be marked "Late"
                        </p>
                    </div>

                    {/* Monthly Working Days */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-2">
                            Monthly Working Days (Manual)
                        </h2>
                        <p className="text-slate-500 font-medium text-xs mb-4 uppercase tracking-wider italic">* Used for salary calculations. Each month can have different working days.</p>

                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                <div key={month} className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{month}</label>
                                    <input
                                        type="number"
                                        value={settings.monthlyWorkingDays ? settings.monthlyWorkingDays[idx] : 26}
                                        onChange={e => {
                                            const newVal = parseInt(e.target.value) || 0;
                                            const updatedDays = [...(settings.monthlyWorkingDays || Array(12).fill(26))];
                                            updatedDays[idx] = newVal > 31 ? 31 : (newVal < 1 ? 1 : newVal);
                                            setSettings({ ...settings, monthlyWorkingDays: updatedDays });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 text-center"
                                        min="1"
                                        max="31"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Verification */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-2">
                            User Verification Settings
                        </h2>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                    <Map size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Mandatory Geofencing</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 whitespace-nowrap overflow-hidden">Requires GPS Coordinates for punch</p>
                                </div>
                            </div>
                            <button onClick={() => setSettings({ ...settings, geofencing: !settings.geofencing })} className={`w-14 h-7 rounded-full transition-colors relative ${settings.geofencing ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.geofencing ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Face Scan Verification</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 whitespace-nowrap overflow-hidden">Enable AI face audit during punch in/out</p>
                                </div>
                            </div>
                            <button onClick={() => setSettings({ ...settings, faceRecognition: !settings.faceRecognition })} className={`w-14 h-7 rounded-full transition-colors relative ${settings.faceRecognition ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.faceRecognition ? 'left-8' : 'left-1'}`}></div>
                            </button>
                        </div>

                    </div>

                    {/* Late Arrival Policy */}
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Clock className="text-rose-600" /> Late Arrival Policy
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Configure salary deductions for late staff</p>
                        </div>

                        {/* Standard Late Rule */}
                        <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800">Threshold Late Deduction</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deduct salary after X days of being late</p>
                                </div>
                                <button onClick={() => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, enableLateDeduction: !settings.latePolicy.enableLateDeduction } })} className={`w-14 h-7 rounded-full transition-colors relative ${settings.latePolicy.enableLateDeduction ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.latePolicy.enableLateDeduction ? 'left-8' : 'left-1'}`}></div>
                                </button>
                            </div>

                            {settings.latePolicy.enableLateDeduction && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Every X Days Late</label>
                                        <input
                                            type="number"
                                            value={settings.latePolicy.lateDaysThreshold}
                                            onChange={e => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, lateDaysThreshold: parseInt(e.target.value) || 0 } })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Deduct (Days Salary)</label>
                                        <input
                                            type="number"
                                            value={settings.latePolicy.lateDaysDeduction}
                                            onChange={e => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, lateDaysDeduction: parseFloat(e.target.value) || 0 } })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Severe Late Rule */}
                        <div className="space-y-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-800">Severe Late Penalty</h4>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Immediate extra deduction for being very late</p>
                                </div>
                                <button onClick={() => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, enableSevereLateDeduction: !settings.latePolicy.enableSevereLateDeduction } })} className={`w-14 h-7 rounded-full transition-colors relative ${settings.latePolicy.enableSevereLateDeduction ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.latePolicy.enableSevereLateDeduction ? 'left-8' : 'left-1'}`}></div>
                                </button>
                            </div>

                            {settings.latePolicy.enableSevereLateDeduction && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">If Late More Than (Mins)</label>
                                        <input
                                            type="number"
                                            value={settings.latePolicy.severeLateMinutes}
                                            onChange={e => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, severeLateMinutes: parseInt(e.target.value) || 0 } })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Deduct (Days Salary)</label>
                                        <input
                                            type="number"
                                            value={settings.latePolicy.severeLateDeduction}
                                            onChange={e => setSettings({ ...settings, latePolicy: { ...settings.latePolicy, severeLateDeduction: parseFloat(e.target.value) || 0 } })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="bg-gradient-to-br from-indigo-700 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200/50">
                        <Bell className="mb-4 opacity-70" />
                        <h3 className="text-xl font-black tracking-tight mb-2">Automated Notifications</h3>
                        <p className="text-sm font-medium text-indigo-100 opacity-80 leading-relaxed mb-6">WhatsApp alerts will be dispatched to parent phone numbers upon late arrivals or punch-out deviations.</p>
                        <button onClick={() => setSettings({ ...settings, whatsappAlerts: !settings.whatsappAlerts })} className={`w-full py-3 rounded-xl font-black tracking-widest uppercase transition-all ${settings.whatsappAlerts ? 'bg-white text-indigo-700' : 'bg-white/20 text-white'}`}>
                            {settings.whatsappAlerts ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>

                    <div className="flex-1"></div>

                    <button
                        onClick={handleUpdate}
                        className="w-full bg-slate-900 border-2 border-slate-900 text-white hover:bg-white hover:text-slate-900 py-4 rounded-3xl font-black tracking-widest uppercase shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Save size={20} /> Save All Changes
                    </button>
                </div>

            </div>
        </div>
    );
}
