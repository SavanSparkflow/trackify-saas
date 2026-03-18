import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, Share2, Search, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import Pagination from '../../components/Pagination';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchReports();
    }, [month, year, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/reports`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    month,
                    year,
                    page: currentPage,
                    limit: itemsPerPage
                }
            });

            const { attendance, employees, totalPages: backendTotalPages } = res.data;

            // Generate Summary per employee
            const formattedSummary = employees.map(emp => {
                const empAttendance = attendance.filter(a => a.userId?._id === emp._id);
                const totalLate = empAttendance.filter(a => a.status === 'Late').length;
                const totalAbsent = empAttendance.filter(a => a.status === 'Absent').length;
                const totalLeave = empAttendance.filter(a => a.status === 'On Leave').length;
                const totalHalfDay = empAttendance.filter(a => a.status === 'Half Day').length;
                const totalPresent = empAttendance.filter(a => a.status === 'Present').length;
                
                // Days Worked Calculation
                const daysWorked = totalPresent + totalLate + (totalHalfDay * 0.5);
                
                const totalSalary = empAttendance.reduce((sum, a) => sum + (a.earnedSalary || 0), 0);
                const totalDeductionDays = empAttendance.reduce((sum, a) => sum + (a.penaltyDays || 0), 0);
                const totalWorkHoursDec = empAttendance.reduce((sum, a) => sum + (a.totalWorkHours || 0), 0);
                const totalOTHoursDec = empAttendance.reduce((sum, a) => sum + (a.overtime?.totalHours || 0), 0);

                const formatTime = (decimalHours) => {
                    if (!decimalHours) return "00h 00m 00s";
                    const totalSecs = Math.round(decimalHours * 3600);
                    const h = Math.floor(totalSecs / 3600);
                    const m = Math.floor((totalSecs % 3600) / 60);
                    const s = totalSecs % 60;
                    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
                };

                const currentMonthWorkingDays = res.data.company?.monthlyWorkingDays?.[month - 1] || 26;

                return {
                    ...emp,
                    workingDays: currentMonthWorkingDays,
                    daysWorked,
                    totalLate,
                    totalAbsent,
                    totalLeave,
                    totalHalfDay,
                    totalDeductionDays,
                    totalSalary: totalSalary,
                    formattedSalary: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalSalary),
                    totalWorkHoursStr: formatTime(totalWorkHoursDec + totalOTHoursDec),
                    totalShiftHoursStr: formatTime(totalWorkHoursDec),
                    totalOTHoursStr: formatTime(totalOTHoursDec),
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

        const message = `Hello ${emp.name},\nHere is your full attendance report for ${month}/${year}:\n\n📅 *Working Days:* ${emp.workingDays}\n✅ *Days Worked:* ${emp.daysWorked}\n⏰ *Late Days:* ${emp.totalLate}\n❌ *Absent Days:* ${emp.totalAbsent}\n⏳ *Total Work Hours:* ${emp.totalWorkHoursStr}\n\n💰 *Total Earned Salary:* ${emp.formattedSalary}\n\nThank you,\nTrackify System`;

        let formattedPhone = phone;
        if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`; // Assume India

        const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleDownloadSheet = async (emp, shouldShare = false) => {
        const rows = [];
        // Header
        rows.push(["Date", "Punch In", "Punch Out", "Status", "Shift Hours", "OT Hours", "Total Hours", "Deduction Days", "Salary"]);

        const daysInMonth = new Date(year, month, 0).getDate();
        let totalOT = 0;
        let totalShift = 0;
        let totalSalary = 0;

        for (let d = 1; d <= 31; d++) {
            if (d > daysInMonth) {
                rows.push([`${d}/${month}/${year}`, "--", "--", "--", "0", "--", "--", "0", "0"]);
                continue;
            }
            const record = emp.records.find(r => new Date(r.date).getDate() === d);
            const dateStr = `${d}/${month}/${year}`;

            if (record) {
                const pIn = record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const pOut = record.punchOut ? new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                
                const shiftHrs = record.totalWorkHours || 0;
                const otHrs = record.overtime?.totalHours || 0;
                const totalHrs = shiftHrs + otHrs;

                totalOT += otHrs;
                totalShift += shiftHrs;
                totalSalary += (record.earnedSalary || 0);

                rows.push([dateStr, pIn, pOut, record.status, shiftHrs.toFixed(2), otHrs.toFixed(2), totalHrs.toFixed(2), record.penaltyDays || 0, (record.earnedSalary || 0).toFixed(2)]);
            } else {
                rows.push([dateStr, "--", "--", "Absent", "0", "--", "--", "0", "0"]);
            }
        }

        // Summary Rows
        rows.push([]);
        rows.push(["SUMMARY", "", "", "", "", "TOTAL WORKING DAYS", emp.daysWorked, "TOTAL OT HOURS", totalOT.toFixed(2)]);
        rows.push(["", "", "", "", "", "TOTAL WORKING HOURS", (totalShift + totalOT).toFixed(2), "TOTAL ABSENT", emp.totalAbsent]);
        rows.push(["", "", "", "", "", "TOTAL LEAVE", emp.totalLeave, "TOTAL SALARY", totalSalary.toFixed(2)]);

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        
        // Column Widths
        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 10 }, // Punch In
            { wch: 10 }, // Punch Out
            { wch: 12 }, // Status
            { wch: 12 }, // Shift Hours
            { wch: 10 }, // OT Hours
            { wch: 12 }, // Total Hours
            { wch: 15 }, // Deduction Days
            { wch: 12 }  // Salary
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `Report`);

        const fileName = `${emp.name.replace(/\s+/g, '_')}_${month}_${year}_Report.xlsx`;
        
        // Write file and download
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        if (shouldShare && navigator.canShare) {
            try {
                const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${emp.name}'s Report`,
                        text: `Attendance report for ${month}/${year}`
                    });
                } else {
                    throw new Error("Cannot share file");
                }
            } catch (err) {
                // Fallback to manual download
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
            }
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Reset to first page on month/year/employee change
    useEffect(() => {
        setCurrentPage(1);
    }, [month, year]);

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
                                        <button onClick={() => handleDownloadSheet(emp)} className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-all shadow-sm" title="Download Excel">
                                            <Download size={18} />
                                        </button>
                                        <button onClick={() => handleShareWhatsApp(emp)} className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebd5a] text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 active:scale-95 text-sm uppercase tracking-wider pl-3">
                                            <Share2 size={16} /> WhatsApp Report
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-slate-100 border-b border-slate-100">
                                    <div className="p-4 text-center bg-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Working Days</p>
                                        <p className="text-xl font-black text-slate-600">{emp.workingDays}</p>
                                    </div>
                                    <div className="p-4 text-center bg-blue-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Days Worked</p>
                                        <p className="text-xl font-black text-blue-600">{emp.daysWorked}</p>
                                    </div>
                                    <div className="p-4 text-center bg-amber-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Late</p>
                                        <p className="text-xl font-black text-amber-600">{emp.totalLate}</p>
                                    </div>
                                    <div className="p-4 text-center bg-rose-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deduction</p>
                                        <p className="text-xl font-black text-rose-600">{emp.totalDeductionDays} Days</p>
                                    </div>
                                    <div className="p-4 text-center bg-indigo-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                                        <p className="text-sm font-black text-indigo-600 mt-2">{emp.totalWorkHoursStr}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1">OT: {emp.totalOTHoursStr}</p>
                                    </div>
                                    <div className="p-4 text-center bg-green-50/50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earned</p>
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
