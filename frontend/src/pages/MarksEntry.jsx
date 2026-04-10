import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validate } from '../utils/validation';

const MarksEntry = () => {
    const { token } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [examType, setExamType] = useState('Internal 1');
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({}); // {student_id: score}
    const [isLocked, setIsLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    const examTypes = [
        { name: 'Internal 1', max: 25 },
        { name: 'Internal 2', max: 25 },
        { name: 'Semester', max: 50 },
    ];

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/marks/faculty-assignments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAssignments(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching assignments:', err);
        }
    };

    const fetchStudents = async () => {
        if (!selectedAssignment) return;
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/marks/students-for-entry', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    subject_id: selectedAssignment.subject_id,
                    section_id: selectedAssignment.section_id,
                    exam_type: examType
                }
            });
            if (res.data.success) {
                setStudents(res.data.data);
                setIsLocked(res.data.is_locked);
                
                // Initialize marksData with existing points
                const initial = {};
                res.data.data.forEach(s => {
                    initial[s.id] = s.current_mark !== null ? s.current_mark : '';
                });
                setMarksData(initial);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedAssignment, examType]);

    const handleMarkChange = (studentId, value) => {
        if (value === '') {
            setMarksData(prev => ({ ...prev, [studentId]: '' }));
            return;
        }
        
        const error = validate('marks', value, examType);
        if (error) {
            // Optional: Show tool-tip or transient error
            return; 
        }
        setMarksData(prev => ({ ...prev, [studentId]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setStatusMsg({ type: '', text: '' });
        try {
            const payload = Object.entries(marksData)
                .filter(([_, score]) => score !== '')
                .map(([student_id, score]) => ({
                    student_id,
                    score: parseFloat(score)
                }));

            const res = await axios.post('http://localhost:5000/api/marks/bulk-entry', {
                subject_id: selectedAssignment.subject_id,
                exam_type: examType,
                marks_data: payload
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setStatusMsg({ type: 'success', text: 'Marks updated successfully!' });
                fetchStudents(); // Refresh
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Error saving marks' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface p-6 rounded-2xl border border-border shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-textPrimary tracking-tight">Academic Marks Entry</h1>
                    <p className="text-textSecondary text-sm">Select a subject and assessment type to enter student marks.</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <select 
                        className="bg-background border border-border px-4 py-2.5 rounded-xl text-sm font-bold text-textPrimary outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                        value={selectedAssignment?.mapping_id || ''}
                        onChange={(e) => setSelectedAssignment(assignments.find(a => a.mapping_id === e.target.value))}
                    >
                        <option value="">Select Subject/Section</option>
                        {assignments.map(a => (
                            <option key={a.mapping_id} value={a.mapping_id}>
                                {a.subject_name} ({a.section_name}) - {a.course_name}
                            </option>
                        ))}
                    </select>

                    <div className="flex bg-background border border-border p-1 rounded-xl shadow-inner">
                        {examTypes.map(type => (
                            <button
                                key={type.name}
                                onClick={() => setExamType(type.name)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${examType === type.name ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'}`}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>

                    {selectedAssignment && (
                        <Link 
                            to={`/overall-marks/${selectedAssignment.subject_id}`}
                            className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                        >
                            View Overall Marks
                        </Link>
                    )}
                </div>
            </div>

            {statusMsg.text && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                    <span>{statusMsg.type === 'success' ? '✅' : '❌'}</span>
                    {statusMsg.text}
                </div>
            )}

            {isLocked && (
                <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <div>
                        <div className="font-black text-xs uppercase tracking-widest">Entry Locked</div>
                        <p className="text-sm font-medium">This assessment has been locked by the administrator. You cannot edit marks at this time.</p>
                    </div>
                </div>
            )}

            <div className="table-container shadow-xl">
                <table className="table-modern">
                    <thead>
                        <tr>
                            <th className="px-6 py-4">Student Info</th>
                            <th className="px-6 py-4">USN / ID</th>
                            <th className="px-6 py-4 text-center">Current Score</th>
                            <th className="px-6 py-4 text-center">New Mark (Max: {examTypes.find(t => t.name === examType).max})</th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-textSecondary animate-pulse">Loading class roster...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-textSecondary">
                                        {selectedAssignment ? 'No students found for this assignment.' : 'Please select a subject to begin.'}
                                    </td>
                                </tr>
                            ) : (
                                students.map(s => (
                                    <tr key={s.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-textPrimary group-hover:text-primary transition-colors">{s.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-textSecondary">{s.regno}</td>
                                        <td className="px-6 py-4 text-center font-bold text-sm text-textSecondary">
                                            {s.current_mark === null ? '-' : s.current_mark}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <input 
                                                    type="number"
                                                    disabled={isLocked}
                                                    className={`w-24 text-center py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold ${isLocked ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary/50'}`}
                                                    value={marksData[s.id] || ''}
                                                    onChange={(e) => handleMarkChange(s.id, e.target.value)}
                                                    placeholder="0.0"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            {selectedAssignment && students.length > 0 && (
                <div className="p-6 bg-white border border-border rounded-2xl flex justify-between items-center shadow-lg">
                    <div className="text-xs text-textSecondary font-medium">
                        {Object.values(marksData).filter(v => v !== '').length} of {students.length} marks entered.
                    </div>
                    <button
                        disabled={isLocked || saving || Object.values(marksData).filter(v => v !== '').length === 0}
                        onClick={handleSave}
                        className={`px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-all transform active:scale-95 ${isLocked || saving || Object.values(marksData).filter(v => v !== '').length === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 shadow-primary/25'}`}
                    >
                        {saving ? 'Saving...' : 'Submit Final Marks'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarksEntry;
