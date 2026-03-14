import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building2, CreditCard, BarChart3, Settings,
    Users, CalendarCheck, FileText, LogOut, Clock, Menu, X, CalendarHeart, Gavel, Bell, CalendarDays
} from 'lucide-react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import axios from 'axios';

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

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    useEffect(() => {
        if (role === 'superadmin') return;

        const token = localStorage.getItem('token');
        let companyId = localStorage.getItem('companyId');

        if (token && !companyId) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                companyId = payload.companyId;
                if (companyId) localStorage.setItem('companyId', companyId);
            } catch (e) { console.error("Token decode error", e); }
        }

        if (!token || (role !== 'superadmin' && !companyId)) return;

        // Request browser notification permission explicitly
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }

        fetchNotifications();

        const socketUrl = import.meta.env.VITE_API_URL.includes('http') 
            ? import.meta.env.VITE_API_URL.split('/api')[0] 
            : window.location.origin;

        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        const showBrowserNotification = (title, body, url = '/admin/notifications') => {
            if (window.Notification && Notification.permission === 'granted') {
                const options = {
                    body,
                    icon: '/logo192.png',
                    badge: '/logo192.png',
                    vibrate: [200, 100, 200],
                    tag: 'trackify-notif',
                    renotify: true
                };
                const n = new Notification(title, options);
                n.onclick = () => {
                    window.focus();
                    if (url) navigate(url);
                    n.close();
                };
            }
        };

        socket.on('connect', () => {
            console.log('✅ Admin Socket Connected:', socket.id);
            socket.emit('join_company', companyId);
            socket.emit('join_user', companyId); 
        });

        socket.on('new_leave_request', (data) => {
            console.log('📩 New Leave Request Received:', data);
            toast.success(`📅 Leave Request: ${data.message}`, { 
                duration: 6000,
                icon: '📅'
            });
            showBrowserNotification('📅 New Leave Request', data.message, '/admin/leaves');
            fetchNotifications();
        });

        socket.on('notification', (data) => {
            console.log('🔔 Admin Notification Received:', data);
            toast.success(`${data.title}: ${data.message}`, { duration: 5000 });
            showBrowserNotification(data.title, data.message, data.link ? `/admin${data.link}` : '/admin/notifications');
            fetchNotifications();
        });

        socket.on('disconnect', (reason) => {
            console.warn('❌ Admin Socket Disconnected:', reason);
        });

        return () => {
            socket.off('connect');
            socket.off('new_leave_request');
            socket.off('notification');
            socket.off('disconnect');
            socket.disconnect();
        };
    }, [role, navigate]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Error fetching admin notifications:', err);
        }
    };

    const removeNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/admin/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => {
                const notif = notifications.find(n => n._id === id);
                return (notif && !notif.isRead) ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = async (notif, e) => {
        await removeNotification(notif._id, e);
        if (notif.link) navigate(`/admin${notif.link}`);
        setShowNotifDropdown(false);
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/admin/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
            setShowNotifDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };

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
        { to: "/admin/events", icon: CalendarDays, label: "Events" },
        { to: "/admin/payroll", icon: CreditCard, label: "Payroll" },
        { to: "/admin/rules", icon: Gavel, label: "Rules & Reg." },
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
                        {!isSuper && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-600 rounded-xl transition-all relative group shadow-sm active:scale-95"
                                >
                                    <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-50" onClick={() => setShowNotifDropdown(false)} />
                                        <div className="absolute right-0 mt-3 w-80 max-h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200 origin-top-right">
                                            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                                <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">Admin Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">Clear All</button>
                                                )}
                                            </div>
                                            <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-50">
                                                {notifications.length === 0 ? (
                                                    <div className="p-10 text-center">
                                                        <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                                        <p className="text-sm font-bold text-slate-400">Stable & Quiet</p>
                                                    </div>
                                                ) : notifications.map(notif => (
                                                    <div 
                                                        key={notif._id} 
                                                        onClick={(e) => handleNotificationClick(notif, e)}
                                                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors relative ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                                                notif.type === 'leave' ? 'bg-amber-100 text-amber-600' : 
                                                                'bg-blue-100 text-blue-600'
                                                            }`}>
                                                                {notif.type === 'leave' ? <CalendarCheck size={16} /> : <Bell size={16} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{notif.title}</h4>
                                                                <p className="text-[11px] font-medium text-slate-500 leading-snug mb-1">{notif.message}</p>
                                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{new Date(notif.createdAt).toLocaleString()}</p>
                                                            </div>
                                                            {!notif.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
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
