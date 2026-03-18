import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, MinusCircle, Star, Search, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AttendanceSheet() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const employeeId = queryParams.get('employeeId');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [totalDays, setTotalDays] = useState(31);

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        fetchReport();
    }, [month, year, employeeId]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/attendance/sheet`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { month, year, employeeId }
            });
            setReportData(res.data.data);
            setTotalDays(res.data.totalDaysInMonth);
        } catch (err) {
            toast.error('Failed to load attendance sheet');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present':
            case 'Late':
                return <CheckCircle2 size={16} className="text-green-500" />;
            case 'Absent':
                return <XCircle size={16} className="text-rose-500" />;
            case 'Leave':
                return <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center"><span className="text-[10px] font-bold text-indigo-600">L</span></div>;
            case 'Holiday':
                return <Star size={16} className="text-amber-500 fill-amber-500" />;
            case 'Weekend':
                return <MinusCircle size={16} className="text-slate-300" />;
            default:
                return <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />;
        }
    };

    const handleExport = () => {
        if (!reportData.length) return;

        const data = reportData.map((row, index) => {
            const daysObj = {};
            for (let i = 1; i <= totalDays; i++) {
                daysObj[`Day ${i}`] = row.days[i] || '-';
            }

            return {
                'SR NO.': index + 1,
                'EMPLOYEE': row.name,
                ...daysObj,
                'TOTAL DAYS': row.summary.totalDays,
                'PRESENT DAYS': row.summary.presentDays,
                'ABSENT DAYS': row.summary.absentDays,
                'TOTAL HOURS': row.summary.totalWorkHours
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
        XLSX.writeFile(wb, `Attendance_Report_${month}_${year}.xlsx`);
    };

    const filteredData = reportData.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    {employeeId && (
                        <button 
                            onClick={() => navigate('/admin/attendance-sheet')}
                            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                            title="View All Employees"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            {employeeId && reportData.length > 0 ? `${reportData[0].name}'s Attendance` : 'Attendance Sheet'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">
                            {months.find(m => m.value === month)?.label} {year} • Detailed Monthly Report
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={year} 
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 shadow-sm"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    
                    <select 
                        value={month} 
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 shadow-sm"
                    >
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <FileSpreadsheet size={18} /> Export Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl w-full focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-700"
                        />
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-4">
                         <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Present</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <XCircle size={16} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Absent</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <MinusCircle size={16} className="text-slate-300" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Weekend</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Holiday</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center"><span className="text-[9px] font-bold text-indigo-600">L</span></div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Leave</span>
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                                <th className="p-4 bg-white sticky left-0 z-10 border-r border-slate-100 min-w-[60px]">SR NO.</th>
                                <th className="p-4 bg-white sticky left-[60px] z-10 border-r border-slate-200 text-left min-w-[150px]">Employee</th>
                                {Array.from({ length: totalDays }, (_, i) => (
                                    <th key={i} className="p-2 border-r border-slate-100 min-w-[40px]">{String(i + 1).padStart(2, '0')}</th>
                                ))}
                                <th className="p-4 border-l border-slate-200 bg-slate-50 min-w-[100px]">Total Days</th>
                                <th className="p-4 bg-green-50/50 text-green-600 min-w-[100px]">Present</th>
                                <th className="p-4 bg-rose-50/50 text-rose-600 min-w-[100px]">Absent</th>
                                <th className="p-4 bg-indigo-50/50 text-indigo-600 min-w-[130px]">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={totalDays + 7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Generating Sheet...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={totalDays + 7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">No matching employees found</td></tr>
                            ) : filteredData.map((emp, idx) => (
                                <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 bg-white sticky left-0 z-10 border-r border-slate-100 text-center font-bold text-slate-400">{idx + 1}</td>
                                    <td className="p-4 bg-white sticky left-[60px] z-10 border-r border-slate-200">
                                        <p className="font-extrabold text-slate-800 text-xs truncate max-w-[140px]">{emp.name}</p>
                                        {emp.employeeId && <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter mt-0.5">{emp.employeeId}</p>}
                                    </td>
                                    {Array.from({ length: totalDays }, (_, i) => (
                                        <td key={i} className="p-2 border-r border-slate-100 text-center">
                                            <div className="flex justify-center">
                                                {getStatusIcon(emp.days[i + 1])}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-4 border-l border-slate-200 text-center font-black text-slate-700 bg-slate-50/30">{emp.summary.totalDays}</td>
                                    <td className="p-4 text-center font-black text-green-600 bg-green-50/20">{emp.summary.presentDays}</td>
                                    <td className="p-4 text-center font-black text-rose-600 bg-rose-50/20">{emp.summary.absentDays}</td>
                                    <td className="p-4 text-center font-black text-indigo-600 bg-indigo-50/20">{emp.summary.totalWorkHours}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .overflow-x-auto::-webkit-scrollbar {
                    height: 8px;
                }
                .overflow-x-auto::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .overflow-x-auto::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            ` }} />
        </div>
    );
}
