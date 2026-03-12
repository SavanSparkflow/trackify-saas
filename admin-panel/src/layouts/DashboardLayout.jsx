import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building2, CreditCard, BarChart3, Settings,
    Users, CalendarCheck, FileText, LogOut, Clock, Menu, X, CalendarHeart
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, label, onClick, isSuper }) => (
    <NavLink
        to={to}
        end
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? (isSuper ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white')
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

export default function DashboardLayout({ role }) {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const superAdminLinks = [
        { to: "/superadmin", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/superadmin/companies", icon: Building2, label: "Companies" },
        { to: "/superadmin/subscriptions", icon: CreditCard, label: "Subscriptions" },
        { to: "/superadmin/revenue", icon: BarChart3, label: "Revenue Analytics" },
        { to: "/superadmin/plans", icon: FileText, label: "Plans" },
        { to: "/superadmin/settings", icon: Settings, label: "System Settings" },
    ];

    const adminLinks = [
        { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/admin/employees", icon: Users, label: "Employees" },
        { to: "/admin/attendance", icon: CalendarCheck, label: "Attendance" },
        { to: "/admin/leaves", icon: FileText, label: "Leaves" },
        { to: "/admin/holidays", icon: CalendarHeart, label: "Holidays" },
        { to: "/admin/reports", icon: BarChart3, label: "Reports" },
        { to: "/admin/settings", icon: Settings, label: "Settings" },
    ];

    const isSuper = role === 'superadmin';
    const links = isSuper ? superAdminLinks : adminLinks;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative w-full">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isSuper ? 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-500/30' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30'}`}>
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white tracking-widest text-xl uppercase">Track<span className={isSuper ? "text-rose-400" : "text-indigo-400"}>ify</span></span>
                    </h1>
                    <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <div className="px-6 mb-4">
                    <div className="px-2 py-1.5 bg-slate-800/50 rounded-lg inline-block border border-slate-700/50">
                        <p className={`text-xs font-semibold uppercase tracking-widest ${isSuper ? 'text-rose-300' : 'text-indigo-300'}`}>{isSuper ? 'Master' : 'Admin'} Mode</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {links.map((link) => (
                        <SidebarLink key={link.to} {...link} onClick={() => setIsSidebarOpen(false)} isSuper={isSuper} />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors ${isSuper ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col w-full h-screen">
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[999999] h-16 flex items-center px-4 md:px-8 justify-between border-b border-slate-200 shadow-sm shrink-0">
                    <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-600">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-3 ml-auto">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black shadow-inner ${isSuper ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                            {localStorage.getItem('name')?.charAt(0) || role?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-sm font-black text-slate-800 leading-tight">
                                {localStorage.getItem('name') || 'Administrator'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                {role}
                            </span>
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
}
