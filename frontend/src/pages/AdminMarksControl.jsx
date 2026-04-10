import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminMarksControl = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of row being processed
    const [examType, setExamType] = useState('Internal 1');

    const examTypes = ['Internal 1', 'Internal 2', 'Semester'];

    useEffect(() => {
        fetchStats();
    }, [examType]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Updated fetch to get status for all subjects
            const res = await axios.get('http://localhost:5000/api/admin/marks-status', {
                headers: { Authorization: `Bearer ${token}` },
                params: { examType }
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching marks status:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLock = async (subjectId, currentLocked) => {
        setActionLoading(subjectId);
        try {
            const res = await axios.post('http://localhost:5000/api/admin/lock-marks', {
                examType,
                subjectId,
                isLocked: !currentLocked
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                fetchStats();
            }
        } catch (err) {
            console.error('Error locking marks:', err);
            alert('Failed to update lock status');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface p-6 rounded-2xl border border-border shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-textPrimary tracking-tight">Marks Governance</h1>
                    <p className="text-textSecondary text-sm">Monitor submission status and control entry deadlines.</p>
                </div>
                
                <div className="flex bg-background border border-border p-1 rounded-xl shadow-inner">
                    {examTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setExamType(type)}
                            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${examType === type ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/5 text-textSecondary text-[10px] font-black uppercase tracking-widest border-b border-border">
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4 text-center">Submission Status</th>
                                <th className="px-6 py-4 text-center">Deadline Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-textSecondary animate-pulse">Scanning academic records...</td>
                                </tr>
                            ) : stats.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-textSecondary">No subjects found in the academic catalog.</td>
                                </tr>
                            ) : (
                                stats.map(s => (
                                    <tr key={s.id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-textPrimary">{s.name}</div>
                                            <div className="text-[10px] font-mono text-textSecondary">{s.code}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-textSecondary">
                                            {s.course_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-48 h-1.5 bg-background rounded-full overflow-hidden border border-border">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${s.submission_rate === 100 ? 'bg-emerald-500' : s.submission_rate > 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${s.submission_rate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-black text-textSecondary">{s.submission_rate}% Complete</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => toggleLock(s.id, s.is_locked)}
                                                    disabled={actionLoading === s.id}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${s.is_locked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                                                >
                                                    {actionLoading === s.id ? '...' : (s.is_locked ? '🔒 Locked' : '🔓 Active')}
                                                </button>
                                                <Link 
                                                    to={`/overall-marks/${s.id}`}
                                                    className="px-4 py-1.5 rounded-lg text-xs font-black transition-all bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white flex items-center gap-2"
                                                >
                                                    📊 Overall
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminMarksControl;
