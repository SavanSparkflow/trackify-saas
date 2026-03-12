import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        companyName: '',
        companyEmail: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        role: 'admin'
    });
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, formData);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('name', res.data.name);
            toast.success(res.data.message);

            if (res.data.role === 'superadmin') {
                navigate('/superadmin');
            } else {
                navigate('/admin');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isSuper = formData.role === 'superadmin';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isSuper ? 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-500/30' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30'}`}>
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-slate-800">Track<span className={isSuper ? "text-rose-500" : "text-indigo-500"}>ify</span></span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            {isSuper ? 'Register Master System Admin' : 'Register your company account'}
                        </p>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('admin')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${!isSuper ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Company Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleSelect('superadmin')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${isSuper ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Super Admin
                        </button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">
                                    {isSuper ? 'Organization Name' : 'Company Name'}
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                    className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={isSuper ? "Trackify Hq" : "Acme Corp"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">
                                    {isSuper ? 'System Email' : 'Company Email'}
                                </label>
                                <input
                                    type="email"
                                    name="companyEmail"
                                    value={formData.companyEmail}
                                    onChange={handleChange}
                                    required
                                    className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder={isSuper ? "system@trackify.local" : "contact@acme.com"}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">
                                    {isSuper ? 'Admin Name' : 'Owner Name'}
                                </label>
                                <input
                                    type="text"
                                    name="ownerName"
                                    value={formData.ownerName}
                                    onChange={handleChange}
                                    required
                                    className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">
                                    {isSuper ? 'Admin Email (Login)' : 'Owner Email (Login)'}
                                </label>
                                <input
                                    type="email"
                                    name="ownerEmail"
                                    value={formData.ownerEmail}
                                    onChange={handleChange}
                                    required
                                    className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="john@acme.com"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-700">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                            className={`w-full py-3.5 px-4 text-white rounded-xl font-bold tracking-wide shadow-lg focus:outline-none focus:ring-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-6 md:mt-8 ${isSuper
                                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 focus:ring-rose-500'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 focus:ring-blue-500'
                                }`}
                        >
                            {loading ? 'Creating Account...' : (isSuper ? 'Create Super Admin' : 'Register Company')}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        <p>Already registered? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
