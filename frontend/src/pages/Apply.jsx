import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validate } from '../utils/validation';

const courseCategories = {
    'UG': [
        { id: 'BSC', name: 'BSc. Computer Science' },
        { id: 'BCA', name: 'Bachelor of Computer Applications (BCA)' },
        { id: 'BCOM', name: 'B.Com (Standard)' }
    ],
    'PG': [
        { id: 'MCA', name: 'Master of Computer Applications (MCA)' },
        { id: 'MSC', name: 'MSc. Computer Science' },
        { id: 'MA', name: 'MA English Literature' }
    ],
    'PhD': [
        { id: 'PHD_CHEM', name: 'PhD in Chemistry' },
        { id: 'PHD_CS', name: 'PhD in Computer Science' }
    ],
    'Online': [
        { id: 'MBA', name: 'Online MBA (Data Science)' },
        { id: 'CERT_AI', name: 'Professional AI Certification' }
    ]
};

const Apply = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        course: '',
        previousDegree: '',
        previousCgpa: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validateForm = () => {
        const fNameError = validate('name', formData.firstName); 
        if (fNameError) return fNameError;

        const lNameError = validate('name', formData.lastName);
        if (lNameError) return lNameError;

        const emailError = validate('email', formData.email);
        if (emailError) return emailError;

        const phoneError = validate('phone', formData.phone);
        if (phoneError) return phoneError;
        
        const cgpaError = validate('cgpa', formData.previousCgpa);
        if (cgpaError) return cgpaError;
        
        if (!formData.course) return "Please select a program.";
        
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Immediate simple validation for names to prevent non-alpha typing
        if ((name === 'firstName' || name === 'lastName') && value !== '' && !/^[A-Za-z\s]*$/.test(value)) {
            return; 
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setFormData({ ...formData, course: '' }); // Reset course when category changes
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

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
            <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/30 font-sans">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 text-4xl mb-6 shadow-lg shadow-emerald-500/20">
                        ✅
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Application Received!</h2>
                    <p className="text-textSecondary mb-8 leading-relaxed">
                        {message} Our admissions team will review your profile shortly. Keep an eye on your email for updates regarding your provisional status and fee payment.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Return to Portal Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/30 font-sans py-12">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-2xl bg-surface/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent p-[2px] mb-4 shadow-lg shadow-indigo-500/20">
                        <div className="w-full h-full bg-surface rounded-xl flex items-center justify-center border-2 border-transparent">
                            <span className="text-2xl">📝</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-accent tracking-tight">Student Admission Application</h2>
                    <p className="text-textSecondary mt-2 text-sm max-w-lg mx-auto">Fill out the form below to apply for the upcoming academic session. All fields marked with * are mandatory.</p>
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
                            <label className="text-sm font-medium text-textPrimary ml-1">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-textPrimary ml-1">Last Name *</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-textPrimary ml-1">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                placeholder="john.doe@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-textPrimary ml-1">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                maxLength={10}
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                placeholder="9876543210"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-textPrimary ml-1">Study Level *</label>
                            <select
                                required
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                            >
                                <option value="" disabled>Select Level...</option>
                                <option value="UG">Undergraduate (UG)</option>
                                <option value="PG">Postgraduate (PG)</option>
                                <option value="PhD">Doctorate (PhD)</option>
                                <option value="Online">Online / Professional</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-textPrimary ml-1">Program *</label>
                            <select
                                name="course"
                                required
                                disabled={!selectedCategory}
                                value={formData.course}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-surface/50 border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none disabled:opacity-50"
                            >
                                <option value="" disabled>Select Program...</option>
                                {selectedCategory && courseCategories[selectedCategory].map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-surface/30 p-5 rounded-2xl border border-border/30 space-y-6">
                        <h3 className="text-primary font-semibold mb-2 flex items-center gap-2">
                            <span>📚</span> Academic Background
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-textPrimary ml-1">Highest Degree *</label>
                                <input
                                    type="text"
                                    name="previousDegree"
                                    required
                                    value={formData.previousDegree}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="e.g. Higher Secondary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-textPrimary ml-1">CGPA / % Score *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="previousCgpa"
                                    required
                                    value={formData.previousCgpa}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    placeholder="e.g. 9.2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto flex-1 relative overflow-hidden group bg-primary hover:bg-primary/90 text-white font-medium py-3.5 px-6 rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-indigo-500/20"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? 'Processing Submission...' : 'Securely Submit Application'}
                            </span>
                        </button>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl border border-border text-textPrimary hover:bg-surface transition-colors font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Apply;

