import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Gavel, Plus, Edit, Trash2, X, Info } from 'lucide-react';

export default function Rules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        status: 'active'
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/rules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(res.data);
        } catch (err) {
            toast.error('Failed to load rules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/admin/rules/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Rule updated successfully');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/admin/rules`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Rule added successfully');
            }
            setShowModal(false);
            setEditingId(null);
            fetchRules();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving rule');
        }
    };

    const handleEdit = (rule) => {
        setEditingId(rule._id);
        setFormData({
            title: rule.title,
            content: rule.content,
            status: rule.status || 'active'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/admin/rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Rule deleted');
            fetchRules();
        } catch (err) {
            toast.error('Failed to delete rule');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Gavel className="text-indigo-600" /> Rules & Regulations
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Define company policies and attendance logic</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', content: '', status: 'active' });
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 font-bold transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Add New Rule
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-slate-500 font-medium">Loading...</p>
                ) : rules.length === 0 ? (
                    <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Info size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Rules Found</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto">Create rules to define how attendance and salaries are calculated for your team.</p>
                    </div>
                ) : rules.map(rule => (
                    <div key={rule._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${rule.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {rule.status}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(rule)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(rule._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2">{rule.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                            {rule.content}
                        </p>
                        
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <Gavel className="text-indigo-600" /> {editingId ? 'Edit Rule' : 'New Rule'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Rule Title</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="E.g. Attendance Policy" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Description / Content</label>
                                <textarea required rows={4} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-none" placeholder="Explain the rule in detail..."></textarea>
                            </div>


                            <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                                <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.status === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Active</button>
                                <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.status === 'inactive' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Inactive</button>
                            </div>

                            <button type="submit" className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black tracking-widest uppercase shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                                {editingId ? 'Update Rule' : 'Save Rule & Publish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
