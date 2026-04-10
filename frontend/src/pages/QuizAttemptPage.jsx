import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';

const QuizAttemptPage = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    
    // Quiz Data
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    
    // State
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Timer Ref
    const timerRef = useRef(null);

    useEffect(() => {
        fetchQuizData();
        return () => clearInterval(timerRef.current);
    }, []);

    const fetchQuizData = async () => {
        try {
            const res = await API.get(`/quiz/${id}/attempt-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setQuiz(res.data.data);
                setQuestions(res.data.data.questions);
                
                // Calculate time left from duration and start time (simplified for now: full duration)
                // In production, sync with SERVER start time!
                setTimeLeft(res.data.data.duration_minutes * 60);
                startTimer();
            }
        } catch (err) {
            console.error(err);
            navigate('/assessments');
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    autoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const autoSubmit = () => {
        console.log("Time is up! Auto-submitting...");
        submitQuiz(true);
    };

    const submitQuiz = async (isAuto = false) => {
        if (!isAuto && !window.confirm("Are you sure you want to submit?")) return;
        
        setSubmitting(true);
        try {
            const res = await API.post(`/quiz/${id}/submit`, { answers }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                clearInterval(timerRef.current);
                navigate(`/quiz/${id}/result`, { state: { result: res.data } });
            }
        } catch (err) {
            alert("Submission failed. Please try again.");
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    if (loading) return (
        <div className="h-screen bg-background flex flex-col items-center justify-center">
            <div className="animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-textSecondary font-black uppercase tracking-widest text-[10px]">Synchronizing Secure Assessment Content...</p>
        </div>
    );

    const currentQ = questions[currentIdx];

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden fixed inset-0 z-[100]">
            
            {/* Top Bar */}
            <header className="h-20 bg-surface border-b border-border px-8 flex items-center justify-between shadow-sm flex-none">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black">Q</div>
                    <div>
                        <h1 className="font-black text-textPrimary tracking-tight line-clamp-1">{quiz?.title}</h1>
                        <p className="text-[10px] text-textSecondary font-black uppercase tracking-widest opacity-60">Total Points: {quiz?.total_marks}</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className={`flex flex-col items-end ${timeLeft < 300 ? 'text-rose-500' : 'text-textPrimary'}`}>
                        <span className="text-[10px] font-black uppercase opacity-60">Time Remaining</span>
                        <span className="text-2xl font-black tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                    <button 
                        onClick={() => submitQuiz(false)}
                        disabled={submitting}
                        className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {submitting ? '...' : 'Finish & Submit'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Sidebar: Navigation */}
                <aside className="w-80 bg-surface border-r border-border p-8 flex flex-col gap-8 overflow-y-auto flex-none">
                    <div>
                        <h2 className="text-[10px] font-black text-textSecondary uppercase tracking-[0.2em] mb-4">Question Progress</h2>
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIdx(idx)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all border-2 
                                        ${currentIdx === idx ? 'border-primary bg-primary/10 text-primary scale-110 shadow-lg' : 
                                          answers[idx] !== undefined ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600' : 
                                          'border-border text-textSecondary hover:border-primary/50'}`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto bg-background/50 rounded-2xl p-6 border border-border/50">
                        <h3 className="text-[10px] font-black text-textSecondary uppercase tracking-widest mb-3">Legend</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-textPrimary opacity-60">
                                <div className="w-3 h-3 rounded bg-primary"></div> Current
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-textPrimary opacity-60">
                                <div className="w-3 h-3 rounded bg-emerald-500"></div> Answered
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-textPrimary opacity-60">
                                <div className="w-3 h-3 rounded bg-border"></div> Unvisited
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main: Question Surface */}
                <main className="flex-1 overflow-auto bg-background p-12 md:p-20 flex flex-col items-center">
                    <div className="max-w-2xl w-full space-y-12">
                        
                        {/* Question Content */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl font-black text-primary/30">#{currentIdx + 1}</span>
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/30 to-transparent"></div>
                            </div>
                            <h2 className="text-2xl font-bold text-textPrimary leading-tight">
                                {currentQ?.question}
                            </h2>
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            {['a', 'b', 'c', 'd'].map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setAnswers({...answers, [currentIdx]: opt})}
                                    className={`w-full p-6 rounded-[1.5rem] border-2 text-left transition-all flex items-center gap-6 group
                                        ${answers[currentIdx] === opt ? 
                                          'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 
                                          'border-border hover:border-primary/30 hover:bg-surface'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black uppercase transition-all
                                        ${answers[currentIdx] === opt ? 'bg-primary text-white' : 'bg-background text-textSecondary group-hover:text-primary'}`}>
                                        {opt}
                                    </div>
                                    <span className={`flex-1 font-bold ${answers[currentIdx] === opt ? 'text-textPrimary' : 'text-textSecondary opacity-80'}`}>
                                        {currentQ?.[`option_${opt}`]}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-8 border-t border-border/50">
                            <button 
                                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                disabled={currentIdx === 0}
                                className="px-8 py-3 bg-surface border border-border text-textPrimary rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 hover:bg-secondary transition-all"
                            >
                                ← Previous
                            </button>
                            <span className="text-[10px] font-black text-textSecondary uppercase tracking-[0.4em]">Question {currentIdx + 1} of {questions.length}</span>
                            <button 
                                onClick={() => {
                                    if (currentIdx < questions.length - 1) {
                                        setCurrentIdx(currentIdx + 1);
                                    } else {
                                        submitQuiz(false);
                                    }
                                }}
                                className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg"
                            >
                                {currentIdx === questions.length - 1 ? 'Finish →' : 'Next Question →'}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default QuizAttemptPage;
