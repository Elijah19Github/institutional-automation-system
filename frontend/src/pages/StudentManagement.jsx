import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StudentManagement = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState(new Set());

    
    // Filters State
    const [filters, setFilters] = useState({
        search: '',
        course_id: '',
        batch_id: '',
        semester_id: ''
    });

    const [isPromoting, setIsPromoting] = useState(false);
    const [activeStudent, setActiveStudent] = useState(null);
    const [promotionData, setPromotionData] = useState({ semester_id: '', section_id: '' });
    const [promoLoading, setPromoLoading] = useState(false);


    // Options for Dropdowns
    const [options, setOptions] = useState({
        courses: [],
        batches: [],
        semesters: [],
        sections: []
    });

    const fetchSetupData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/academic-setup/setup-data', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setOptions({
                    courses: res.data.data.courses,
                    batches: res.data.data.batches,
                    semesters: res.data.data.semesters,
                    sections: res.data.data.sections
                });
            }
        } catch (err) {
            console.error('Error fetching setup data:', err);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/student-directory-rich`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    course_id: filters.course_id,
                    batch_id: filters.batch_id,
                    semester_id: filters.semester_id
                }
            });
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!promotionData.semester_id || !promotionData.section_id) return;
        setPromoLoading(true);
        try {
            const res = await axios.patch(`http://localhost:5000/api/admin/students/${activeStudent.id}/enrollment`, promotionData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('Student promoted/migrated successfully!');
                setIsPromoting(false);
                fetchStudents();
            }
        } catch (err) {
            console.error('Promotion error:', err);
            alert(err.response?.data?.message || 'Failed to promote student.');
        } finally {
            setPromoLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSetupData();
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchStudents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, filters.course_id, filters.batch_id, filters.semester_id]);

    const toggleExpand = (id) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredStudents = students.filter(s => {
        if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase()) && !s.regno.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    const PromoteModal = () => {
        if (!activeStudent) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                    <h2 className="text-2xl font-black text-textPrimary tracking-tight uppercase mb-2">Promote / Migrate</h2>
                    <p className="text-textSecondary text-sm mb-6">Moving student <span className="text-primary font-bold">{activeStudent.name}</span> to a new academic placement.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Target Semester</label>
                            <select 
                                value={promotionData.semester_id}
                                onChange={(e) => setPromotionData({...promotionData, semester_id: e.target.value})}
                                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                <option value="">Select Semester</option>
                                {options.semesters.map(sem => (
                                    <option key={sem.id} value={sem.id}>Semester {sem.semester_number}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary">Target Section</label>
                            <select 
                                value={promotionData.section_id}
                                onChange={(e) => setPromotionData({...promotionData, section_id: e.target.value})}
                                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                <option value="">Select Section</option>
                                {options.sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                onClick={() => setIsPromoting(false)}
                                className="flex-1 px-6 py-3 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-secondary transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handlePromote}
                                disabled={promoLoading}
                                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                            >
                                {promoLoading ? 'Processing...' : 'Confirm Migration'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {isPromoting && <PromoteModal />}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-textPrimary uppercase tracking-tighter">Student Directory</h1>
                    <p className="text-textSecondary text-sm">Detailed performance and risk overview of all students.</p>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">🔍</span>
                    <input 
                        type="text" 
                        name="search"
                        placeholder="Search by Name or USN..."
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>

                <select 
                    name="course_id" 
                    value={filters.course_id} 
                    onChange={handleFilterChange}
                    className="bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
                >
                    <option value="">All Courses</option>
                    {options.courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                </select>

                <select 
                    name="batch_id" 
                    value={filters.batch_id} 
                    onChange={handleFilterChange}
                    className="bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
                >
                    <option value="">All Batches</option>
                    {options.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select 
                    name="semester_id" 
                    value={filters.semester_id} 
                    onChange={handleFilterChange}
                    className="bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
                >
                    <option value="">All Semesters</option>
                    {options.semesters.map(s => <option key={s.id} value={s.id}>{s.name || `Semester ${s.semester_number}`}</option>)}
                </select>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-textSecondary font-bold text-sm uppercase tracking-widest">Loading directory...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-textSecondary bg-surface rounded-2xl border border-dashed border-border/60">No students found.</div>
                ) : (
                    filteredStudents.map((s) => {
                        const isExpanded = expandedIds.has(s.id);
                        return (
                            <div key={s.id} className={`bg-surface rounded-2xl border transition-all hover:shadow-xl hover:shadow-slate-200/20 ${isExpanded ? 'border-primary ring-1 ring-primary/20 shadow-lg' : 'border-border'}`}>
                                {/* Compact / Header Row */}
                                <div 
                                    className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer select-none"
                                    onClick={() => toggleExpand(s.id)}
                                >
                                    <div className="flex items-center gap-5 min-w-[300px]">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl uppercase shadow-inner">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-textPrimary text-xl tracking-tight leading-none">{s.name}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-textSecondary mt-2 font-black uppercase tracking-wider">
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">{s.regno}</span>
                                                • {s.course} • {s.batch} • {s.semester}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10 w-full md:w-auto">
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-textSecondary uppercase tracking-widest mb-1.5 opacity-60">Attendance</div>
                                            <div className={`font-black text-2xl tracking-tighter ${s.overall_attendance < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {s.overall_attendance}%
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-textSecondary uppercase tracking-widest mb-1.5 opacity-60">Avg Score</div>
                                            <div className={`font-black text-2xl tracking-tighter ${s.avg_marks < 50 ? 'text-rose-500' : 'text-primary'}`}>
                                                {s.avg_marks}%
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 ml-auto">
                                            <button 
                                                className="px-4 py-2.5 bg-background border border-border text-textPrimary hover:bg-secondary transition-all rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/student-risk/${s.id}`); }}
                                            >
                                                Analyze
                                            </button>
                                            <button 
                                                className="px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${s.user_id || s.user_id_ref || s.id}`); }}
                                            >
                                                Profile
                                            </button>
                                            <div className={`text-textSecondary text-xs transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Detail Panel */}
                                {isExpanded && (
                                    <div className="border-t border-border bg-background/30 p-8 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-black text-textPrimary text-xs uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                                Academic Placement Control
                                            </h4>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveStudent(s);
                                                    setPromotionData({ semester_id: '', section_id: '' });
                                                    setIsPromoting(true);
                                                }}
                                                className="px-6 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                            >
                                                ✨ Promote / Migrate Student
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                            {/* Left Col: Subject breakdown */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-surface px-6 py-3 rounded-xl border border-border font-black text-[10px] text-textSecondary uppercase tracking-widest">
                                                    <span>Subject</span>
                                                    <span>Performance Metrics</span>
                                                </div>
                                                {s.subjects?.map(sub => (
                                                    <div key={sub.id} className="flex justify-between items-center bg-surface px-6 py-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                                                        <div className="font-bold text-sm text-textPrimary truncate mr-4">{sub.name}</div>
                                                        <div className="flex items-center gap-6 shrink-0">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-black text-textSecondary uppercase tracking-widest opacity-40">Attd</span>
                                                                <span className={`text-sm font-black ${sub.attendance < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>{sub.attendance}%</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-black text-textSecondary uppercase tracking-widest opacity-40">Marks</span>
                                                                <span className="text-sm font-black text-primary">{sub.marks}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Right Col: Assessment Dist */}
                                            <div className="space-y-6">
                                                <h5 className="font-black text-textSecondary text-[10px] uppercase tracking-widest">Aggregate Benchmarks (Current Term)</h5>
                                                <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-inner shadow-slate-200/5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-textPrimary">Quiz Aggregate</span>
                                                        <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{s.assessments.quiz}%</span>
                                                    </div>
                                                    <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-emerald-500 h-full" style={{width: `${s.assessments.quiz}%`}}></div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2">
                                                        <span className="text-sm font-bold text-textPrimary">Continuous Assessment (CIA)</span>
                                                        <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{s.assessments.cia}%</span>
                                                    </div>
                                                    <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-primary h-full" style={{width: `${s.assessments.cia}%`}}></div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2">
                                                        <span className="text-sm font-bold text-textPrimary">Semester Examination</span>
                                                        <span className="text-sm font-black text-purple-500 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">{s.assessments.sem}%</span>
                                                    </div>
                                                    <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-purple-500 h-full" style={{width: `${s.assessments.sem}%`}}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentManagement;

