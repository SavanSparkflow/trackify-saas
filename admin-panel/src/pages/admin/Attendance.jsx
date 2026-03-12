import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Search, Download, MapPin } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Attendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAttendance();
    }, [currentPage, searchTerm, dateFilter]);

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
                <div className="flex gap-3 w-full md:w-auto">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto shadow-sm"
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium tracking-wide">Loading attendance logs...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium tracking-wide">No attendance logs found.</td></tr>
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
                                    <td className="p-5 font-bold text-slate-700 tracking-tight">{formatHours(r.totalWorkHours)}</td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-widest uppercase 
                      ${r.status === 'Present' ? 'bg-green-100 text-green-700' : ''}
                      ${r.status === 'Absent' ? 'bg-rose-100 text-rose-700' : ''}
                      ${r.status === 'Late' ? 'bg-amber-100 text-amber-700' : ''}
                    `}>
                                            {r.status}
                                        </span>
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
        </div >
    );
}
