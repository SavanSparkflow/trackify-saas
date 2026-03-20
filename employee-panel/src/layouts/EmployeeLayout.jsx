import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, FileText, User, LogOut, Menu, X, CalendarHeart, Gavel, Bell, Timer } from 'lucide-react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import axios from 'axios';

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

const WANotificationToast = ({ t, title, message, type }) => (
    <div className={`${t.visible ? 'animate-toast-in' : 'animate-toast-out'} max-w-md w-full bg-white shadow-2xl rounded-3xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 border-l-[6px] border-[#25D366] transition-all duration-300`}>
        <div className="flex-1 w-0">
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-green-200">
                        {type === 'leave' ? <FileText className="text-white" size={24} /> : 
                         type === 'rule' ? <Gavel className="text-white" size={24} /> : 
                         <Bell className="text-white" size={24} />}
                    </div>
                </div>
                <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Trackify Notify</p>
                        <p className="text-[10px] font-bold text-slate-400">Just Now</p>
                    </div>
                    <p className="mt-1 text-sm font-black text-slate-900 leading-tight">{title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500 line-clamp-2">{message}</p>
                </div>
            </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
            <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-600 focus:outline-none"
            >
                <X size={20} />
            </button>
        </div>
    </div>
);

export default function EmployeeLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    useEffect(() => {
        const companyId = localStorage.getItem('companyId');
        const token = localStorage.getItem('token');
        if (!companyId || !token) return;

        // Request browser notification permission
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        fetchNotifications();

        // Connect to backend via proxy or direct URL
        const socketUrl = import.meta.env.VITE_API_URL.includes('http') 
            ? import.meta.env.VITE_API_URL.split('/api')[0] 
            : window.location.origin;

        const socket = io(socketUrl, {
            transports: ['polling', 'websocket'], // Polling first for proxy compatibility
            reconnectionAttempts: 10,
            reconnectionDelay: 3000,
            timeout: 10000,
            autoConnect: true
        });

        socket.on('connect', () => {
            console.log('✅ Employee Socket Connected:', socket.id);
            socket.emit('join_company', companyId.toString());
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.id) {
                    socket.emit('join_user', payload.id.toString());
                    console.log('✅ Employee Joined Personal Room:', payload.id);
                }
            } catch (e) { console.error('Token parse error for socket joining', e); }
        });

        const showBrowserNotification = (title, body) => {
            if (Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/logo192.png' });
            }
        };

        socket.on('new_rule', (data) => {
            toast.custom((t) => (
                <WANotificationToast t={t} title="New Company Rule" message={data.title} type="rule" />
            ), { duration: 6000 });
            showBrowserNotification('📜 New Company Rule', data.title);
            fetchNotifications();
        });

        socket.on('rule_updated', (data) => {
            toast.custom((t) => (
                <WANotificationToast t={t} title="Rule Updated" message={data.title} type="rule" />
            ), { duration: 6000 });
            showBrowserNotification('⚖️ Rule Updated', data.title);
            fetchNotifications();
        });

        socket.on('notification', (data) => {
            toast.custom((t) => (
                <WANotificationToast t={t} title={data.title} message={data.message} type={data.type} />
            ), { duration: 6000 });
            showBrowserNotification(data.title, data.message);
            fetchNotifications();
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Employee Socket Connection Error:', error);
        });

        socket.on('disconnect', (reason) => {
            console.warn('❌ Employee Socket Disconnected:', reason);
            if (reason === "io server disconnect") {
                socket.connect();
            }
        });

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('disconnect');
            socket.off('new_rule');
            socket.off('rule_updated');
            socket.off('notification');
            socket.disconnect();
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/employee/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const removeNotification = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/employee/notifications/${id}`, {
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
        if (notif.link) navigate(notif.link);
        setShowNotifDropdown(false);
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/employee/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
            setShowNotifDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };

    const links = [
        { to: "/", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/attendance", icon: Clock, label: "My Attendance" },
        { to: "/leaves", icon: FileText, label: "Leaves & Approvals" },
        { to: "/holidays", icon: CalendarHeart, label: "Company Holidays" },
        { to: "/rules", icon: Gavel, label: "Rules & Reg." },
        { to: "/overtime", icon: Timer, label: "Overtime" },
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
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600 rounded-xl transition-all relative group shadow-sm active:scale-90"
                            >
                                <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifDropdown && (
                                <>
                                    <div className="fixed inset-0 z-50" onClick={() => setShowNotifDropdown(false)} />
                                    <div className="absolute right-0 mt-3 w-80 max-h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200 origin-top-right">
                                        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">Mark all read</button>
                                            )}
                                        </div>
                                        <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-50">
                                            {notifications.length === 0 ? (
                                                <div className="p-10 text-center">
                                                    <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                                                    <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                                                </div>
                                            ) : notifications.map(notif => (
                                                <div 
                                                    key={notif._id} 
                                                    onClick={(e) => handleNotificationClick(notif, e)}
                                                    className={`p-5 hover:bg-slate-50 cursor-pointer transition-colors relative ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                                            notif.type === 'leave' ? 'bg-rose-100 text-rose-600' : 
                                                            notif.type === 'rule' ? 'bg-amber-100 text-amber-600' : 
                                                            'bg-indigo-100 text-indigo-600'
                                                        }`}>
                                                            {notif.type === 'leave' ? <FileText size={18} /> : 
                                                             notif.type === 'rule' ? <Gavel size={18} /> : 
                                                             <Bell size={18} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-xs font-black text-slate-800 leading-tight mb-1">{notif.title}</h4>
                                                            <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-1">{notif.message}</p>
                                                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{new Date(notif.createdAt).toLocaleString()}</p>
                                                        </div>
                                                        {!notif.isRead && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-1.5 shadow-md shadow-indigo-200" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black shadow-inner bg-blue-100 text-blue-600">
                            {localStorage.getItem('name')?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-sm font-black text-slate-800 leading-tight">
                                {localStorage.getItem('name') || 'Administrator'}
                            </span>
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
}
