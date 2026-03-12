import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CalendarRange, Search, Check, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Leaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchLeaves();
    }, [currentPage, searchTerm]);

    const fetchLeaves = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/leaves`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: searchTerm
                }
            });
            setLeaves(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            toast.error('Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${import.meta.env.VITE_API_URL}/admin/leaves/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Leave request ${status.toLowerCase()} successfully`);
            fetchLeaves();
        } catch (err) {
            toast.error('Failed to update leave status');
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <CalendarRange className="text-blue-600" /> Leave Requests
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Approve or reject employee time off</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
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
                                <th className="p-5">Employee Info</th>
                                <th className="p-5">Duration</th>
                                <th className="p-5">Reason</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">Loading leave requests...</td></tr>
                            ) : leaves.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">No leave requests found.</td></tr>
                            ) : leaves.map(l => (
                                <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <p className="font-extrabold text-slate-800 text-base">{l.userId?.name}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">{l.userId?.email}</p>
                                    </td>
                                    <td className="p-5 font-bold text-slate-700">
                                        <p>{new Date(l.startDate).toLocaleDateString()}</p>
                                        <p className="text-sm font-medium text-slate-500 mt-0.5">to {new Date(l.endDate).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-5">
                                        <p className="font-medium text-slate-600 italic break-words max-w-[250px]">{l.reason}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-widest uppercase 
                      ${l.status === 'Pending' ? 'bg-amber-100 text-amber-700' : ''}
                      ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : ''}
                      ${l.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : ''}
                    `}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right space-x-2">
                                        {l.status === 'Pending' && (
                                            <>
                                                <button onClick={() => updateStatus(l._id, 'Approved')} className="h-9 w-9 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg inline-flex items-center justify-center transition-all shadow-sm active:scale-95">
                                                    <Check strokeWidth={3} size={18} />
                                                </button>
                                                <button onClick={() => updateStatus(l._id, 'Rejected')} className="h-9 w-9 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg inline-flex items-center justify-center transition-all shadow-sm active:scale-95">
                                                    <X strokeWidth={3} size={18} />
                                                </button>
                                            </>
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
        </div>
    );
}
