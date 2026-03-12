import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, FileText, User, LogOut, Menu, X, CalendarHeart } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
        }
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

export default function EmployeeLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const links = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/attendance", icon: Clock, label: "My Attendance" },
        { to: "/leaves", icon: FileText, label: "Leaves & Approvals" },
        { to: "/holidays", icon: CalendarHeart, label: "Company Holidays" },
        { to: "/profile", icon: User, label: "Profile" },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white tracking-widest text-xl uppercase">Track<span className="text-indigo-400">ify</span></span>
                    </h1>
                    <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
                <div className="px-6 mb-4">
                    <div className="px-2 py-1.5 bg-slate-800/50 rounded-lg inline-block border border-slate-700/50">
                        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Employee Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <SidebarLink key={link.to} {...link} onClick={() => setIsSidebarOpen(false)} />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors bg-slate-800/50"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col w-full h-screen">
                <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-8 justify-between border-b border-slate-200 shrink-0 sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 md:hidden text-slate-600">
                            <Menu size={24} />
                        </button>
                        <div className="font-medium text-slate-600 hidden sm:block truncate pr-2 max-w-[200px] lg:max-w-none">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {localStorage.getItem('name')?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-bold text-slate-700 w-full hidden sm:block">
                            {localStorage.getItem('name') || 'Employee'}
                        </span>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
}
