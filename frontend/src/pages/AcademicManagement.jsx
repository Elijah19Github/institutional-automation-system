import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AcademicManagement = () => {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('courses');

    // Data States
    const [courses, setCourses] = useState([]);
    const [publicCourses, setPublicCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [setupData, setSetupData] = useState({ courses: [], sections: [], faculty: [], academicYears: [], subjects: [] });

    // UI States
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [error, setError] = useState(null);

    // Form States
    const [courseForm, setCourseForm] = useState({ course_name: '', course_code: '', description: '', duration_years: '', total_semesters: '' });
    const [publicCourseForm, setPublicCourseForm] = useState({ category: 'Under Graduate', name: '', campus: 'Bangalore Central Campus', open_from: '', open_until: '', status: 'Open', document: null });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', course_id: '', semester_id: '', credits: 3 });
    const [subjectQueue, setSubjectQueue] = useState([]);
    const [assignForm, setAssignForm] = useState({ faculty_id: '', subject_id: '', section_id: '', semester_number: '', academic_year_id: '' });
    const [batchForm, setBatchForm] = useState({ name: '', entry_year: new Date().getFullYear() });
    const [sectionForm, setSectionForm] = useState({ name: '', batch_id: '', semester_id: '', capacity: 60 });
    const [ayForm, setAYForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
    const [semForm, setSemForm] = useState({ semester_number: '', name: '' });

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showPublicModal, setShowPublicModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showAYModal, setShowAYModal] = useState(false);
    const [showSemModal, setShowSemModal] = useState(false);
    const [selectedCourseForFilter, setSelectedCourseForFilter] = useState('all');

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [coursesRes, publicRes, subjectsRes, assignRes, setupRes] = await Promise.all([
                fetch('http://localhost:5000/api/academic-setup/courses', { headers }),
                fetch('http://localhost:5000/api/courses', { headers }),
                fetch('http://localhost:5000/api/academic-setup/subjects', { headers }),
                fetch('http://localhost:5000/api/academic-setup/faculty-assignments', { headers }),
                fetch('http://localhost:5000/api/academic-setup/setup-data', { headers })
            ]);

            const coursesData = await coursesRes.json();
            const publicData = await publicRes.json();
            const subjectsData = await subjectsRes.json();
            const assignData = await assignRes.json();
            const setupObj = await setupRes.json();

            if (coursesData.success) setCourses(coursesData.data);
            if (Array.isArray(publicData)) setPublicCourses(publicData);
            if (subjectsData.success) setSubjects(subjectsData.data);
            if (assignData.success) setAssignments(assignData.data);
            if (setupObj.success) setSetupData(setupObj.data);

        } catch (err) {
            setError('Failed to load academic data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchData();
        }
    }, [token, user]);

    // --- Course Actions ---
    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/academic-setup/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(courseForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Course created successfully');
                setShowCourseModal(false);
                setCourseForm({ course_name: '', course_code: '', description: '', duration_years: '', total_semesters: '' });
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error creating course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- Subject Actions ---
    const addToQueue = (e) => {
        e.preventDefault();
        if (!subjectForm.name || !subjectForm.code || !subjectForm.course_id || !subjectForm.semester_id) {
            showToast('Please fill all subject fields', 'error');
            return;
        }

        // Check if subject code or name already exists in the current queue
        if (subjectQueue.some(s => s.code === subjectForm.code || s.name.toLowerCase() === subjectForm.name.toLowerCase())) {
            showToast('Subject code or name already in queue', 'error');
            return;
        }

        // Check if subject code or name already exists in the database for this course
        if (subjects.some(s => s.course_id.toString() === subjectForm.course_id.toString() && (s.code === subjectForm.code || s.name.toLowerCase() === subjectForm.name.toLowerCase()))) {
            showToast('Subject already exists for this course in the system', 'error');
            return;
        }

        setSubjectQueue([...subjectQueue, { ...subjectForm }]);
        setSubjectForm({ ...subjectForm, name: '', code: '' }); // Reset only name/code to reuse course/sem
    };

    const removeFromQueue = (index) => {
        setSubjectQueue(subjectQueue.filter((_, i) => i !== index));
    };

    const handleBulkSubjectSubmit = async () => {
        if (subjectQueue.length === 0) return;
        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/academic-setup/subjects/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ subjects: subjectQueue })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Successfully created ${data.count} subjects`);
                setShowSubjectModal(false);
                setSubjectQueue([]);
                setSubjectForm({ name: '', code: '', course_id: '', semester_id: '', credits: 3 });
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error in bulk creation', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Existing generic actions... (toggleCourseStatus, deleteSubject, etc.)
    const toggleCourseStatus = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to deactivate this course?`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/academic-setup/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await res.json()).success) {
                showToast('Course deactivated');
                fetchData();
            }
        } catch (err) {
            showToast('Error deactivating course', 'error');
        }
    };

    const handleEditSubject = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/academic-setup/subjects/${subjectForm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(subjectForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Subject updated successfully');
                setShowEditSubjectModal(false);
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error updating subject', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteSubject = async (id) => {
        if (!window.confirm('Delete this subject permanently?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/academic-setup/subjects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await res.json()).success) {
                showToast('Subject deleted');
                fetchData();
            }
        } catch (err) {
            showToast('Error deleting subject', 'error');
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-rose-400">Unauthorized. Admin access only.</div>;
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Academic Management</h1>
                    <p className="text-textSecondary">Configure institutional hierarchy and mapping.</p>
                </div>
                <button 
                    onClick={async () => {
                        if (window.confirm("Initialize basic demo setup? (This will only add missing default entities)")) {
                            setActionLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/academic-setup/seed-demo', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const data = await res.json();
                                if (data.success) {
                                    showToast(data.message);
                                    fetchData();
                                }
                            } catch (e) { showToast("Seeding failed", "error"); }
                            finally { setActionLoading(false); }
                        }
                    }}
                    className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10"
                >
                    🚀 Quick Setup
                </button>
            </div>

            {toast.show && (
                <div className={`fixed top-12 right-1/2 translate-x-1/2 z-[500] p-4 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'} backdrop-blur-md`}>
                    <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✨'}</span>
                    <span className="font-bold tracking-tight">{toast.message}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
                {['courses', 'subjects', 'batches', 'sections', 'semesters', 'years', 'assessments', 'public-catalog'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 px-6 font-medium text-sm transition-all border-b-2 capitalize tracking-wide whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-textSecondary hover:text-textPrimary hover:bg-surface/50'}`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-lg"></div></div>
            ) : (
                <div className="bg-surface/50 backdrop-blur-md rounded-2xl border border-border p-8 shadow-2xl space-y-6">

                    {/* COURSES TAB */}
                    {activeTab === 'courses' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Institutional Courses</h2>
                                    <p className="text-xs text-textSecondary">List of all active degree programs.</p>
                                </div>
                                <button onClick={() => setShowCourseModal(true)} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                    + ADD NEW COURSE
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/20 text-textSecondary text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="p-4">Course Info</th>
                                            <th className="p-4 text-center">Duration</th>
                                            <th className="p-4 text-center">Semesters</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {courses.map(c => (
                                            <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-textPrimary">{c.course_name}</div>
                                                    <div className="text-[10px] font-mono text-primary/70">{c.course_code || 'NO_CODE'}</div>
                                                    {c.description && <div className="text-[10px] text-textSecondary mt-1 line-clamp-1 italic">"{c.description}"</div>}
                                                </td>
                                                <td className="p-4 text-center text-sm font-medium">{c.duration_years} Years</td>
                                                <td className="p-4 text-center text-sm font-medium">{c.total_semesters} Sem</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => toggleCourseStatus(c.id, c.is_active)} className="text-rose-500/80 hover:text-rose-500 text-xs font-bold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all">DEACTIVATE</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SUBJECTS TAB */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Subject Directory</h2>
                                    <p className="text-xs text-textSecondary">Inventory of all subjects mapped to courses.</p>
                                </div>
                                <div className="flex gap-4">
                                    <select 
                                        value={selectedCourseForFilter}
                                        onChange={(e) => setSelectedCourseForFilter(e.target.value)}
                                        className="bg-secondary/20 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold text-textPrimary outline-none"
                                    >
                                        <option value="all">All Programs</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                                    </select>
                                    <button onClick={() => {
                                        setSubjectForm({ name: '', code: '', course_id: '', semester_id: '', credits: 3 });
                                        setShowSubjectModal(true);
                                    }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                        + BATCH ADD SUBJECTS
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/20 text-textSecondary text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="p-4">Subject Info</th>
                                            <th className="p-4">Parent Course</th>
                                            <th className="p-4 text-center">Credits</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {subjects.filter(s => selectedCourseForFilter === 'all' || s.course_id.toString() === selectedCourseForFilter.toString()).map(s => (
                                            <tr key={s.id} className="hover:bg-secondary/10 transition-colors group">
                                                <td className="p-4">
                                                    <div className="text-primary text-[10px] font-mono font-bold tracking-widest uppercase mb-0.5">{s.code}</div>
                                                    <div className="text-sm font-bold text-textPrimary">{s.name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-textPrimary">{s.course_name}</div>
                                                    <div className="text-[10px] text-textSecondary font-bold bg-secondary/50 inline-block px-1.5 py-0.5 rounded">SEM {s.semester_number}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-emerald-500 font-black text-sm">{s.credits}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSubjectForm({ ...s });
                                                                setShowEditSubjectModal(true);
                                                            }}
                                                            className="text-primary hover:bg-primary/10 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button onClick={() => deleteSubject(s.id)} className="text-rose-500/80 hover:text-rose-500 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">REMOVE</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BATCHES TAB */}
                    {activeTab === 'batches' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Student Batches</h2>
                                    <p className="text-xs text-textSecondary">Manage enrollment cycles and year groups.</p>
                                </div>
                                <button onClick={() => {
                                    setBatchForm({ name: '', entry_year: new Date().getFullYear() });
                                    setShowBatchModal(true);
                                }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                    + ADD NEW BATCH
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/20 text-textSecondary text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="p-4">Batch Name</th>
                                            <th className="p-4 text-center">Entry Year</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {(setupData.batches || []).map(b => (
                                            <tr key={b.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="p-4 text-sm font-bold text-textPrimary">{b.name}</td>
                                                <td className="p-4 text-center text-sm font-medium">{b.entry_year}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={async () => {
                                                            if (!window.confirm("Delete batch?")) return;
                                                            await fetch(`http://localhost:5000/api/academic-setup/batches/${b.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                            fetchData();
                                                        }}
                                                        className="text-rose-500/80 hover:text-rose-500 text-xs font-bold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        REMOVE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTIONS TAB */}
                    {activeTab === 'sections' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Class Sections</h2>
                                    <p className="text-xs text-textSecondary">Operational divisions per Batch and Semester.</p>
                                </div>
                                <button onClick={() => {
                                    setSectionForm({ name: '', batch_id: '', semester_id: '', capacity: 60 });
                                    setShowSectionModal(true);
                                }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                    + ADD NEW SECTION
                                </button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/20 text-textSecondary text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="p-4">Section</th>
                                            <th className="p-4">Parent Context</th>
                                            <th className="p-4 text-center">Capacity</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {(setupData.sections || []).map(sec => (
                                            <tr key={sec.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-textPrimary uppercase tracking-widest">{sec.name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-bold text-textPrimary">{sec.batch_name}</div>
                                                    <div className="text-[10px] text-primary font-mono uppercase">Semester {sec.semester_number}</div>
                                                </td>
                                                <td className="p-4 text-center text-sm font-black text-emerald-500">{sec.capacity || 60}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={async () => {
                                                            if (!window.confirm("Delete section?")) return;
                                                            await fetch(`http://localhost:5000/api/academic-setup/sections/${sec.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                            fetchData();
                                                        }}
                                                        className="text-rose-500/80 hover:text-rose-500 text-xs font-bold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
                                                    >
                                                        REMOVE
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SEMESTERS TAB */}
                    {activeTab === 'semesters' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                             <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Available Semesters</h2>
                                    <p className="text-xs text-textSecondary">Global definition of academic terms.</p>
                                </div>
                                <button onClick={() => {
                                    setSemForm({ semester_number: '', name: '' });
                                    setShowSemModal(true);
                                }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                    + ADD SEMESTER
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(setupData.semesters || []).map(sem => (
                                    <div key={sem.id} className="bg-secondary/10 border border-border p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 group relative">
                                        <button 
                                            onClick={async () => {
                                                if (!window.confirm("Delete semester?")) return;
                                                await fetch(`http://localhost:5000/api/academic-setup/semesters/${sem.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                fetchData();
                                            }}
                                            className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >✕</button>
                                        <div className="text-3xl font-black text-primary">{sem.semester_number}</div>
                                        <div className="text-xs font-bold text-textPrimary uppercase tracking-widest">{sem.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC YEARS TAB */}
                    {activeTab === 'years' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                             <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Academic Years</h2>
                                    <p className="text-xs text-textSecondary">Management of institutional calendar cycles.</p>
                                </div>
                                <button onClick={() => {
                                    setAYForm({ name: '', start_date: '', end_date: '', is_current: false });
                                    setShowAYModal(true);
                                }} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95">
                                    + ADD ACADEMIC YEAR
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(setupData.academicYears || []).map(ay => (
                                    <div key={ay.id} className={`p-6 rounded-[2rem] border ${ay.is_current ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' : 'bg-surface border-border'} flex justify-between items-center`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-textPrimary">{ay.name}</h3>
                                                {ay.is_current && <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Current</span>}
                                            </div>
                                            <p className="text-[10px] text-textSecondary font-bold uppercase tracking-tighter">📅 {new Date(ay.start_date).toLocaleDateString()} — {new Date(ay.end_date).toLocaleDateString()}</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (!window.confirm("Delete academic year?")) return;
                                                await fetch(`http://localhost:5000/api/academic-setup/academic-years/${ay.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                                                fetchData();
                                            }}
                                            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
                                        >🗑️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ASSESSMENTS TAB */}
                    {activeTab === 'assessments' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                             <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Academic Assessments</h2>
                                    <p className="text-xs text-textSecondary">Monitor assessment patterns and faculty mapping.</p>
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/20 text-textSecondary text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="p-4">Faculty Member</th>
                                            <th className="p-4">Assessment Focus</th>
                                            <th className="p-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {assignments.map(a => (
                                            <tr key={a.id} className="hover:bg-secondary/10 transition-colors">
                                                <td className="p-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{a.faculty_name?.charAt(0)}</div>
                                                    <div className="text-sm font-bold text-textPrimary">{a.faculty_name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-textPrimary">{a.subject_name}</div>
                                                    <div className="text-[10px] text-textSecondary font-bold bg-secondary/50 inline-block px-1.5 py-0.5 rounded uppercase">{a.section_name} • {a.academic_year_name}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase rounded-full border border-blue-500/20">Active Tenure</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PUBLIC CATALOG TAB */}
                    {activeTab === 'public-catalog' && (
                        <div className="space-y-6 animate-in fade-in transition-all">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-textPrimary">Public Course Catalog</h2>
                                    <p className="text-xs text-textSecondary">Manage the courses displayed on the public website and admission portal.</p>
                                </div>
                                <button onClick={() => setShowPublicModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                                    + ADD TO PUBLIC PORTAL
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {publicCourses.map(pc => (
                                    <div key={pc.id} className="bg-surface border border-border p-6 rounded-[2rem] hover:shadow-2xl transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${pc.status === 'Open' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                {pc.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-tighter opacity-60">{pc.category}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-textPrimary leading-tight mb-2 group-hover:text-primary transition-colors">{pc.name}</h3>
                                        <div className="space-y-2 mb-6">
                                            <p className="text-xs text-textSecondary flex items-center gap-2 font-medium">
                                                <span className="opacity-40">📍</span> {pc.campus}
                                            </p>
                                            <p className="text-[10px] text-textSecondary flex items-center gap-2 font-bold uppercase tracking-widest">
                                                <span className="opacity-40">📅</span> {new Date(pc.open_from).toLocaleDateString()} - {new Date(pc.open_until).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex-1 bg-secondary/50 hover:bg-secondary text-textPrimary text-[10px] font-bold py-2 rounded-xl transition-all">EDIT</button>
                                            {pc.document_url && <a href={`http://localhost:5000${pc.document_url}`} target="_blank" rel="noreferrer" className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary hover:text-white transition-all">📄</a>}
                                        </div>
                                    </div>
                                ))}
                                {publicCourses.length === 0 && (
                                    <div className="col-span-full py-20 text-center opacity-40 italic">No courses published yet.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODALS */}

            {/* COURSE MODAL */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Create New Course</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-textSecondary hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-500/10">
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>
                        <form onSubmit={handleCourseSubmit} className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Code</label>
                                    <input type="text" required value={courseForm.course_code} onChange={e => setCourseForm({ ...courseForm, course_code: e.target.value.toUpperCase() })} placeholder="MBA" className="w-full bg-background border border-border py-3 px-4 rounded-xl text-primary font-mono font-bold focus:outline-none focus:border-primary transition-all" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Program Name</label>
                                    <input type="text" required value={courseForm.course_name} onChange={e => setCourseForm({ ...courseForm, course_name: e.target.value })} placeholder="Master of Business..." className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold focus:outline-none focus:border-primary transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Duration (Yrs)</label>
                                    <input type="number" required min="1" max="6" value={courseForm.duration_years} onChange={e => setCourseForm({ ...courseForm, duration_years: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold focus:outline-none focus:border-primary transition-all" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Total Sems</label>
                                    <input type="number" required min="1" max="12" value={courseForm.total_semesters} onChange={e => setCourseForm({ ...courseForm, total_semesters: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold focus:outline-none focus:border-primary transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                                {actionLoading ? 'PROCESSING...' : 'SAVE PROGRAM'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PUBLIC COURSE MODAL */}
            {showPublicModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-primary"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Publish to Catalog</h3>
                            <button onClick={() => setShowPublicModal(false)} className="text-textSecondary hover:text-rose-500 p-2 rounded-full hover:bg-rose-500/10 transition-colors">
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setActionLoading(true);
                            try {
                                const formData = new FormData();
                                Object.keys(publicCourseForm).forEach(key => {
                                    if (key === 'document') {
                                        if (publicCourseForm[key]) formData.append('document', publicCourseForm[key]);
                                    } else {
                                        formData.append(key, publicCourseForm[key]);
                                    }
                                });

                                const res = await fetch('http://localhost:5000/api/courses', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    body: formData
                                });
                                const data = await res.json();
                                if (data.success || data.id) {
                                    showToast('Course published to public catalog');
                                    setShowPublicModal(false);
                                    fetchData();
                                } else showToast(data.message || 'Error publishing course', 'error');
                            } catch (err) {
                                showToast('System error publishing course', 'error');
                            } finally {
                                setActionLoading(false);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1.5">Category</label>
                                <select value={publicCourseForm.category} onChange={e => setPublicCourseForm({...publicCourseForm, category: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary">
                                    <option>Under Graduate</option>
                                    <option>Post Graduate</option>
                                    <option>Diploma</option>
                                    <option>Certificate</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1.5">Course Name (Public)</label>
                                <input type="text" required value={publicCourseForm.name} onChange={e => setPublicCourseForm({...publicCourseForm, name: e.target.value})} placeholder="B.Tech Computer Science..." className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1.5">Open From</label>
                                    <input type="date" required value={publicCourseForm.open_from} onChange={e => setPublicCourseForm({...publicCourseForm, open_from: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1.5">Open Until</label>
                                    <input type="date" required value={publicCourseForm.open_until} onChange={e => setPublicCourseForm({...publicCourseForm, open_until: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1.5">Course PDF/Brochure (Optional)</label>
                                <input type="file" accept=".pdf" onChange={e => setPublicCourseForm({...publicCourseForm, document: e.target.files[0]})} className="w-full text-xs text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl tracking-widest shadow-xl shadow-emerald-500/20 mt-4">
                                {actionLoading ? 'PUBLISHING...' : 'PUBLISH NOW'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* SUBJECT MODAL (WITH QUEUE) */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                    <div className="bg-surface rounded-3xl border border-border w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-primary to-emerald-400"></div>
                        
                        <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/10">
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Subject Factory</h3>
                                <p className="text-[10px] text-textSecondary tracking-widest uppercase font-bold">Queue multiple subjects for bulk creation</p>
                            </div>
                            <button onClick={() => setShowSubjectModal(false)} className="text-textSecondary hover:text-rose-500 transition-all p-3 rounded-full hover:bg-rose-500/10 active:rotate-90">
                                <span className="text-2xl leading-none">✕</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Input Form */}
                            <form onSubmit={addToQueue} className="lg:col-span-2 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Parent Course</label>
                                    <select required value={subjectForm.course_id} onChange={e => setSubjectForm({ ...subjectForm, course_id: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary text-sm font-bold outline-none focus:border-primary">
                                        <option value="">Select Course...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Subject Name</label>
                                        <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Database Systems" className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary text-sm font-bold outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Subject Code</label>
                                        <input type="text" required value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="MCA101" className="w-full font-mono bg-background border border-border py-3 px-4 rounded-xl text-primary font-bold outline-none focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Credits</label>
                                        <input type="number" min="1" max="10" required value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold outline-none focus:border-primary" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Target Semester</label>
                                    <select required value={subjectForm.semester_id} onChange={e => setSubjectForm({ ...subjectForm, semester_id: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary text-sm font-bold outline-none focus:border-primary">
                                        <option value="">Select Semester...</option>
                                        {(setupData.semesters || []).map(sem => (
                                            <option key={sem.id} value={sem.id}>Semester {sem.semester_number}</option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                                    ADD TO QUEUE ↓
                                </button>
                            </form>

                            {/* Queue List */}
                            <div className="lg:col-span-3 bg-secondary/5 border border-border rounded-2xl flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/10">
                                    <span className="text-[10px] font-black text-textSecondary uppercase tracking-widest">Pending Upload ({subjectQueue.length})</span>
                                    {subjectQueue.length > 0 && <button onClick={() => setSubjectQueue([])} className="text-rose-500 text-[10px] font-black uppercase hover:underline">Clear All</button>}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {subjectQueue.map((s, idx) => (
                                        <div key={idx} className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between group animate-in slide-in-from-right-4 duration-200">
                                            <div>
                                                <div className="text-[10px] font-mono font-bold text-primary tracking-widest">{s.code}</div>
                                                <div className="text-sm font-bold text-textPrimary">{s.name}</div>
                                                <div className="text-[8px] text-textSecondary uppercase tracking-tighter">Semester {s.semester_id} • {s.credits} Credits</div>
                                            </div>
                                            <button onClick={() => removeFromQueue(idx)} className="text-textSecondary hover:text-rose-500 transition-colors p-2">✕</button>
                                        </div>
                                    ))}
                                    {subjectQueue.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-textSecondary space-y-2 opacity-50 py-12">
                                            <span className="text-4xl">🧺</span>
                                            <span className="text-xs italic">Queue is empty.</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 border-t border-border bg-surface">
                                    <button 
                                        onClick={handleBulkSubjectSubmit}
                                        disabled={subjectQueue.length === 0 || actionLoading} 
                                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black tracking-widest shadow-2xl shadow-primary/30 active:scale-95 disabled:opacity-30 transition-all font-bold"
                                    >
                                        {actionLoading ? 'DEPLOYING...' : `CREATE ${subjectQueue.length} SUBJECTS NOW`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* EDIT SUBJECT MODAL */}
            {showEditSubjectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent"></div>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Edit Subject</h3>
                            <button onClick={() => setShowEditSubjectModal(false)} className="text-textSecondary hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-rose-500/10">
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubject} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Subject Name</label>
                                <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold outline-none focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Subject Code</label>
                                    <input type="text" required value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="w-full font-mono bg-background border border-border py-3 px-4 rounded-xl text-primary font-bold outline-none focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Credits</label>
                                    <input type="number" min="1" max="10" required value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary font-bold outline-none focus:border-primary" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Target Semester</label>
                                <select required value={subjectForm.semester_id} onChange={e => setSubjectForm({ ...subjectForm, semester_id: e.target.value })} className="w-full bg-background border border-border py-3 px-4 rounded-xl text-textPrimary text-sm font-bold outline-none focus:border-primary">
                                    {(setupData.semesters || []).map(sem => (
                                        <option key={sem.id} value={sem.id}>Semester {sem.semester_number}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                                {actionLoading ? 'UPDATING...' : 'UPDATE SUBJECT'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* BATCH MODAL */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">New Batch</h3>
                            <button onClick={() => setShowBatchModal(false)} className="text-textSecondary hover:text-rose-500 transition-colors py-2 px-1 rounded-full hover:bg-rose-500/10 text-2xl">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setActionLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/academic-setup/batches', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(batchForm)
                                });
                                if ((await res.json()).success) {
                                    showToast('Batch created');
                                    setShowBatchModal(false);
                                    fetchData();
                                }
                            } catch (e) { showToast('Error', 'error'); }
                            finally { setActionLoading(false); }
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Batch Name</label>
                                <input type="text" required value={batchForm.name} onChange={e => setBatchForm({...batchForm, name: e.target.value})} placeholder="Batch 2024" className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-2">Entry Year</label>
                                <input type="number" required value={batchForm.entry_year} onChange={e => setBatchForm({...batchForm, entry_year: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl tracking-widest shadow-xl mt-4">SAVE BATCH</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SECTION MODAL */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">New Section</h3>
                            <button onClick={() => setShowSectionModal(false)} className="text-textSecondary hover:text-rose-500 transition-colors py-2 px-1 rounded-full hover:bg-rose-500/10 text-2xl">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setActionLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/academic-setup/sections', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(sectionForm)
                                });
                                if ((await res.json()).success) {
                                    showToast('Section created');
                                    setShowSectionModal(false);
                                    fetchData();
                                }
                            } catch (e) { showToast('Error', 'error'); }
                            finally { setActionLoading(false); }
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Section Name</label>
                                <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value.toUpperCase()})} placeholder="MCA-A" className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Batch</label>
                                    <select required value={sectionForm.batch_id} onChange={e => setSectionForm({...sectionForm, batch_id: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary">
                                        <option value="">Select...</option>
                                        {(setupData.batches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Semester</label>
                                    <select required value={sectionForm.semester_id} onChange={e => setSectionForm({...sectionForm, semester_id: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary">
                                        <option value="">Select...</option>
                                        {(setupData.semesters || []).map(s => <option key={s.id} value={s.id}>Sem {s.semester_number}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Capacity</label>
                                <input type="number" value={sectionForm.capacity} onChange={e => setSectionForm({...sectionForm, capacity: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl tracking-widest shadow-xl mt-4">CREATE SECTION</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ACADEMIC YEAR MODAL */}
            {showAYModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Academic Year</h3>
                            <button onClick={() => setShowAYModal(false)} className="text-textSecondary hover:text-rose-500 py-2 px-1 text-2xl">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setActionLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/academic-setup/academic-years', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(ayForm)
                                });
                                if ((await res.json()).success) {
                                    showToast('Academic year created');
                                    setShowAYModal(false);
                                    fetchData();
                                }
                            } catch (e) { showToast('Error', 'error'); }
                            finally { setActionLoading(false); }
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Year label</label>
                                <input type="text" required value={ayForm.name} onChange={e => setAYForm({...ayForm, name: e.target.value})} placeholder="2024-2025" className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Starts</label>
                                    <input type="date" required value={ayForm.start_date} onChange={e => setAYForm({...ayForm, start_date: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Ends</label>
                                    <input type="date" required value={ayForm.end_date} onChange={e => setAYForm({...ayForm, end_date: e.target.value})} className="w-full bg-background border border-border p-3 rounded-xl text-xs font-bold text-textPrimary outline-none focus:border-primary" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="currAY" checked={ayForm.is_current} onChange={e => setAYForm({...ayForm, is_current: e.target.checked})} className="w-5 h-5 accent-primary" />
                                <label htmlFor="currAY" className="text-xs font-bold text-textPrimary uppercase tracking-widest">Set as Current Period</label>
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl tracking-widest shadow-xl mt-4">SAVE ACADEMIC YEAR</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SEMESTER MODAL */}
            {showSemModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl border border-border p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">New Semester</h3>
                            <button onClick={() => setShowSemModal(false)} className="text-textSecondary hover:text-rose-500 py-2 px-1 text-2xl">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setActionLoading(true);
                            try {
                                const res = await fetch('http://localhost:5000/api/academic-setup/semesters', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(semForm)
                                });
                                if ((await res.json()).success) {
                                    showToast('Semester created');
                                    setShowSemModal(false);
                                    fetchData();
                                }
                            } catch (e) { showToast('Error', 'error'); }
                            finally { setActionLoading(false); }
                        }} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Sem Number</label>
                                <input type="number" required value={semForm.semester_number} onChange={e => setSemForm({...semForm, semester_number: e.target.value})} placeholder="e.g. 1" className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-textSecondary uppercase tracking-widest block mb-1">Standard Name</label>
                                <input type="text" required value={semForm.name} onChange={e => setSemForm({...semForm, name: e.target.value})} placeholder="Semester 1" className="w-full bg-background border border-border p-3 rounded-xl text-sm font-bold text-textPrimary outline-none focus:border-primary" />
                            </div>
                            <button type="submit" disabled={actionLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl tracking-widest shadow-xl mt-4">ADD SEMESTER</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicManagement;
