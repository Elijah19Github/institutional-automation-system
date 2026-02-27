import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AcademicManagement = () => {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('courses');

    // Data States
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [setupData, setSetupData] = useState({ courses: [], sections: [], faculty: [], academicYears: [], subjects: [] });

    // UI States
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [error, setError] = useState(null);

    // Form States
    const [courseForm, setCourseForm] = useState({ course_name: '', duration_years: '', total_semesters: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', course_id: '', semester_number: '', credits: 3 });
    const [assignForm, setAssignForm] = useState({ faculty_id: '', subject_id: '', section_id: '', semester_number: '', academic_year_id: '' });

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [coursesRes, subjectsRes, assignRes, setupRes] = await Promise.all([
                fetch('http://localhost:5000/api/academic-setup/courses', { headers }),
                fetch('http://localhost:5000/api/academic-setup/subjects', { headers }),
                fetch('http://localhost:5000/api/academic-setup/faculty-assignments', { headers }),
                fetch('http://localhost:5000/api/academic-setup/setup-data', { headers })
            ]);

            const coursesData = await coursesRes.json();
            const subjectsData = await subjectsRes.json();
            const assignData = await assignRes.json();
            const setupObj = await setupRes.json();

            if (coursesData.success) setCourses(coursesData.data);
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
                setCourseForm({ course_name: '', duration_years: '', total_semesters: '' });
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error creating course', 'error');
        } finally {
            setActionLoading(false);
        }
    };

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

    // --- Subject Actions ---
    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/academic-setup/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(subjectForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Subject created successfully');
                setShowSubjectModal(false);
                setSubjectForm({ name: '', code: '', course_id: '', semester_number: '', credits: 3 });
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error creating subject', 'error');
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

    // --- Faculty Assignment Actions ---
    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/academic-setup/assign-faculty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(assignForm)
            });
            const data = await res.json();
            if (data.success) {
                showToast('Faculty assigned successfully');
                setAssignForm({ faculty_id: '', subject_id: '', section_id: '', semester_number: '', academic_year_id: '' });
                fetchData();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Error mapping faculty', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const removeAssignment = async (id) => {
        if (!window.confirm('Remove this faculty assignment?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/academic-setup/faculty-assignments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if ((await res.json()).success) {
                showToast('Assignment removed');
                fetchData();
            }
        } catch (err) {
            showToast('Error removing assignment', 'error');
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-rose-400">Unauthorized. Admin access only.</div>;
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Academic Management</h1>
                    <p className="text-slate-400">Configure courses, subjects, and faculty assignments.</p>
                </div>
            </div>

            {toast.show && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
                {['courses', 'subjects', 'assignments'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 capitalize ${activeTab === tab ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl space-y-6">

                    {/* SECTION 1: COURSES */}
                    {activeTab === 'courses' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-slate-200">Active Courses</h2>
                                <button onClick={() => setShowCourseModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
                                    + Add Course
                                </button>
                            </div>
                            <table className="w-full text-left bg-[#1e293b] rounded-xl overflow-hidden">
                                <thead className="bg-slate-800/80 text-slate-300 text-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Course Name</th>
                                        <th className="p-4 font-semibold">Duration</th>
                                        <th className="p-4 font-semibold">Total Semesters</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map(c => (
                                        <tr key={c.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-4 text-slate-200 font-medium">{c.course_name}</td>
                                            <td className="p-4 text-slate-400">{c.duration_years} Years</td>
                                            <td className="p-4 text-slate-400">{c.total_semesters} Semesters</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => toggleCourseStatus(c.id, c.is_active)} className="text-rose-400 hover:text-rose-300 text-sm bg-rose-500/10 px-3 py-1.5 rounded-md">Deactivate</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {courses.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No courses defined.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* SECTION 2: SUBJECTS */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-slate-200">Subjects Directory</h2>
                                <button onClick={() => setShowSubjectModal(true)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
                                    + Add Subject
                                </button>
                            </div>
                            <table className="w-full text-left bg-[#1e293b] rounded-xl overflow-hidden">
                                <thead className="bg-slate-800/80 text-slate-300 text-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Subject Code & Name</th>
                                        <th className="p-4 font-semibold">Course & Semester</th>
                                        <th className="p-4 font-semibold text-center">Credits</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map(s => (
                                        <tr key={s.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                                            <td className="p-4">
                                                <div className="text-indigo-400 text-xs font-mono font-bold">{s.code}</div>
                                                <div className="text-slate-200">{s.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300">{s.course_name}</div>
                                                <div className="text-xs text-slate-500">Semester {s.semester_number}</div>
                                            </td>
                                            <td className="p-4 text-center text-emerald-400 font-bold">{s.credits}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => deleteSubject(s.id)} className="text-rose-400 hover:text-rose-300 text-sm">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {subjects.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No subjects defined.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* SECTION 3: FACULTY ASSIGNMENTS */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-8 animate-in fade-in">
                            <form onSubmit={handleAssignmentSubmit} className="bg-slate-900/50 p-6 rounded-xl border border-indigo-500/20 shadow-inner">
                                <h3 className="text-lg font-medium text-indigo-300 mb-4 flex items-center gap-2"><span>👨‍🏫</span> New Faculty Mapping</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Academic Year</label>
                                        <select required value={assignForm.academic_year_id} onChange={e => setAssignForm({ ...assignForm, academic_year_id: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                                            <option value="">Select Year...</option>
                                            {setupData.academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Faculty Member</label>
                                        <select required value={assignForm.faculty_id} onChange={e => setAssignForm({ ...assignForm, faculty_id: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                                            <option value="">Select Faculty...</option>
                                            {setupData.faculty.map(f => <option key={f.id} value={f.id}>{f.name} ({f.employee_id})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Subject</label>
                                        <select required value={assignForm.subject_id} onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value, semester_number: setupData.subjects.find(s => s.id === e.target.value)?.semester_number || '' })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                                            <option value="">Select Subject...</option>
                                            {setupData.subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Target Section</label>
                                        <select required value={assignForm.section_id} onChange={e => setAssignForm({ ...assignForm, section_id: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                                            <option value="">Select Section...</option>
                                            {setupData.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 flex items-end">
                                        <button type="submit" disabled={actionLoading} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                                            {actionLoading ? 'Assigning...' : 'Assign Faculty to Subject & Section'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div>
                                <h3 className="text-lg font-medium text-slate-200 mb-4">Existing Assignments</h3>
                                <table className="w-full text-left bg-[#1e293b] rounded-xl overflow-hidden">
                                    <thead className="bg-slate-800/80 text-slate-300 text-sm">
                                        <tr>
                                            <th className="p-4 font-semibold">Faculty / Year</th>
                                            <th className="p-4 font-semibold">Subject</th>
                                            <th className="p-4 font-semibold">Section & Sem</th>
                                            <th className="p-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignments.map(a => (
                                            <tr key={a.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-200">{a.faculty_name}</div>
                                                    <div className="text-xs text-indigo-400">{a.academic_year}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-mono text-slate-300">{a.subject_code}</div>
                                                    <div className="text-sm text-slate-400">{a.subject_name}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-bold text-emerald-400">{a.section_name}</div>
                                                    <div className="text-xs text-slate-500">Semester {a.semester_number}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => removeAssignment(a.id)} className="text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg text-sm transition-colors">Revoke</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {assignments.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No active faculty assignments.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* COURSE MODAL */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Create New Course</h3>
                        <form onSubmit={handleCourseSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Course Name</label>
                                <input type="text" required value={courseForm.course_name} onChange={e => setCourseForm({ ...courseForm, course_name: e.target.value })} placeholder="e.g. Master of Computer Applications (MCA)" className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Duration (Years)</label>
                                    <input type="number" required min="1" max="6" value={courseForm.duration_years} onChange={e => setCourseForm({ ...courseForm, duration_years: e.target.value })} className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Total Semesters</label>
                                    <input type="number" required min="1" max="12" value={courseForm.total_semesters} onChange={e => setCourseForm({ ...courseForm, total_semesters: e.target.value })} className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">{actionLoading ? 'Saving...' : 'Save Course'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SUBJECT MODAL */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Create New Subject</h3>
                        <form onSubmit={handleSubjectSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Parent Course</label>
                                <select required value={subjectForm.course_id} onChange={e => setSubjectForm({ ...subjectForm, course_id: e.target.value })} className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500">
                                    <option value="">Select Course...</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.course_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-sm text-slate-400 block mb-1">Subject Name</label>
                                    <input type="text" required value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="e.g. Data Structures" className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Subject Code</label>
                                    <input type="text" required value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="e.g. CS101" className="w-full font-mono bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Target Semester</label>
                                    <select required value={subjectForm.semester_number} onChange={e => setSubjectForm({ ...subjectForm, semester_number: e.target.value })} className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500">
                                        <option value="">Select...</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-1">Credits</label>
                                    <input type="number" min="1" max="10" required value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: e.target.value })} className="w-full bg-slate-900 border border-slate-700 py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-700">
                                <button type="button" onClick={() => setShowSubjectModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">{actionLoading ? 'Saving...' : 'Save Subject'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicManagement;
