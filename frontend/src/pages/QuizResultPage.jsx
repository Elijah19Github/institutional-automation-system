import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const QuizResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const result = location.state?.result;

    if (!result) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-2xl font-black text-textPrimary uppercase tracking-tighter">Result Not Found</h1>
                <p className="text-textSecondary text-sm mt-2">We couldn't retrieve your performance data for this session.</p>
                <button 
                    onClick={() => navigate('/assessments')}
                    className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                >
                    Back to Portal
                </button>
            </div>
        );
    }

    const percentage = Math.round((result.score / result.total_marks) * 100);
    const isPassed = percentage >= 40; // Example threshold

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-12">
            <div className="max-w-xl w-full bg-surface rounded-[3rem] border border-border p-10 md:p-16 shadow-2xl relative overflow-hidden text-center">
                
                {/* Decorative Background Element */}
                <div className={`absolute top-0 left-0 w-full h-2 ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                
                {/* Visual Header */}
                <div className="relative z-10 space-y-8">
                    <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl transition-all animate-bounce duration-[2000ms] ${isPassed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {isPassed ? '🎯' : '💪'}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-textPrimary tracking-tight uppercase">
                            Assessment {isPassed ? 'Completed' : 'Attempted'}
                        </h1>
                        <p className="text-textSecondary text-xs font-black uppercase tracking-[0.2em] opacity-60">Session Identification: {id.slice(0,8)}</p>
                    </div>

                    {/* Score Circle */}
                    <div className="relative inline-flex items-center justify-center">
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                className="text-border"
                            />
                            <circle
                                cx="96" cy="96" r="88"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 88}
                                strokeDashoffset={2 * Math.PI * 88 * (1 - percentage / 100)}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ease-out ${isPassed ? 'text-emerald-500' : 'text-rose-500'}`}
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-black text-textPrimary tracking-tighter">{percentage}%</span>
                            <span className="text-[10px] font-black text-textSecondary uppercase tracking-widest opacity-60">Total Score</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background/50 border border-border/60 rounded-3xl p-6">
                            <div className="text-[8px] font-black text-textSecondary uppercase tracking-widest mb-1 opacity-60">Points Earned</div>
                            <div className="text-2xl font-black text-textPrimary">{result.score}</div>
                        </div>
                        <div className="bg-background/50 border border-border/60 rounded-3xl p-6">
                            <div className="text-[8px] font-black text-textSecondary uppercase tracking-widest mb-1 opacity-60">Max Potential</div>
                            <div className="text-2xl font-black text-textPrimary">{result.total_marks}</div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-8">
                        <button 
                            onClick={() => navigate('/assessments')}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                        >
                            Back to My Assessments
                        </button>
                    </div>

                    <p className="text-[10px] text-textSecondary font-medium opacity-50 px-8">
                        Your results have been automatically synchronized with your academic profile and notified to the respective department head.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuizResultPage;
