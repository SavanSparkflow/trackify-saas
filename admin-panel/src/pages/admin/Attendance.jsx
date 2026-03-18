import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Search, Download, MapPin, Plus, X, User } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Attendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    
    // Manual Attendance Modal State
    const [showManualModal, setShowManualModal] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [manualData, setManualData] = useState({
        userId: '',
        action: 'punchIn'
    });
    const [submittingManual, setSubmittingManual] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [currentPage, searchTerm, dateFilter]);

    useEffect(() => {
        if (showManualModal) {
            fetchAllEmployees();
        }
    }, [showManualModal]);

    const fetchAllEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/kiosk/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllEmployees(res.data);
        } catch (err) {
            toast.error('Failed to load employees');
        }
    };

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/attendance`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchTerm,
                    date: dateFilter
                }
            });
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            toast.error('Failed to load attendance');
        } finally {
            setLoading(false);
        }
    };
    
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualData.userId) return toast.error('Please select an employee');
        
        setSubmittingManual(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/attendance/manual`, manualData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.message || 'Attendance recorded');
            setShowManualModal(false);
            setManualData({ userId: '', action: 'punchIn' });
            fetchAttendance();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to record attendance');
        } finally {
            setSubmittingManual(false);
        }
    };

    const updateOTStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/admin/overtime/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Overtime ${status.toLowerCase()} successfully`);
            fetchAttendance();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const formatHours = (hours) => {
        if (!hours) return '00h 00m 00s';
        const totalSecs = Math.round(hours * 3600);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset to first page on search or filter
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFilter]);

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Calendar className="text-blue-600" /> Attendance Log
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Review employee daily work logs</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setShowManualModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <Plus size={18} /> Manual Entry
                    </button>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name..."
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
                                <th className="p-5">Date</th>
                                <th className="p-5">Employee</th>
                                <th className="p-5">Punch In/Out</th>
                                <th className="p-5">Locations</th>
                                <th className="p-5">Work Hours</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right whitespace-nowrap">Overtime</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium tracking-wide">Loading attendance logs...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium tracking-wide">No attendance logs found.</td></tr>
                            ) : records.map(r => (
                                <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5 text-slate-500 font-semibold">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <p className="font-extrabold text-slate-800 text-base">{r.userId?.name}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{r.userId?.email}</p>
                                    </td>
                                    <td className="p-5">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In: <span className="text-slate-700">{r.punchIn ? new Date(r.punchIn).toLocaleTimeString() : '--:--'}</span></p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Out: <span className="text-slate-700">{r.punchOut ? new Date(r.punchOut).toLocaleTimeString() : '--:--'}</span></p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-4">
                                            {r.locationIn?.lat ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${r.locationIn.lat},${r.locationIn.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex flex-col items-center gap-1 group"
                                                    title="Punch In Location"
                                                >
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">In</span>
                                                </a>
                                            ) : (
                                                <div className="p-2 bg-slate-50 text-slate-300 rounded-lg" title="No location">
                                                    <MapPin size={16} />
                                                </div>
                                            )}
                                            {r.locationOut?.lat ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${r.locationOut.lat},${r.locationOut.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex flex-col items-center gap-1 group"
                                                    title="Punch Out Location"
                                                >
                                                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Out</span>
                                                </a>
                                            ) : r.punchOut ? (
                                                <div className="p-2 bg-slate-50 text-slate-300 rounded-lg" title="No location">
                                                    <MapPin size={16} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="p-5 font-bold text-slate-700 tracking-tight">
                                        {formatHours(r.totalWorkHours)}
                                        {r.lateBreakMinutes > 0 && (
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mt-1">
                                                Late Break: -{r.lateBreakMinutes}m
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-widest uppercase 
                      ${r.status === 'Present' ? 'bg-green-100 text-green-700' : ''}
                      ${r.status === 'Absent' ? 'bg-rose-100 text-rose-700' : ''}
                      ${r.status === 'Late' ? 'bg-amber-100 text-amber-700' : ''}
                    `}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right">
                                        {r.overtime?.requested ? (
                                            <div className="flex flex-col items-end gap-2">
                                                {r.overtime.status === 'Pending' ? (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => updateOTStatus(r._id, 'Approved')}
                                                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-green-700 active:scale-95 transition-all"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            onClick={() => updateOTStatus(r._id, 'Rejected')}
                                                            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                                                        r.overtime.status === 'Approved' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        OT: {r.overtime.status}
                                                    </span>
                                                )}
                                                {r.overtime.totalHours > 0 && (
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        Time: <span className="text-indigo-600 font-black">{formatHours(r.overtime.totalHours)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Request</span>
                                        )}
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

            {/* Manual Attendance Modal */}
            {showManualModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <Plus className="text-blue-600" /> Manual Attendance
                                </h3>
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">Record entry for staff</p>
                            </div>
                            <button onClick={() => setShowManualModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm text-slate-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <User size={12} /> Select Employee
                                </label>
                                <select 
                                    value={manualData.userId}
                                    onChange={(e) => setManualData({...manualData, userId: e.target.value})}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                                    required
                                >
                                    <option value="">Choose an employee...</option>
                                    {allEmployees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || 'ID N/A'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Attendance Action</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'punchIn', label: 'Punch In', color: 'blue' },
                                        { id: 'punchOut', label: 'Punch Out', color: 'rose' },
                                        { id: 'breakStart', label: 'Break Start', color: 'amber' },
                                        { id: 'breakEnd', label: 'Break End', color: 'emerald' }
                                    ].map(action => (
                                        <label key={action.id} className={`relative group cursor-pointer`}>
                                            <input 
                                                type="radio" 
                                                name="action"
                                                value={action.id}
                                                checked={manualData.action === action.id}
                                                onChange={(e) => setManualData({...manualData, action: e.target.value})}
                                                className="peer sr-only"
                                            />
                                            <div className={`p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-center transition-all peer-checked:border-blue-600 peer-checked:bg-blue-50/50 group-hover:bg-slate-100`}>
                                                <p className={`text-sm font-black uppercase tracking-widest transition-colors ${manualData.action === action.id ? 'text-blue-600' : 'text-slate-500'}`}>
                                                    {action.label}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={submittingManual}
                                    className="flex-3 px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 disabled:opacity-70 disabled:pointer-events-none transition-all"
                                >
                                    {submittingManual ? 'Processing...' : 'Confirm Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
}
