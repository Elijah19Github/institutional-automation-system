import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const RegisterFaculty = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employee_id: '',
        department: '',
        phone_number: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Access Denied: Missing secure token. Ensure you clicked the full link provided by the administrator.");
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register-faculty', {
                token,
                ...formData
            });

            if (res.data.success) {
                setSuccess(res.data.message);
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="text-4xl mb-4">🚫</div>
                    <h2 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">Invalid Access</h2>
                    <p className="text-slate-500 font-medium text-sm mb-6">{error}</p>
                    <Link to="/login" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition">Return to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Faculty Onboarding</h2>
                    <p className="text-slate-500 font-medium text-xs mt-1">Complete your profile to access the institutional network.</p>
                </div>
                
                {error && <div className="p-4 mb-6 bg-rose-50 text-rose-600 text-sm font-bold border border-rose-200 rounded-xl">{error}</div>}
                {success && <div className="p-4 mb-6 bg-emerald-50 text-emerald-600 text-sm font-bold border border-emerald-200 rounded-xl">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input type="text" name="name" required placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" />
                    </div>
                    <div>
                        <input type="email" name="email" required placeholder="Institutional Email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" />
                    </div>
                    <div>
                        <input type="text" name="employee_id" required placeholder="Employee ID (System Identifier)" value={formData.employee_id} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium font-mono text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="department" placeholder="Department (e.g. MSc CS)" value={formData.department} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-sm" />
                        <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium text-sm" />
                    </div>
                    <div>
                        <input type="password" name="password" required minLength={6} placeholder="Set Password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium" />
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full mt-6 bg-indigo-600 text-white p-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50">
                        {loading ? 'Creating Profile...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterFaculty;
