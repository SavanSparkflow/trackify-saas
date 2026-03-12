import { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        lateEmployees: 0,
        onLeave: 0,
        recentAttendance: []
    });
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
        fetchWeeklyStats();
    }, []);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats({ ...stats, ...res.data });
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats/weekly`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendanceData(res.data);
        } catch (err) {
            console.error('Failed to load weekly stats');
        }
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass }) => (
        <div className={`p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/40 border ${borderClass} relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</p>
                    <h3 className="text-4xl font-black text-slate-800 tracking-tight mt-2 mb-1">
                        {loading ? '-' : value}
                    </h3>
                    <p className="text-sm font-medium text-slate-400">{subtitle}</p>
                </div>
                <div className={`p-4 rounded-2xl ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 mb-3">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome, {localStorage.getItem('name') || 'Admin'}</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest font-black">Company Performance Overview</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest border border-blue-100 shadow-sm">
                    <Clock size={14} /> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={stats.totalEmployees} subtitle="Registered Workers" icon={Users} colorClass="bg-blue-100 text-blue-600" borderClass="border-blue-100" />
                <StatCard title="Present Today" value={stats.presentToday} subtitle="Checked-in Logs" icon={UserCheck} colorClass="bg-green-100 text-green-600" borderClass="border-green-100" />
                <StatCard title="Late Arrivals" value={stats.lateEmployees} subtitle="System-wide Checks" icon={Clock} colorClass="bg-amber-100 text-amber-600" borderClass="border-amber-100" />
                <StatCard title="On Leave Today" value={stats.onLeave} subtitle="Approved Time-off" icon={FileText} colorClass="bg-indigo-100 text-indigo-600" borderClass="border-indigo-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Attendance Chart */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Weekly Attendance</h2>
                            <p className="text-sm font-medium text-slate-500">Overview of check-ins across the week</p>
                        </div>
                        <select className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 outline-none">
                            <option>This Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="present" name="Present" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Attendance Feed */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col">
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-6">Recent Activity</h2>
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-80 pr-2">
                        {stats.recentAttendance.length === 0 ? (
                            <p className="text-slate-500 font-medium text-sm text-center mt-10">No recent activity found.</p>
                        ) : stats.recentAttendance.map((log) => (
                            <div key={log._id} className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-slate-800">{log.userId?.name}</h4>
                                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-lg ${log.status === 'Present' ? 'bg-green-100 text-green-700' : log.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {log.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                    <span>In: {log.punchIn ? new Date(log.punchIn).toLocaleTimeString() : '--:--'}</span>
                                    <span>Out: {log.punchOut ? new Date(log.punchOut).toLocaleTimeString() : '--:--'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/admin/attendance')} className="mt-6 w-full py-3 border-2 border-slate-100 text-slate-600 font-bold tracking-wide rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        View Complete Log
                    </button>
                </div>

            </div>
        </div>
    );
}
