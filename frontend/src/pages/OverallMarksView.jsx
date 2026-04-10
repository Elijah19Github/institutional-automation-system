import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OverallMarksView = () => {
    const { subject_id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [marksData, setMarksData] = useState([]);
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOverallMarks = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/marks/overall/${subject_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setMarksData(res.data.data);
                    setSubject(res.data.subject);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load overall marks data.');
            } finally {
                setLoading(false);
            }
        };

        fetchOverallMarks();
    }, [subject_id, token]);

    const goBack = () => {
        if (user.role === 'admin' || user.role === 'supadmin') {
            navigate('/admin/marks-governance');
        } else {
            navigate('/marks-entry');
        }
    };

    if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Scanning class records...</div>;
    if (error) return <div className="p-8 text-center font-bold text-rose-500">{error}</div>;

    const classAverage = marksData.length > 0 
        ? (marksData.reduce((acc, curr) => acc + curr.total, 0) / marksData.length).toFixed(1)
        : 0;
    const passedCount = marksData.filter(s => s.total >= 40).length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <button onClick={goBack} className="text-sm font-bold text-textSecondary hover:text-primary transition-colors flex items-center gap-2 mb-4">
                ← Back to Governance
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-tr from-surface to-surface/50 p-8 rounded-2xl border border-border shadow-xl backdrop-blur-md gap-6">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight">Class Overall Marks</h1>
                    <p className="text-textSecondary mt-1 font-medium">{subject?.name} <span className="font-mono text-xs ml-2 py-0.5 px-2 bg-secondary/50 rounded-md border border-border">{subject?.code}</span></p>
                </div>
                
                <div className="flex gap-4">
                    <div className="bg-background/50 p-4 rounded-xl border border-border shadow-inner text-center min-w-[120px]">
                        <div className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Class Avg</div>
                        <div className={`text-xl font-black ${classAverage >= 60 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {classAverage}%
                        </div>
                    </div>
                    <div className="bg-background/50 p-4 rounded-xl border border-border shadow-inner text-center min-w-[120px]">
                        <div className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Pass Rate</div>
                        <div className="text-xl font-black text-primary">
                            {marksData.length > 0 ? Math.round((passedCount / marksData.length) * 100) : 0}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/5 text-textSecondary text-[10px] font-black uppercase tracking-widest border-b border-border">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">USN / RegNo</th>
                                <th className="px-6 py-4 text-center">Internal 1 <span className="opacity-50 lowercase ml-1">(25)</span></th>
                                <th className="px-6 py-4 text-center">Internal 2 <span className="opacity-50 lowercase ml-1">(25)</span></th>
                                <th className="px-6 py-4 text-center">Semester <span className="opacity-50 lowercase ml-1">(50)</span></th>
                                <th className="px-6 py-4 text-center">Total <span className="opacity-50 lowercase ml-1">(100)</span></th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {marksData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-textSecondary font-medium">No student records found for this cohort.</td>
                                </tr>
                            ) : (
                                marksData.map(student => (
                                    <tr key={student.student_id} className="hover:bg-background/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-textPrimary group-hover:text-primary transition-colors">
                                            {student.student_name}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-textSecondary">
                                            {student.regno}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {student.marks['Internal 1'] || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {student.marks['Internal 2'] || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {student.marks['Semester'] || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-black text-lg">{student.total}</span>
                                                <div className="w-16 h-1 bg-background rounded-full overflow-hidden">
                                                    <div className={`h-full ${student.total >= 40 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(student.total, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${student.total >= 40 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                                {student.total >= 40 ? 'Pass' : 'Fail'}
                                            </span>
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

export default OverallMarksView;
