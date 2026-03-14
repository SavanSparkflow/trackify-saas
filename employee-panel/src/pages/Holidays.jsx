import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CalendarHeart, ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, Star } from 'lucide-react';

export default function Holidays() {
    const [holidays, setHolidays] = useState([]);
    const [events, setEvents] = useState([]);
    const [holidayConfig, setHolidayConfig] = useState('all-sundays');
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [holidayRes, eventRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/employee/holidays`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/events`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setHolidays(holidayRes.data.holidays || []);
            setHolidayConfig(holidayRes.data.holidayConfig || 'all-sundays');
            setEvents(eventRes.data || []);
        } catch (err) {
            toast.error('Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startingDay = firstDayOfMonth(year, month);

        // Padding for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border border-slate-100"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === date.toDateString();
            
            // Check if this is a company holiday (manual)
            const holiday = holidays.find(h => new Date(h.date).toDateString() === date.toDateString());
            
            // Check if this is a company event
            const dayEvents = events.filter(e => new Date(e.date).toDateString() === date.toDateString());

            // Check if this is a weekend holiday based on policy
            let isPolicyHoliday = false;
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            if (dayOfWeek === 0) {
                isPolicyHoliday = true; // All policies have Sunday off
            } else if (dayOfWeek === 6) {
                if (holidayConfig === 'all-saturdays-sundays') {
                    isPolicyHoliday = true;
                } else if (holidayConfig === '1-3-saturdays') {
                    const weekNum = Math.ceil(day / 7);
                    if (weekNum === 1 || weekNum === 3) isPolicyHoliday = true;
                } else if (holidayConfig === '2-4-saturdays') {
                    const weekNum = Math.ceil(day / 7);
                    if (weekNum === 2 || weekNum === 4) isPolicyHoliday = true;
                }
            }

            days.push(
                <div 
                    key={day} 
                    className={`h-24 md:h-32 border border-slate-100 p-2 transition-all relative group overflow-hidden ${
                        isToday ? 'bg-blue-50/30 ring-1 ring-inset ring-blue-500' : 'bg-white hover:bg-slate-50'
                    }`}
                >
                    <span className={`text-sm font-black ${isToday ? 'text-blue-600 bg-blue-100 w-7 h-7 flex items-center justify-center rounded-full' : isPolicyHoliday ? 'text-rose-500' : 'text-slate-700'}`}>
                        {day}
                    </span>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-hide">
                        {isPolicyHoliday && !holiday && (
                            <div className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded leading-tight">
                                Weekend Off
                            </div>
                        )}
                        {holiday && (
                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded leading-tight border border-indigo-100">
                                ⭐ {holiday.name}
                            </div>
                        )}
                        {dayEvents.map(event => (
                            <div key={event._id} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded leading-tight border border-emerald-100 truncate shadow-sm">
                                📢 {event.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    if (loading) return <div className="p-8 font-bold text-slate-500 text-center mt-20">Initializing Calendar...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <CalendarHeart className="text-white" size={28} />
                        </div> 
                        Company Calendar
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                        <Star className="text-amber-400 fill-amber-400" size={16} /> Holidays, Events & Off-days
                    </p>
                </div>

                <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 min-w-[160px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-7 bg-slate-900 overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-x border-slate-800/50">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 border-l border-t border-slate-100">
                    {renderCalendar()}
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
                    <h3 className="text-rose-700 font-black mb-3 flex items-center gap-2">
                        <CalendarHeart size={20} /> Policy Policy
                    </h3>
                    <p className="text-rose-600 text-sm font-bold">
                        {holidayConfig === 'all-sundays' ? 'Every Sunday is a fixed off-day.' :
                         holidayConfig === 'all-saturdays-sundays' ? 'All Saturdays and Sundays are off-days.' :
                         holidayConfig === '1-3-saturdays' ? 'Only 1st & 3rd Saturdays are off-days, plus Sundays.' :
                         'Only 2-nd & 4-th Saturdays are off-days, plus Sundays.'}
                    </p>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl md:col-span-2">
                    <h3 className="text-indigo-700 font-black mb-3 flex items-center gap-2">
                        <CalendarDays size={20} /> Legend & Quick Info
                    </h3>
                    <div className="flex flex-wrap gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-rose-500"></div>
                            <span className="text-sm font-bold text-slate-600">Weekend Off</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-indigo-500"></div>
                            <span className="text-sm font-bold text-slate-600">Public Holiday</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-emerald-500"></div>
                            <span className="text-sm font-bold text-slate-600">Company Event</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded ring-2 ring-blue-500"></div>
                            <span className="text-sm font-bold text-slate-600">Today</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
