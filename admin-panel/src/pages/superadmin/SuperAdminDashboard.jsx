import { useState, useEffect } from 'react';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalCompanies: 0,
        activeCompanies: 0,
        totalEmployees: 0,
        monthlyRevenue: 0,
        expiredSubscriptions: 0,
        topCompanies: []
    });
    const [loading, setLoading] = useState(true);

    const revenueData = []; // Assuming no real history API exists yet

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats({ ...stats, ...res.data });
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass }) => (
        <div className={`p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border ${borderClass} relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mt-2 mb-1">
                        {loading ? '-' : value}
                    </h3>
                    <p className="text-sm font-medium text-slate-400">{subtitle}</p>
                </div>
                <div className={`p-4 rounded-2xl ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Platform Overview</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Super Admin Analytics & Control Center</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Companies" value={stats.totalCompanies} subtitle={`${stats.activeCompanies} Active Tenants`} icon={Building2} colorClass="bg-rose-100 text-rose-600" borderClass="border-rose-100" />
                <StatCard title="Total Workers" value={stats.totalEmployees} subtitle="System-wide Users" icon={Users} colorClass="bg-indigo-100 text-indigo-600" borderClass="border-indigo-100" />
                <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue || 0}`} subtitle="Total recurring items" icon={TrendingUp} colorClass="bg-green-100 text-green-600" borderClass="border-green-100" />
                <StatCard title="Subscriptions" value={stats.expiredSubscriptions} subtitle="Expired / Needing Action" icon={CreditCard} colorClass="bg-amber-100 text-amber-600" borderClass="border-amber-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Revenue Growth</h2>
                            <p className="text-sm font-medium text-slate-500">Live Data</p>
                        </div>
                        <select className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 outline-none">
                            <option>Last 6 Months</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    <div className="h-80 w-full flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dx={-10} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fb7185' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                No historical revenue data exists
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Companies List */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col">
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6">Recent Tenants</h2>
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
                        {stats.topCompanies.length === 0 ? (
                            <p className="text-slate-500 font-medium text-sm text-center mt-10">No companies found.</p>
                        ) : stats.topCompanies.map((company) => (
                            <div key={company._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 shrink-0 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black text-lg">
                                        {company.companyName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-800">{company.companyName}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{company.role || 'Admin'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-lg ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                        {company.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/superadmin/companies" className="mt-6 w-full py-3 border-2 border-slate-100 text-slate-600 font-bold tracking-wide rounded-xl hover:bg-slate-50 transition-colors text-center block">
                        View All Companies
                    </Link>
                </div>

            </div>
        </div>
    );
}
