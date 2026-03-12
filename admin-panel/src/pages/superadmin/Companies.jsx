import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, Search, Plus, Edit, Trash2, X } from 'lucide-react';

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        companyEmail: '',
        ownerName: '',
        ownerEmail: '',
        password: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const filtered = companies.filter(c =>
            c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.companyEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCompanies(filtered);
    }, [searchQuery, companies]);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/superadmin/companies`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(res.data);
            setFilteredCompanies(res.data);
        } catch (err) {
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (modalMode === 'add') {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/superadmin/companies`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCompanies([...companies, res.data]);
                toast.success('Company created!');
            } else if (modalMode === 'edit') {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;

                const res = await axios.put(`${import.meta.env.VITE_API_URL}/superadmin/companies/${selectedCompany._id}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCompanies(companies.map(c => c._id === res.data._id ? res.data : c));
                toast.success('Company updated!');
            }

            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    const toggleStatus = async (company) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = company.status === 'active' ? 'inactive' : 'active';
            const res = await axios.patch(`${import.meta.env.VITE_API_URL}/superadmin/companies/${company._id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCompanies(companies.map(c => c._id === res.data._id ? res.data : c));
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const openAddModal = () => {
        setFormData({ companyName: '', companyEmail: '', ownerName: '', ownerEmail: '', password: '' });
        setModalMode('add');
    };

    const openEditModal = (company) => {
        setSelectedCompany(company);
        setFormData({
            companyName: company.companyName,
            companyEmail: company.companyEmail,
            ownerName: company.ownerName,
            ownerEmail: company.ownerEmail,
            password: ''
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedCompany(null);
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Building2 className="text-rose-600" /> Companies Management
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Monitor and manage registered tenants</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/30 font-bold transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Add Company
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search companies by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-rose-500 outline-none shadow-sm transition-shadow font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-xs font-bold text-slate-500">
                                <th className="p-5">Company Info</th>
                                <th className="p-5">Owner Contact</th>
                                <th className="p-5">Plan Setup</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">Loading companies...</td></tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">No companies found. Create one above!</td></tr>
                            ) : filteredCompanies.map(c => (
                                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <p className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                                            {c.companyName}
                                            {c.role === 'superadmin' && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] uppercase tracking-widest rounded-md">Super</span>}
                                        </p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{c.companyEmail}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700">{c.ownerName}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{c.ownerEmail}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700">{c.planId?.name || "No Plan"}</p>
                                    </td>
                                    <td className="p-5">
                                        <button
                                            onClick={() => toggleStatus(c)}
                                            className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-widest uppercase transition-all hover:opacity-80 ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                                }`}
                                        >
                                            {c.status}
                                        </button>
                                    </td>
                                    <td className="p-5 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(c)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                {modalMode === 'add' ? 'Add New Company' : 'Edit Company'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                                    <input required type="text" name="companyName" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Company Email</label>
                                    <input required type="email" name="companyEmail" value={formData.companyEmail} onChange={e => setFormData({ ...formData, companyEmail: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Name</label>
                                    <input required type="text" name="ownerName" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Email</label>
                                    <input required type="email" name="ownerEmail" value={formData.ownerEmail} onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {modalMode === 'edit' ? 'New Password (Leave blank to keep current)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={modalMode === 'add'}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98]">
                                    {modalMode === 'add' ? 'Create' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
