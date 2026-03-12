import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        companyId: '',
        phone: '',
        parentPhone: ''
    });
    const [companies, setCompanies] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if already logged in
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/');
        }

        // Fetch active companies for the dropdown
        const fetchCompanies = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/auth/companies`);
                setCompanies(res.data);
            } catch (err) {
                toast.error('Failed to load companies list');
            }
        };
        fetchCompanies();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.companyId) {
            toast.error('Please select a company to join');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/employee/register`, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('name', res.data.name);

            toast.success(res.data.message);
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-10">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            <span className="text-blue-600">Trackify</span> Employee
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Create your worker profile</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Company / Tenant</label>
                            <select
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleChange}
                                required
                                className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-slate-700 font-medium"
                            >
                                <option value="" disabled>Select your company</option>
                                {companies.map(c => (
                                    <option key={c._id} value={c._id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="employee@acme.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="+91..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700">Parent Phone</label>
                                    <input
                                        type="text"
                                        name="parentPhone"
                                        value={formData.parentPhone}
                                        onChange={handleChange}
                                        required
                                        className="mt-2 block w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="+91..."
                                    />
                                </div>
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
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all active:scale-[0.98] disabled:opacity-70 mt-6"
                        >
                            {loading ? 'Registering...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm font-medium text-slate-500">
                        <p>Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
