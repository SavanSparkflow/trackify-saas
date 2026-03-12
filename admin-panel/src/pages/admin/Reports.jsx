import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, Share2, Search, Calendar } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employeeId, setEmployeeId] = useState('');
    const [summary, setSummary] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchReports();
    }, [month, year, employeeId, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/reports`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    month,
                    year,
                    employeeId: employeeId || undefined,
                    page: currentPage,
                    limit: itemsPerPage
                }
            });

            const { attendance, employees, totalPages: backendTotalPages } = res.data;

            // Generate Summary per employee
            const formattedSummary = employees.map(emp => {
                const empAttendance = attendance.filter(a => a.userId?._id === emp._id);
                const totalDays = empAttendance.length;
                const totalLate = empAttendance.filter(a => a.status === 'Late').length;
                const totalAbsent = empAttendance.filter(a => a.status === 'Absent').length;
                const totalSalary = empAttendance.reduce((sum, a) => sum + (a.earnedSalary || 0), 0);
                const totalWorkHoursDec = empAttendance.reduce((sum, a) => sum + (a.totalWorkHours || 0), 0);

                const formatTime = (decimalHours) => {
                    if (!decimalHours) return "00h 00m 00s";
                    const totalSecs = Math.round(decimalHours * 3600);
                    const h = Math.floor(totalSecs / 3600);
                    const m = Math.floor((totalSecs % 3600) / 60);
                    const s = totalSecs % 60;
                    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
                };

                return {
                    ...emp,
                    totalDays,
                    totalLate,
                    totalAbsent,
                    totalSalary: totalSalary, // keep as number for formatting later if needed
                    formattedSalary: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalSalary),
                    totalWorkHoursStr: formatTime(totalWorkHoursDec),
                    records: empAttendance
                };
            });

            setSummary(formattedSummary);
            setReports(attendance);
            setTotalPages(backendTotalPages);
        } catch (err) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleShareWhatsApp = (emp) => {
        const phone = emp.phone ? emp.phone.replace(/\D/g, '') : '';
        if (!phone) return toast.error("Employee has no phone number");

        const message = `Hello ${emp.name},\nHere is your full attendance report for ${month}/${year}:\n\n- Days Present: ${emp.totalDays}\n- Late Days: ${emp.totalLate}\n- Absent: ${emp.totalAbsent}\n- Total Work Hours: ${emp.totalWorkHoursStr}\n\n*Total Earned Salary:* ${emp.formattedSalary}\n\nThank you,\nTrackify System`;

        let formattedPhone = phone;
        if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`; // Assume India

        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleDownloadCSV = (emp) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Punch In,Break In,Break Out,Punch Out,Status,Total Hours,Earned Salary\n";

        emp.records.forEach(r => {
            const date = new Date(r.date).toLocaleDateString('en-GB'); // Use simple DD/MM/YYYY to avoid Excel issues
            const pIn = r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

            const bIn = r.breaks && r.breaks.length > 0 && r.breaks[0].breakStart
                ? new Date(r.breaks[0].breakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const bOut = r.breaks && r.breaks.length > 0 && r.breaks[0].breakEnd
                ? new Date(r.breaks[0].breakEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

            const pOut = r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            const status = r.status;

            const formatTime = (decimalHours) => {
                if (!decimalHours) return "00h 00m 00s";
                const totalSecs = Math.round(decimalHours * 3600);
                const h = Math.floor(totalSecs / 3600);
                const m = Math.floor((totalSecs % 3600) / 60);
                const s = totalSecs % 60;
                return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
            };
            const hoursStr = formatTime(r.totalWorkHours);
            const salary = r.earnedSalary ? `₹${r.earnedSalary.toFixed(2)}` : '₹0.00';

            csvContent += `"${date}","${pIn}","${bIn}","${bOut}","${pOut}","${status}","${hoursStr}","${salary}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Report_${emp.name}_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset to first page on month/year/employee change
    useEffect(() => {
        setCurrentPage(1);
    }, [month, year, employeeId]);

    const currentSummary = summary; // Already paginated by backend

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="text-blue-600" /> Attendance Reports
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Generate and share monthly salary reports</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex flex-wrap gap-4 items-end mt-6">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Month</label>
                    <select value={month} onChange={e => setMonth(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Year</label>
                    <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" />
                </div>
            </div>

            <div className="space-y-6 mt-6">
                {loading ? (
                    <div className="text-center p-8 text-slate-500 font-bold tracking-wide">Loading reports...</div>
                ) : summary.length === 0 ? (
                    <div className="text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-100 placeholder-slate-400">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">No records found</h3>
                    </div>
                ) : (
                    <>
                        {currentSummary.map(emp => (
                            <div key={emp._id} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4 items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{emp.name}</h3>
                                        <p className="text-sm font-bold text-slate-500">{emp.email} • Salary: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(emp.monthlySalary || 0)}/mo</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleDownloadCSV(emp)} className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-all shadow-sm" title="Download CSV">
                                            <Download size={18} />
                                        </button>
                                        <button onClick={() => handleShareWhatsApp(emp)} className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95 text-sm uppercase tracking-wider pl-3">
                                            <Share2 size={16} /> WhatsApp
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100 border-b border-slate-100">
                                    <div className="p-4 text-center bg-blue-50/50">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Present</p>
                                        <p className="text-2xl font-black text-blue-600">{emp.totalDays}</p>
                                    </div>
                                    <div className="p-4 text-center bg-amber-50/50">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Late</p>
                                        <p className="text-2xl font-black text-amber-600">{emp.totalLate}</p>
                                    </div>
                                    <div className="p-4 text-center bg-rose-50/50">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Absent</p>
                                        <p className="text-2xl font-black text-rose-600">{emp.totalAbsent}</p>
                                    </div>
                                    <div className="p-4 text-center bg-indigo-50/50">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Hours</p>
                                        <p className="text-sm font-black text-indigo-600 mt-2">{emp.totalWorkHoursStr}</p>
                                    </div>
                                    <div className="p-4 text-center bg-green-50/50">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Earned</p>
                                        <p className="text-lg font-black text-green-600 mt-2">{emp.formattedSalary}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="mt-2">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
