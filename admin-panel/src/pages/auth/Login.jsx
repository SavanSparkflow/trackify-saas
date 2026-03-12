import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token) {
            if (role === 'superadmin') {
                navigate('/superadmin');
            } else if (role === 'admin') {
                navigate('/admin');
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                email,
                password,
                panel: 'admin'
            });

            if (res.data.role === 'employee') {
                throw new Error('Employees cannot log into the Admin Panel');
            }

            localStorage.setItem('role', res.data.role);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('name', res.data.name); // Saving name for sidebar

            toast.success(`Welcome back, ${res.data.name}`);

            if (res.data.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/admin');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-10">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-blue-600">Trackify</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-[38px] text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        <p>Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register your company</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
