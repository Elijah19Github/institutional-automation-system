import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Apply = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        previousDegree: '',
        previousCgpa: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setMessage(data.message);
            } else {
                setError(data.message || 'Failed to submit application.');
            }
        } catch (err) {
            setError('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-indigo-500/30 font-sans">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="w-full max-w-md bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl mb-6 shadow-lg shadow-emerald-500/20">
                        ✅
                    </div>
                    <h2 className="text-3xl font-bold text-slate-100 mb-4">Application Received!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        {message} Our admissions team will review your profile shortly. Keep an eye on your email for updates regarding your provisional status and fee payment.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Return to Portal Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-indigo-500/30 font-sans py-12">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-[#1e293b]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] mb-4 shadow-lg shadow-indigo-500/20">
                        <div className="w-full h-full bg-[#1e293b] rounded-xl flex items-center justify-center border-2 border-transparent">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">Student Admission Application</h2>
                    <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">Fill out the form below to apply for the upcoming academic session. All fields marked with * are mandatory.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 animate-pulse">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300 ml-1">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/30 space-y-6">
                        <h3 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
                            <span>📚</span> Academic Background
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-300 ml-1">Previous Degree *</label>
                                <input
                                    type="text"
                                    name="previousDegree"
                                    required
                                    value={formData.previousDegree}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    placeholder="e.g. B.Sc. Computer Science"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-300 ml-1">CGPA / Percentage *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="previousCgpa"
                                    required
                                    value={formData.previousCgpa}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    placeholder="e.g. 8.5"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto flex-1 relative overflow-hidden group bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3.5 px-6 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </span>
                        </button>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Apply;
