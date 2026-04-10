import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const StudentQuizDashboard = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState({ available: [], ongoing: null, completed: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await API.get('/quiz/student/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (id) => {
        try {
            const res = await API.post(`/quiz/${id}/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                navigate(`/quiz/${id}/attempt`);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to start quiz');
        }
    };

    if (loading) return (
        <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-textSecondary font-black text-[10px] uppercase tracking-widest">Loading assessment portal...</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-textPrimary tracking-tighter uppercase italic underline decoration-primary/30 decoration-8 underline-offset-[-2px]">My Assessments</h1>
                <p className="text-textSecondary text-sm mt-2">Track your academic progress and participate in scheduled examinations.</p>
            </div>

            {/* PROFILE INCOMPLETE WARNING */}
            {data.is_profile_incomplete && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-3xl">🧩</div>
                        <div>
                            <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Assignment Pending</h3>
                            <p className="text-amber-700 text-sm font-medium">Your account hasn't been assigned to a Section or Batch yet. Once your registration is complete, your specific assessments will appear here.</p>
                        </div>
                    </div>
                    <div className="px-5 py-2 bg-amber-200 text-amber-800 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        Check back soon
                    </div>
                </div>
            )}

            {/* Ongoing Attempt (Priority Card) */}
            {data.ongoing && (
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-white/10 animate-pulse">
                    <div className="flex-1">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">🔴 Resume Required</span>
                        <h2 className="text-3xl font-black mt-3">{data.ongoing.title}</h2>
                        <p className="text-indigo-100 text-sm mt-1 opacity-80">You have an active session for this quiz. Time is running!</p>
                    </div>
                    <button 
                        onClick={() => navigate(`/quiz/${data.ongoing.id}/attempt`)}
                        className="px-10 py-4 bg-white text-indigo-700 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform active:scale-95"
                    >
                        Continue Attempt
                    </button>
                </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Available Quizzes */}
                <section className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        Available Quizzes
                    </h3>
                    
                    {data.available.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-border/60 rounded-3xl text-center">
                            <p className="text-textSecondary text-xs font-black uppercase tracking-widest opacity-40">No assessments scheduled at this time.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.available.map(q => (
                                <div key={q.id} className="bg-surface border border-border rounded-3xl p-6 group hover:border-primary/50 transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black text-textSecondary uppercase tracking-widest mb-1 opacity-60">{q.difficulty} • {q.duration_minutes} Mins</div>
                                        <h4 className="text-lg font-black text-textPrimary group-hover:text-primary transition-colors">{q.title}</h4>
                                        <div className="text-[10px] text-textSecondary mt-2 font-medium">Ends: {new Date(q.end_at).toLocaleString()}</div>
                                    </div>
                                    <button 
                                        onClick={() => startQuiz(q.id)}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                                    >
                                        Start Quiz
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Completed Quizzes */}
                <section className="space-y-6">
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Completion History
                    </h3>

                    {data.completed.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-border/60 rounded-3xl text-center">
                            <p className="text-textSecondary text-xs font-black uppercase tracking-widest opacity-40">No past attempts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.completed.map((q, i) => (
                                <div key={i} className="bg-surface/50 border border-border/60 rounded-3xl p-6 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-base font-black text-textPrimary opacity-80">{q.title}</h4>
                                        <div className="text-[9px] text-textSecondary mt-1 font-black uppercase tracking-widest opacity-50">Submitted {new Date(q.submitted_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-emerald-600">{Math.round((q.score/q.total_marks)*100)}%</div>
                                        <div className="text-[9px] font-black text-textSecondary uppercase tracking-widest opacity-50">{q.score} / {q.total_marks}</div>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/quiz/${q.quiz_id}/result`)}
                                        className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors"
                                    >
                                        👁️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default StudentQuizDashboard;
