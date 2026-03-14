import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Mock Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Companies from './pages/superadmin/Companies';
import Plans from './pages/superadmin/Plans';
import Subscriptions from './pages/superadmin/Subscriptions';
import RevenueAnalytics from './pages/superadmin/RevenueAnalytics';
import SystemSettings from './pages/superadmin/SystemSettings';
import Employees from './pages/admin/Employees';
import Attendance from './pages/admin/Attendance';
import Leaves from './pages/admin/Leaves';
import Profile from './pages/admin/Profile';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import Holidays from './pages/admin/Holidays';
import Rules from './pages/admin/Rules';
import Payroll from './pages/admin/Payroll';
import Events from './pages/admin/Events';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Super Admin Routes */}
                <Route path="/superadmin" element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                        <DashboardLayout role="superadmin" />
                    </ProtectedRoute>
                }>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="plans" element={<Plans />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="revenue" element={<RevenueAnalytics />} />
                    <Route path="settings" element={<SystemSettings />} />
                </Route>

                {/* Company Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DashboardLayout role="admin" />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="leaves" element={<Leaves />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="holidays" element={<Holidays />} />
                    <Route path="events" element={<Events />} />
                    <Route path="rules" element={<Rules />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
