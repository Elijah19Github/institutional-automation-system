import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StudentMarks = () => {
    const { token } = useAuth();
    const [marksData, setMarksData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/marks/student-marks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setMarksData(res.data.data);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load marks data.');
            } finally {
                setLoading(false);
            }
        };

        fetchMarks();
    }, [token]);

    const getStatusText = (total) => {
        if (total >= 75) return { text: 'Excellent', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
        if (total >= 60) return { text: 'Good', color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
        if (total >= 40) return { text: 'Average', color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { text: 'Attention', color: 'text-rose-500', bg: 'bg-rose-500/10' };
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMarks = React.useMemo(() => {
        let sortableItems = [...marksData];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [marksData, sortConfig]);

    const groupedMarks = React.useMemo(() => {
        const groups = {};
        sortedMarks.forEach(item => {
            const sem = item.semester_name || 'Other';
            if (!groups[sem]) groups[sem] = [];
            groups[sem].push(item);
        });
        return groups;
    }, [sortedMarks]);

    if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Loading academic records...</div>;
    if (error) return <div className="p-8 text-center font-bold text-rose-500">{error}</div>;

    const aggregateTotal = marksData.reduce((acc, curr) => acc + curr.total, 0);
    const maxTotal = marksData.length * 100;
    const overallPercentage = maxTotal ? ((aggregateTotal / maxTotal) * 100).toFixed(1) : 0;

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="opacity-30 inline-block ml-1">⇅</span>;
        return <span className="text-primary inline-block ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-tr from-surface to-surface/50 p-8 rounded-2xl border border-border shadow-xl backdrop-blur-md gap-6">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight">Academic Performance</h1>
                    <p className="text-textSecondary mt-1 font-medium">Your current marks tracking and assessment results.</p>
                </div>
                
                <div className="flex items-center gap-6 bg-background/50 p-4 rounded-xl border border-border shadow-inner">
                    <div className="text-center">
                        <div className="text-xs text-textSecondary uppercase tracking-widest font-bold mb-1">Overall</div>
                        <div className={`text-2xl font-black ${overallPercentage >= 40 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {overallPercentage}%
                        </div>
                    </div>
                    <div className="w-px h-10 bg-border"></div>
                    <div className="text-center">
                        <div className="text-xs text-textSecondary uppercase tracking-widest font-bold mb-1">Subjects</div>
                        <div className="text-2xl font-black text-textPrimary">{marksData.length}</div>
                    </div>
                </div>
            </div>

            {marksData.length === 0 ? (
                <div className="bg-surface border border-border p-12 rounded-2xl text-center text-textSecondary font-medium shadow-sm">
                    <span className="text-4xl mb-4 block opacity-50">📚</span>
                    No marks records available yet.
                </div>
            ) : (
                Object.entries(groupedMarks).sort(([semA], [semB]) => semA.localeCompare(semB)).map(([semester, subjects], groupIdx) => (
                    <div key={semester} className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                            <h2 className="text-xl font-black text-textPrimary uppercase tracking-wider">{semester}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                        </div>

                        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
                                            <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-16">
                                                SL.No.
                                            </th>
                                            <th 
                                                className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors"
                                                onClick={() => handleSort('subject_name')}
                                            >
                                                Course Name <SortIcon columnKey="subject_name" />
                                            </th>
                                            <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-28">
                                                Internal 1 <br/><span className="text-[10px] opacity-70 normal-case tracking-normal">(Max 25)</span>
                                            </th>
                                            <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-28">
                                                Internal 2 <br/><span className="text-[10px] opacity-70 normal-case tracking-normal">(Max 25)</span>
                                            </th>
                                            <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-28">
                                                Semester <br/><span className="text-[10px] opacity-70 normal-case tracking-normal">(Max 50)</span>
                                            </th>
                                            <th 
                                                className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors w-36"
                                                onClick={() => handleSort('total')}
                                            >
                                                Total Score <SortIcon columnKey="total" />
                                            </th>
                                            <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-28">
                                                Grade
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {subjects.map((subject, idx) => {
                                            const status = getStatusText(subject.total);
                                            return (
                                                <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="p-4 text-sm font-bold text-textSecondary text-center">{idx + 1}</td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-textPrimary group-hover:text-primary transition-colors">{subject.subject_name}</div>
                                                        <div className="text-xs font-mono text-textSecondary mt-0.5">{subject.subject_code}</div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-textPrimary text-center bg-background/20">
                                                        {subject.marks['Internal 1'] !== undefined ? subject.marks['Internal 1'] : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-textPrimary text-center bg-background/20">
                                                        {subject.marks['Internal 2'] !== undefined ? subject.marks['Internal 2'] : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-textPrimary text-center bg-background/20">
                                                        {subject.marks['Semester'] !== undefined ? subject.marks['Semester'] : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1.5 max-w-[120px]">
                                                            <span className={`text-sm font-black ${subject.total >= 40 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {subject.total} <span className="text-xs text-textSecondary opacity-70">/ 100</span>
                                                            </span>
                                                            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${subject.total >= 40 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                                                    style={{width: `${Math.min(subject.total, 100)}%`}}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-background/80 border-t border-border">
                                        <tr>
                                            <td colSpan="5" className="p-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">
                                                {semester} Performance
                                            </td>
                                            <td className="p-4 text-lg font-black text-primary">
                                                {(subjects.reduce((sum, s) => sum + s.total, 0) / (subjects.length * 100) * 100).toFixed(1)}%
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default StudentMarks;
