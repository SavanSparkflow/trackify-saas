import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Save, Building2 } from 'lucide-react';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        ownerName: '',
        companyPhone: '',
        address: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setFormData({
                ownerName: res.data.name,
                companyPhone: res.data.phone || '',
                address: res.data.address || ''
            });
        } catch (err) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/auth/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Profile updated successfully');
            localStorage.setItem('name', formData.ownerName);
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-500">Loading profile...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 h-32 md:h-48 relative">
                    <div className="absolute -bottom-12 left-8 md:left-12 h-24 w-24 md:h-32 md:w-32 bg-white rounded-3xl shadow-xl p-2">
                        <div className="h-full w-full bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Building2 size={48} />
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-12 px-8 md:px-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{profile.companyName}</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Company Administrator • Active Tenant</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <User size={16} /> Owner Name
                            </label>
                            <input
                                type="text"
                                value={formData.ownerName}
                                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all"
                            />
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Mail size={16} /> Business Email (Read Only)
                            </label>
                            <input
                                type="text"
                                disabled
                                value={profile.email}
                                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl border border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Phone size={16} /> Business Phone
                            </label>
                            <input
                                type="text"
                                value={formData.companyPhone}
                                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={16} /> Office Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                            />
                        </div>

                        <div className="md:col-span-2 pt-4">
                            <button
                                type="submit"
                                className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black tracking-widest uppercase shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Save size={20} /> Update Business Profile
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
