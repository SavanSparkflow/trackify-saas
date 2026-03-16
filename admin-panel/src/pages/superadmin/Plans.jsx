import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Package, Plus, Check, Edit, Trash2, X } from 'lucide-react';

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [formData, setFormData] = useState({
        planName: '',
        price: 0,
        employeeLimit: 0,
        duration: 30, // Default to 30 days
        features: ''
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(res.data);
        } catch (err) {
            toast.error('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                price: Number(formData.price),
                employeeLimit: Number(formData.employeeLimit),
                duration: Number(formData.duration),
                features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
            };

            if (modalMode === 'add') {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/superadmin/plans`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlans([...plans, res.data]);
                toast.success('Plan created successfully');
            } else if (modalMode === 'edit') {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/superadmin/plans/${selectedPlan._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPlans(plans.map(p => p._id === res.data._id ? res.data : p));
                toast.success('Plan updated successfully');
            }

            closeModal();
        } catch (err) {
            toast.error('Error saving plan');
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/superadmin/plans/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlans(plans.filter(p => p._id !== id));
            toast.success('Plan deleted successfully');
        } catch (err) {
            toast.error('Failed to delete plan');
        }
    };

    const openAddModal = () => {
        setFormData({ planName: '', price: 0, employeeLimit: 0, duration: 30, features: '' });
        setModalMode('add');
    };

    const openEditModal = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            planName: plan.planName,
            price: plan.price,
            employeeLimit: plan.employeeLimit,
            duration: plan.duration || 30,
            features: plan.features.join(', ')
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedPlan(null);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Package className="text-rose-600" /> Subscription Tiers
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage pricing and platform limits</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/30 font-bold transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Add New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                {loading ? (
                    <p className="text-slate-500 font-medium">Loading plans...</p>
                ) : plans.length === 0 ? (
                    <p className="text-slate-500 font-medium">No plans established.</p>
                ) : plans.map((plan, i) => (
                    <div key={plan._id} className={`bg-white rounded-3xl p-8 shadow-xl border relative overflow-hidden group transition-transform duration-300 hover:-translate-y-2 ${i === 1 ? 'border-rose-500 shadow-rose-500/20' : 'border-slate-100 shadow-slate-200/40'}`}>
                        {i === 1 && (
                            <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                                Most Popular
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{plan.planName}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => openEditModal(plan)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeletePlan(plan._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 mb-2 flex items-baseline text-5xl font-black text-slate-900 tracking-tighter">
                            ${plan.price}
                            <span className="ml-1 text-base font-bold text-slate-500 tracking-widest uppercase">/{plan.duration} days</span>
                        </div>

                        <div className="px-4 py-2 bg-slate-50 rounded-xl inline-block text-sm font-extrabold text-slate-700 tracking-wide uppercase border border-slate-100 mb-6">
                            Up to {plan.employeeLimit} users
                        </div>

                        <ul className="space-y-4 mb-8">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-slate-600 font-semibold">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={closeModal} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            {modalMode === 'add' ? 'New Plan' : 'Edit Plan'}
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">Plan Tier Name</label>
                                <input type="text" value={formData.planName} required onChange={e => setFormData({ ...formData, planName: e.target.value })} className="mt-2 w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium" placeholder="Pro Tier" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">Monthly Price ($)</label>
                                    <input type="number" value={formData.price} required onChange={e => setFormData({ ...formData, price: e.target.value })} className="mt-2 w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium" placeholder="49.99" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">Duration (Days)</label>
                                    <input type="number" value={formData.duration} required onChange={e => setFormData({ ...formData, duration: e.target.value })} className="mt-2 w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium" placeholder="30" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">User Limit</label>
                                <input type="number" value={formData.employeeLimit} required onChange={e => setFormData({ ...formData, employeeLimit: e.target.value })} className="mt-2 w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium" placeholder="50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">Features (Comma Separated)</label>
                                <textarea required value={formData.features} rows={3} onChange={e => setFormData({ ...formData, features: e.target.value })} className="mt-2 w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none" placeholder="Analytics, WhatsApp Alerts, Custom Branding" />
                            </div>
                            <button type="submit" className="w-full mt-6 py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all active:scale-[0.98]">
                                {modalMode === 'add' ? 'Launch Package' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
