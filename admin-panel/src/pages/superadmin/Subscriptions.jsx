import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CreditCard, Search, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Subscriptions() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filtering for those who have a plan or showing all
            setCompanies(res.data);
        } catch (err) {
            toast.error('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const filtered = companies.filter(c =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isExpired = (date) => date && new Date(date) < new Date();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <CreditCard className="text-rose-600" /> Subscription Management
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Track payments and license validity across all tenants</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find company or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-rose-500 outline-none shadow-sm font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-xs font-bold text-slate-500">
                                <th className="p-5 font-black">Company</th>
                                <th className="p-5 font-black">Plan</th>
                                <th className="p-5 font-black">Billing Cycle</th>
                                <th className="p-5 font-black">Status</th>
                                <th className="p-5 font-black text-right">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">No subscriptions found</td></tr>
                            ) : filtered.map(c => {
                                const expired = isExpired(c.subscriptionEnd);
                                return (
                                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5">
                                            <p className="font-extrabold text-slate-800">{c.companyName}</p>
                                            <p className="text-xs font-bold text-slate-400">{c.ownerEmail}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-black text-xs uppercase tracking-tighter border border-slate-200">
                                                {c.planId?.planName || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-slate-600">
                                            {c.subscriptionStart ? new Date(c.subscriptionStart).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-5">
                                            {expired ? (
                                                <span className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 bg-rose-50 rounded-full border border-rose-100">
                                                    <ShieldAlert size={12} /> Expired
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                                                    <ShieldCheck size={12} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className={`p-5 text-right font-black ${expired ? 'text-rose-500' : 'text-slate-800'}`}>
                                            {c.subscriptionEnd ? new Date(c.subscriptionEnd).toLocaleDateString() : 'Lifetime'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
