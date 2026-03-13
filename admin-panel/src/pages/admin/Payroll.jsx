import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CreditCard, Search, Plus, Filter, Download, History, X, IndianRupee } from 'lucide-react';
import moment from 'moment';

export default function Payroll() {
    const [employees, setEmployees] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [filters, setFilters] = useState({
        month: moment().month() + 1,
        year: moment().year(),
        userId: ''
    });

    const [payData, setPayData] = useState({
        userId: '',
        month: moment().month() + 1,
        year: moment().year(),
        basicSalary: 0,
        bonus: 0,
        deductions: 0,
        totalPaid: 0,
        paymentMethod: 'Cash',
        remarks: ''
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchSalaries();
    }, [filters]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/employees`, { 
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 1000 }
            });
            const data = res.data.data || res.data;
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/salaries`, { 
                headers: { Authorization: `Bearer ${token}` },
                params: filters
            });
            setSalaries(res.data || []);
        } catch (err) {
            toast.error('Failed to fetch salaries');
        } finally {
            setLoading(false);
        }
    };

    const handlePaySalary = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/admin/salaries/pay`, payData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Salary payment recorded');
            setShowPayModal(false);
            fetchSalaries();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error recording payment');
        }
    };

    const viewSalaryHistory = async (empId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/salaries/history/${empId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryData(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            toast.error('Failed to load salary history');
        }
    };

    const months = [
        { v: 1, n: 'January' }, { v: 2, n: 'February' }, { v: 3, n: 'March' },
        { v: 4, n: 'April' }, { v: 5, n: 'May' }, { v: 6, n: 'June' },
        { v: 7, n: 'July' }, { v: 8, n: 'August' }, { v: 9, n: 'September' },
        { v: 10, n: 'October' }, { v: 11, n: 'November' }, { v: 12, n: 'December' }
    ];

    const currentYear = moment().year();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <CreditCard className="text-blue-600" /> Payroll Management
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage employee salaries and payment records</p>
                </div>
                <button
                    onClick={() => {
                        setPayData({ ...payData, month: filters.month, year: filters.year });
                        setShowPayModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Record Payment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mt-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Month</label>
                    <select 
                        value={filters.month} 
                        onChange={(e) => setFilters({...filters, month: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                        {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <select 
                        value={filters.year} 
                        onChange={(e) => setFilters({...filters, year: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => setFilters({ month: moment().month() + 1, year: moment().year(), userId: '' })}
                    className="px-4 py-2 text-slate-500 hover:text-blue-600 font-bold transition-colors"
                >
                    Clear Filters
                </button>
            </div>

            {/* Salary List */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-xs font-bold text-slate-500">
                                <th className="p-5">Employee</th>
                                <th className="p-5">Period</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Method</th>
                                <th className="p-5">Date</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">Loading salaries...</td></tr>
                            ) : salaries.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No salary records for this period.</td></tr>
                            ) : salaries.map(s => (
                                <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <p className="font-extrabold text-slate-800">{s.userId?.name}</p>
                                        <p className="text-xs font-medium text-slate-500">{s.userId?.employeeId}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700">{months.find(m => m.v === s.month)?.n} {s.year}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-black text-blue-600">₹{s.totalPaid}</p>
                                        {s.bonus > 0 && <p className="text-[10px] text-green-600 font-bold">Bonus: +₹{s.bonus}</p>}
                                        {s.deductions > 0 && <p className="text-[10px] text-rose-600 font-bold">Deduct: -₹{s.deductions}</p>}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${s.paymentMethod === 'Online' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {s.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <p className="text-sm font-medium text-slate-600">{moment(s.paymentDate).format('DD MMM YYYY')}</p>
                                    </td>
                                    <td className="p-5 text-right flex gap-2 justify-end">
                                        <button 
                                            onClick={() => viewSalaryHistory(s.userId?._id)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Update History"
                                        >
                                            <History size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pay Salary Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowPayModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <IndianRupee className="text-blue-600" /> Record Salary Payment
                        </h2>

                        <form onSubmit={handlePaySalary} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Employee</label>
                                <select 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    onChange={(e) => {
                                        const emp = employees.find(emp => emp._id === e.target.value);
                                        setPayData({
                                            ...payData,
                                            userId: e.target.value,
                                            basicSalary: emp?.monthlySalary || 0,
                                            totalPaid: (emp?.monthlySalary || 0) + Number(payData.bonus) - Number(payData.deductions)
                                        });
                                    }}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Month</label>
                                    <select 
                                        value={payData.month}
                                        onChange={(e) => setPayData({...payData, month: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Year</label>
                                    <select 
                                        value={payData.year}
                                        onChange={(e) => setPayData({...payData, year: parseInt(e.target.value)})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Basic Salary</label>
                                    <input type="number" value={payData.basicSalary} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bonus</label>
                                    <input 
                                        type="number" 
                                        value={payData.bonus} 
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setPayData({...payData, bonus: val, totalPaid: (payData.basicSalary + val - payData.deductions)});
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deductions</label>
                                    <input 
                                        type="number" 
                                        value={payData.deductions} 
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setPayData({...payData, deductions: val, totalPaid: (payData.basicSalary + payData.bonus - val)});
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Paid</label>
                                    <input type="number" value={payData.totalPaid} readOnly className="w-full px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-extrabold rounded-xl outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setPayData({...payData, paymentMethod: 'Cash'})}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${payData.paymentMethod === 'Cash' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}
                                    >
                                        Cash
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setPayData({...payData, paymentMethod: 'Online'})}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${payData.paymentMethod === 'Online' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                                    >
                                        Online
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black tracking-widest uppercase shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                Complete Payment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Update History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl relative">
                        <button onClick={() => setShowHistoryModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-6">
                            <History className="text-blue-600" /> Salary Update History
                        </h2>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {historyData.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No salary updates found for this employee.</p>
                            ) : historyData.slice().reverse().map((h, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-400 line-through">₹{h.oldSalary}</span>
                                            <span className="text-lg font-black text-blue-600">→ ₹{h.newSalary}</span>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500">Updated by: {h.updatedBy?.name || 'Admin'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-700">{moment(h.updatedAt).format('DD MMM YYYY')}</p>
                                        <p className="text-xs font-medium text-slate-400">{moment(h.updatedAt).format('hh:mm A')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
