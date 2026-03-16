import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Building2, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function RevenueAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
    }, []);

    const fetchRevenue = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/revenue`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            toast.error('Failed to load revenue data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Analyzing financial data...</div>;

    const stats = [
        { title: 'Total Revenue', value: `$${data?.activeRevenue || 0}`, sub: 'Monthly Recurring', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Active Subscriptions', value: data?.totalSubscriptions || 0, sub: 'Linked Companies', icon: Building2, color: 'text-rose-600', bg: 'bg-rose-100' },
        { title: 'Projected Growth', value: `${data?.totalGrowth || 0}%`, sub: 'Next 30 Days', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { title: 'Avg. ARPU', value: `$${(data?.activeRevenue / (data?.totalSubscriptions || 1)).toFixed(2)}`, sub: 'Per Company', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <BarChart3 className="text-rose-600" /> Revenue Analytics
                </h1>
                <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest leading-none">Financial Performance Dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                                <s.icon size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800">{s.value}</h3>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{s.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-500" /> Revenue Curve
                    </h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueHistory}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} tickFormatter={v => `$${v}`} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                        <Building2 size={20} className="text-rose-500" /> Subscriber Growth
                    </h2>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.revenueHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                                <Bar dataKey="companies" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
