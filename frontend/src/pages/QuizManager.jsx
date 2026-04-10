import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const QuizManager = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await API.get('/quiz', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setQuizzes(res.data.data);
            }
        } catch (err) {
            setError('Failed to load quizzes.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quiz? This action is irreversible.')) return;
        try {
            const res = await API.delete(`/quiz/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setQuizzes(quizzes.filter(q => q.id !== id));
            }
        } catch (err) {
            alert('Delete failed.');
        }
    };

    const getStatus = (q) => {
        if (!q.is_published) return { label: 'Draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
        const now = new Date();
        const start = q.start_at ? new Date(q.start_at) : null;
        const end = q.end_at ? new Date(q.end_at) : null;

        if (end && now > end) return { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        if (start && now < start) return { label: 'Scheduled', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
        return { label: 'Active', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    };

    if (user?.role?.toLowerCase() === 'student') {
        return <div className="p-20 text-center font-bold text-rose-500">Access Denied.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tighter uppercase">Quiz Management</h1>
                    <p className="text-textSecondary text-sm">Control academic assessments, monitor participation, and analyze results.</p>
                </div>
                <button 
                    onClick={() => navigate('/quiz-creator')}
                    className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                    + Create New Quiz
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-textSecondary font-black text-[10px] uppercase tracking-widest">Loading quiz repository...</p>
                </div>
            ) : quizzes.length === 0 ? (
                <div className="py-20 text-center bg-surface rounded-3xl border border-dashed border-border/60">
                    <p className="text-textSecondary font-bold text-sm uppercase tracking-widest">No quizzes found.</p>
                    <button 
                        onClick={() => navigate('/quiz-creator')}
                        className="mt-4 text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
                    >
                        Start by creating your first quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quizzes.map((q) => {
                        const status = getStatus(q);
                        return (
                            <div key={q.id} className="bg-surface rounded-3xl border border-border p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/20 transition-all group flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                                        {status.label}
                                    </div>
                                    <div className="text-[10px] font-black text-textSecondary uppercase tracking-widest opacity-50">
                                        {q.difficulty}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-textPrimary tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">{q.title}</h3>
                                <p className="text-xs text-textSecondary font-medium mb-6 line-clamp-2 min-h-[32px]">{q.description || 'No description provided for this academic assessment.'}</p>
                                
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-background/50 rounded-2xl p-3 border border-border/50">
                                        <div className="text-[8px] font-black text-textSecondary uppercase tracking-widest mb-1 opacity-60">Attempts</div>
                                        <div className="text-lg font-black text-textPrimary">{q.attempt_count || 0}</div>
                                    </div>
                                    <div className="bg-background/50 rounded-2xl p-3 border border-border/50">
                                        <div className="text-[8px] font-black text-textSecondary uppercase tracking-widest mb-1 opacity-60">Avg Score</div>
                                        <div className="text-lg font-black text-primary">{q.avg_score ? `${Math.round(q.avg_score)}%` : '--'}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-textSecondary font-black uppercase tracking-widest mb-6 opacity-60">
                                    <span>🕒 {q.duration_minutes}m</span>
                                    <span>•</span>
                                    <span>📚 {q.subject_name || 'Subject'}</span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => navigate(`/quiz-results/${q.id}`)}
                                        className="py-2.5 bg-background border border-border text-textPrimary hover:bg-secondary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all"
                                    >
                                        Results
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(q.id)}
                                        className="py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuizManager;
