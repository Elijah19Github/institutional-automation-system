import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { validate } from '../utils/validation';

const QuizCreator = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    // Form States
    const [quizMeta, setQuizMeta] = useState({
        title: '',
        description: '',
        subject_id: '',
        section_id: '',
        batch_id: '',
        duration_minutes: 30,
        total_marks: 100,
        difficulty: 'Medium',
        attempt_type: 'Single',
        start_at: '',
        end_at: '',
        is_published: false
    });

    const [questions, setQuestions] = useState([]);
    const [options, setOptions] = useState({ subjects: [], sections: [], batches: [], courses: [] });
    
    // AI Assist States
    const [aiConfig, setAiConfig] = useState({
        topic: '',
        num_questions: 5,
        content: ''
    });
    const [pdfFile, setPdfFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'ai'
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const res = await API.get('/academic-setup/setup-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOptions({
                    subjects: res.data.data.subjects,
                    sections: res.data.data.sections,
                    batches: res.data.data.batches,
                    courses: res.data.data.courses
                });
            }
        } catch (err) {
            console.error('Error fetching options:', err);
        }
    };

    const handleMetaChange = (e) => {
        const { name, value, type, checked } = e.target;
        setQuizMeta(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const addQuestion = () => {
        const newQ = {
            question: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: 'a',
            explanation: ''
        };
        setQuestions([...questions, newQ]);
        setEditingIndex(questions.length);
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const validateQuiz = () => {
        const titleError = validate('quizTitle', quizMeta.title);
        if (titleError) return titleError;

        if (!quizMeta.subject_id) return "Subject selection is required.";
        
        const timeError = validate('quizTime', { start: quizMeta.start_at, end: quizMeta.end_at });
        if (timeError) return timeError;

        if (questions.length === 0) return "At least one question is required.";
        
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
                return `Question ${i + 1} is incomplete (all 4 options required).`;
            }
        }
        return null;
    };

    const handleSave = async (publish = false) => {
        const validationError = validateQuiz();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Force integers for duration and marks
            const payload = { 
                ...quizMeta, 
                questions, 
                is_published: publish,
                duration_minutes: parseInt(quizMeta.duration_minutes) || 30,
                total_marks: parseInt(quizMeta.total_marks) || 100
            };

            const res = await API.post('/quiz/save', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSuccess(publish ? 'Quiz published successfully!' : 'Quiz saved as draft!');
                setTimeout(() => navigate('/quiz-library'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    const generateWithAI = async (e) => {
        e.preventDefault();
        if (!quizMeta.subject_id) {
            setError("Please select a subject in Quiz Basics before using AI generation");
            return;
        }
        if (!aiConfig.topic) {
            setError("Topic is required for AI generation");
            return;
        }
        setIsGenerating(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('topic', aiConfig.topic);
            formData.append('num_questions', aiConfig.num_questions);
            formData.append('content', aiConfig.content);
            formData.append('difficulty', quizMeta.difficulty);
            
            const subjectIdStr = String(quizMeta.subject_id);
            const selectedSubject = options.subjects.find(s => String(s.id) === subjectIdStr);
            const selectedCourse = options.courses.find(c => String(c.id) === String(selectedSubject?.course_id));
            
            formData.append('subject', selectedSubject?.name || '');
            formData.append('course_name', selectedCourse?.course_name || 'General');
            
            if (pdfFile) formData.append('pdf', pdfFile);

            const res = await API.post('/quiz/generate', formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.quiz) {
                setQuestions([...questions, ...res.data.quiz]);
                setActiveTab('manual');
                setSuccess(`AI generated ${res.data.quiz.length} questions!`);
            }
        } catch (err) {
            console.error('AI Generation Error:', err);
            const msg = err.response?.data?.error || 'AI Generation failed. Ensure AI service is running.';
            setError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    if (user?.role?.toLowerCase() === 'student') {
        return <div className="p-20 text-center font-bold text-rose-500">Access Denied: Only Faculty can create quizzes.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tighter uppercase">Create New Quiz</h1>
                    <p className="text-textSecondary text-sm">Configure academic assessments with scheduling and dynamic question building.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleSave(false)}
                        disabled={loading}
                        className="px-6 py-3 bg-surface border border-border text-textPrimary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : '💾 Save Draft'}
                    </button>
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={loading}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : '🚀 Publish Quiz'}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300">{error}</div>}
            {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold uppercase tracking-wider animate-in fade-in duration-300">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col: Setup & Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6">
                        <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Quiz Basics
                        </h2>

                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="form-label">Quiz Title</label>
                                <input 
                                    type="text" name="title" value={quizMeta.title} onChange={handleMetaChange}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold placeholder:text-textSecondary/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="e.g. Operating Systems Unit 1"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea 
                                    name="description" value={quizMeta.description} onChange={handleMetaChange}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-medium min-h-[120px] placeholder:text-textSecondary/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="Describe the quiz scope, topics covered, and any specific instructions for students..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Associated Subject</label>
                                <select 
                                    name="subject_id" value={quizMeta.subject_id} onChange={handleMetaChange}
                                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                >
                                    <option value="">Select Target Subject...</option>
                                    {options.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6">
                        <h2 className="text-xs font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                            Targeting & Timing
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Section</label>
                                    <select name="section_id" value={quizMeta.section_id} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold">
                                        <option value="">All Sections</option>
                                        {options.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Batch</label>
                                    <select name="batch_id" value={quizMeta.batch_id} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold">
                                        <option value="">All Batches</option>
                                        {options.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Duration</label>
                                    <select name="duration_minutes" value={quizMeta.duration_minutes} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold">
                                        <option value="15">15 Minutes</option>
                                        <option value="30">30 Minutes</option>
                                        <option value="45">45 Minutes</option>
                                        <option value="60">1 Hour (60 Mins)</option>
                                        <option value="90">1.5 Hours (90 Mins)</option>
                                        <option value="120">2 Hours (120 Mins)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Total Marks</label>
                                    <input type="number" name="total_marks" value={quizMeta.total_marks} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Difficulty</label>
                                    <select name="difficulty" value={quizMeta.difficulty} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold">
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Attempt Type</label>
                                    <select name="attempt_type" value={quizMeta.attempt_type} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold">
                                        <option>Single</option>
                                        <option>Multiple</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Start Date & Time</label>
                                <input type="datetime-local" name="start_at" value={quizMeta.start_at} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">End Date & Time</label>
                                <input type="datetime-local" name="end_at" value={quizMeta.end_at} onChange={handleMetaChange} className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Question Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="bg-background/50 border-b border-border p-1 flex">
                            <button 
                                onClick={() => setActiveTab('manual')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'manual' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-textSecondary hover:bg-secondary'}`}
                            >
                                ✍️ Manual Question Builder
                            </button>
                            <button 
                                onClick={() => setActiveTab('ai')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === 'ai' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-textSecondary hover:bg-secondary'}`}
                            >
                                🤖 AI-Powered Assistant
                            </button>
                        </div>

                        <div className="p-8">
                            {activeTab === 'ai' ? (
                                <form onSubmit={generateWithAI} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Specific Topic</label>
                                            <input 
                                                type="text" value={aiConfig.topic} onChange={(e) => setAiConfig({...aiConfig, topic: e.target.value})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium"
                                                placeholder="e.g. Memory Segmentation"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Quantity</label>
                                            <input 
                                                type="number" value={aiConfig.num_questions} onChange={(e) => setAiConfig({...aiConfig, num_questions: e.target.value})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium"
                                                min="1" max="15"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Context / Content (Text or PDF)</label>
                                        <textarea 
                                            value={aiConfig.content} onChange={(e) => setAiConfig({...aiConfig, content: e.target.value})}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium min-h-[100px]"
                                            placeholder="Paste relevant text here or attach a file..."
                                        />
                                        <input 
                                            type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files[0])}
                                            className="mt-3 text-xs text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-secondary file:text-textPrimary"
                                        />
                                    </div>
                                    <button 
                                        type="submit" disabled={isGenerating}
                                        className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? '🤖 AI is analyzing and generating...' : '✨ Magic-Generate Questions'}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                                    {questions.length === 0 ? (
                                        <div className="text-center py-20 bg-background/30 rounded-3xl border border-dashed border-border/60">
                                            <div className="text-4xl mb-4">📝</div>
                                            <p className="text-textSecondary font-bold text-xs uppercase tracking-widest">No questions added yet.</p>
                                            <button 
                                                onClick={addQuestion}
                                                className="mt-4 px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                Add First Question
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {questions.map((q, idx) => (
                                                <div key={idx} className={`bg-background border transition-all rounded-2xl ${editingIndex === idx ? 'border-primary ring-2 ring-primary/10 p-6' : 'border-border/60 p-5 hover:border-border'}`}>
                                                    {editingIndex === idx ? (
                                                        <div className="space-y-6">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Editing Question {idx + 1}</span>
                                                                <button onClick={() => setEditingIndex(null)} className="text-[10px] font-black uppercase text-textSecondary hover:text-rose-500">Close Edit</button>
                                                            </div>
                                                            <textarea 
                                                                value={q.question} onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)}
                                                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none"
                                                                placeholder="Enter your question here..."
                                                                rows="2"
                                                            />
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {['a', 'b', 'c', 'd'].map(opt => (
                                                                    <div key={opt} className="space-y-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <label className="text-[10px] font-black uppercase text-textSecondary ml-1">Option {opt.toUpperCase()}</label>
                                                                            {q.correct_answer === opt && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded uppercase">Correct</span>}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text" value={q[`option_${opt}`]} onChange={(e) => handleQuestionChange(idx, `option_${opt}`, e.target.value)}
                                                                                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-xs font-medium outline-none"
                                                                                placeholder={`Option ${opt.toUpperCase()}...`}
                                                                            />
                                                                            <button 
                                                                                onClick={() => handleQuestionChange(idx, 'correct_answer', opt)}
                                                                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${q.correct_answer === opt ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-surface border-border text-textSecondary hover:border-emerald-500'}`}
                                                                            >
                                                                                ✓
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase text-textSecondary mb-1 block">Explanation (Optional)</label>
                                                                <textarea 
                                                                    value={q.explanation} onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                                                                    className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-xs font-medium outline-none"
                                                                    placeholder="Why is the chosen option correct?"
                                                                    rows="2"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => removeQuestion(idx)}
                                                                className="w-full py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                                                            >
                                                                Delete Question
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-start gap-6 group">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-textPrimary"><span className="text-textSecondary mr-2">Q{idx+1}.</span>{q.question || <span className="text-rose-400 opacity-50 italic">[Question Empty]</span>}</p>
                                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                                                                    {['a', 'b', 'c', 'd'].map(opt => (
                                                                        <div key={opt} className={`text-[10px] font-medium ${q.correct_answer === opt ? 'text-emerald-500 font-black' : 'text-textSecondary opacity-70'}`}>
                                                                            <span className="uppercase mr-2 font-black">{opt}:</span> {q[`option_${opt}`] || '---'}
                                                                            {q.correct_answer === opt && ' ✓'}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => setEditingIndex(idx)} className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all">✏️</button>
                                                                <button onClick={() => removeQuestion(idx)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button 
                                                onClick={addQuestion}
                                                className="w-full py-4 bg-background border border-dashed border-border/80 text-textSecondary hover:border-primary hover:text-primary rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
                                            >
                                                + Add Another Question
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizCreator;
