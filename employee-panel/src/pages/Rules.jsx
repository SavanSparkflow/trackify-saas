import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gavel, Info } from 'lucide-react';

export default function Rules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/rules`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRules(res.data.filter(r => r.status === 'active'));
            } catch (err) {
                toast.error('Failed to load rules');
            } finally {
                setLoading(false);
            }
        };
        fetchRules();
    }, []);

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Gavel className="text-indigo-600" /> Rules & Regulations
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Company policies and attendance guidelines</p>
            </div>

            {loading ? (
                <p className="text-slate-500 font-medium">Loading rules...</p>
            ) : rules.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Info size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Rules Found</h3>
                    <p className="text-slate-500 mt-1">Contact your admin for company guidelines.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {rules.map(rule => (
                        <div key={rule._id} className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100">
                            <h3 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                                <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                                {rule.title}
                            </h3>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                {rule.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
