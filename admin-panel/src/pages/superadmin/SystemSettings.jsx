import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Settings, Save, Globe, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        siteName: '',
        supportEmail: '',
        contactNumber: '',
        maintenanceMode: false,
        allowRegistration: true,
        currency: 'USD',
        taxPercentage: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(res.data);
        } catch (err) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/superadmin/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('System settings updated!');
        } catch (err) {
            toast.error('Failed to update settings');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400">Loading Configuration...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <Settings className="text-rose-600" /> System Settings
                </h1>
                <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest leading-none">Global Application Configuration</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 font-black text-slate-800 flex items-center gap-2">
                        <Globe size={18} /> General Branding
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Platform Name</label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Default Currency</label>
                            <select
                                value={settings.currency}
                                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-800"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 font-black text-slate-800 flex items-center gap-2">
                        <Mail size={18} /> Support & Contact
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Support Email</label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600 ml-1">Contact Number</label>
                            <input
                                type="text"
                                value={settings.contactNumber}
                                onChange={e => setSettings({ ...settings, contactNumber: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-slate-800"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 font-black text-slate-800 flex items-center gap-2">
                        <Lock size={18} /> Visibility & Access
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="font-black text-slate-800">Maintenance Mode</p>
                                <p className="text-xs font-bold text-slate-400">Lock site for maintenance</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-rose-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 h-6 w-6 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1 shadow-sm'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="font-black text-slate-800">Tenant Registration</p>
                                <p className="text-xs font-bold text-slate-400">Allow new companies to sign up</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.allowRegistration ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 h-6 w-6 bg-white rounded-full transition-all ${settings.allowRegistration ? 'left-7' : 'left-1 shadow-sm'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pb-12">
                    <button
                        type="button"
                        onClick={fetchSettings}
                        className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        className="px-10 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                        <Save size={20} /> Update System
                    </button>
                </div>
            </form>
        </div>
    );
}
