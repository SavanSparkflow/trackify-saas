import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Search, Plus, UserPlus, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        parentPhone: '',
        employeeId: '',
        department: '',
        shiftStart: '09:00',
        shiftEnd: '18:00',
        latePenaltyRate: 0,
        monthlySalary: 0,
        attendancePhoto: '',
        dob: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchEmployees();
    }, [currentPage, searchTerm]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/employees`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchTerm
                }
            });
            setEmployees(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/admin/employees/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Employee updated successfully');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/admin/employees`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Employee created successfully');
            }
            setShowModal(false);
            setEditingId(null);
            fetchEmployees();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving employee');
        }
    };

    const handleEdit = (employee) => {
        setEditingId(employee._id);
        setFormData({
            name: employee.name,
            email: employee.email,
            password: employee.password || '', 
            phone: employee.phone || '',
            parentPhone: employee.parentPhone || '',
            employeeId: employee.employeeId || '',
            department: employee.department || '',
            shiftStart: employee.shiftStart || '09:00',
            shiftEnd: employee.shiftEnd || '18:00',
            latePenaltyRate: employee.latePenaltyRate || 0,
            monthlySalary: employee.monthlySalary || 0,
            attendancePhoto: employee.attendancePhoto || '',
            dob: employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/admin/employees/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Employee deleted');
            fetchEmployees();
        } catch (err) {
            toast.error('Failed to delete employee');
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset to first page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Users className="text-blue-600" /> Employee Directory
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage your team members and roles</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '', email: '', password: '', phone: '', parentPhone: '',
                            employeeId: '', department: '', shiftStart: '09:00', shiftEnd: '18:00',
                            latePenaltyRate: 0, monthlySalary: 0, attendancePhoto: '', dob: ''
                        });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Add Employee
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow font-medium text-slate-700"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-xs font-bold text-slate-500">
                                <th className="p-5">Name & Email</th>
                                <th className="p-5">Shift & Rates</th>
                                <th className="p-5">Phones</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">Loading employees...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">No employees found.</td></tr>
                            ) : employees.map(e => (
                                <tr key={e._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            {e.attendancePhoto ? (
                                                <img src={e.attendancePhoto} alt={e.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                                                    {e.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-extrabold text-slate-800 text-base">{e.name}</p>
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-tighter">ID: {e.employeeId || 'N/A'}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 mt-0.5">{e.email} | <span className="text-indigo-600 font-bold text-xs uppercase">{e.department || 'General'}</span></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shift: <span className="text-slate-700">{e.shiftStart || '09:00'} - {e.shiftEnd || '18:00'}</span></p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salary: <span className="text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(e.monthlySalary || 0)}/mo</span></p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700">{e.phone || 'N/A'}</p>
                                        <p className="text-sm font-medium text-slate-400 mt-0.5 whitespace-nowrap">Parent: {e.parentPhone || 'N/A'}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'} rounded-lg text-xs font-extrabold tracking-widest uppercase`}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        <button onClick={() => handleEdit(e)} className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(e._id)} className="text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <UserPlus className="text-blue-600" /> {editingId ? 'Update Employee' : 'New Employee'}
                        </h2>

                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                                    <input type="text" value={formData.name} required onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="E.g. Jane Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                                    <input type="email" value={formData.email} required onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="jane@company.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Employee ID (Manual)</label>
                                    <input type="text" value={formData.employeeId} required onChange={e => setFormData({ ...formData, employeeId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="EMP001" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                                    <input type="text" value={formData.password} required={!editingId} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                                    <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                                    <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="Sales" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Shift Start Time</label>
                                    <input type="time" value={formData.shiftStart} onChange={e => setFormData({ ...formData, shiftStart: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Shift End Time</label>
                                    <input type="time" value={formData.shiftEnd} onChange={e => setFormData({ ...formData, shiftEnd: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Monthly Salary (₹)</label>
                                    <input type="number" value={formData.monthlySalary} onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="4000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Late Penalty per minute (₹)</label>
                                    <input type="number" value={formData.latePenaltyRate} onChange={e => setFormData({ ...formData, latePenaltyRate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="5" />
                                </div>
                                <div className="border-t border-slate-100 pt-4 md:col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Personal Phone</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="+919876543210" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Parent (Alert) Phone</label>
                                        <input type="text" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="+919876543211" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Attendance Face Photo (Required for Verification)</label>
                                    <div className="flex items-center gap-4">
                                        {formData.attendancePhoto && (
                                            <img src={formData.attendancePhoto} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setFormData({ ...formData, attendancePhoto: reader.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-widest uppercase shadow-xl shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all active:scale-[0.98]">
                                {editingId ? 'Save Changes' : 'Register Team Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
