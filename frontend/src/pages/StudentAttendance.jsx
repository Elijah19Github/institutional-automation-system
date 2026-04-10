import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StudentAttendance = () => {
    const { token, user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'subject_percentage', direction: 'desc' });

    const [view, setView] = useState('overview'); // 'overview' or 'hourly'
    const [hourlyData, setHourlyData] = useState({ daily: [], available_hours: [] });
    const [dateRange, setDateRange] = useState({ 
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
        to: new Date().toISOString().split('T')[0] 
    });
    const [showFilters, setShowFilters] = useState(true);

    const fetchHourlyData = React.useCallback(async () => {
        try {
            const query = new URLSearchParams(dateRange).toString();
            const res = await fetch(`http://localhost:5000/api/attendance/student/hourly?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setHourlyData(json.data);
        } catch (error) {
            console.error("Hourly attendance fetch error:", error);
        }
    }, [token, dateRange]);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/attendance/student/percentage', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (error) {
                console.error("Student attendance fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
        if (view === 'hourly') fetchHourlyData();
    }, [token, view, fetchHourlyData]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedSubjects = React.useMemo(() => {
        if (!data || !data.subjects) return [];
        let sortableItems = [...data.subjects];
        sortableItems.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (sortConfig.key === 'subject_percentage') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [data, sortConfig]);

    const groupedSubjects = React.useMemo(() => {
        const groups = {};
        sortedSubjects.forEach(sub => {
            const sem = sub.semester_name || 'Other';
            if (!groups[sem]) groups[sem] = [];
            groups[sem].push(sub);
        });
        return groups;
    }, [sortedSubjects]);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="opacity-30 inline-block ml-1">⇅</span>;
        return <span className="text-primary inline-block ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { overall } = data || { overall: { percentage: 0, total_classes: 0, total_present: 0 } };
    const isDefaulter = overall.percentage < 75;
    const requiredToReach75 = isDefaulter 
        ? Math.ceil((0.75 * overall.total_classes - overall.total_present) / (1 - 0.75))
        : 0; 

    const HourlyView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors"
                >
                    {showFilters ? '▼ Hide Filters' : '▲ Show Filters'}
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-surface p-8 rounded-3xl border border-border shadow-xl shadow-slate-200/5 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary">From Date</label>
                            <input 
                                type="date" 
                                value={dateRange.from}
                                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all placeholder:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-textSecondary">To Date<span className="text-rose-500 ml-1">*</span></label>
                            <input 
                                type="date" 
                                value={dateRange.to}
                                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                                className="w-full bg-background border border-border px-4 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDateRange({ from: '', to: '' })}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border font-black text-[10px] uppercase tracking-widest hover:bg-secondary transition-all"
                            >
                                🔄 Reset
                            </button>
                            <button 
                                onClick={fetchHourlyData}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                            >
                                🔍 Search
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 px-2">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-all">
                    🖨️ Print
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-100 hover:bg-purple-100 transition-all">
                    📥 Export
                </button>
            </div>

            {/* Matrix Table */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
                                <th className="p-4 text-[10px] font-black text-textSecondary uppercase tracking-widest sticky left-0 bg-background z-20 w-32 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Dates</th>
                                {hourlyData.available_hours.map(hour => (
                                    <th key={hour.id} className="p-4 text-[10px] font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap min-w-[100px]">
                                        {hour.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {hourlyData.daily.length === 0 ? (
                                <tr>
                                    <td colSpan={hourlyData.available_hours.length + 1} className="p-12 text-center text-textSecondary font-medium italic">
                                        No hourly data available for the selected range.
                                    </td>
                                </tr>
                            ) : (
                                hourlyData.daily.map((day, idx) => (
                                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-4 text-sm font-black text-textPrimary sticky left-0 bg-surface group-hover:bg-primary/5 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        {hourlyData.available_hours.map(hour => {
                                            const record = day.hours[hour.id];
                                            return (
                                                <td key={hour.id} className="p-4 text-center">
                                                    {record ? (
                                                        <div className="flex flex-col items-center gap-1 group/item relative">
                                                            <span className={`text-sm font-black ${record.status === 'P' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {record.status}
                                                            </span>
                                                            <div className="absolute bottom-full mb-2 hidden group-hover/item:block z-30 bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl whitespace-nowrap">
                                                                <p className="font-bold">{record.subject_name}</p>
                                                                <p className="opacity-70">{record.subject_code}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight uppercase">My Attendance</h1>
                    <p className="text-textSecondary mt-1 font-medium">{user?.name} • Academic Progress Tracking</p>
                </div>

                <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                    <button 
                        onClick={() => setView('overview')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'overview' ? 'bg-surface text-primary shadow-sm' : 'text-textSecondary hover:text-primary'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setView('hourly')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'hourly' ? 'bg-surface text-primary shadow-sm' : 'text-textSecondary hover:text-primary'}`}
                    >
                        Hourly View
                    </button>
                </div>
            </header>

            {view === 'overview' ? (
                <>
                    {/* Overall Attendance Card */}
                    <div className="bg-surface rounded-3xl p-8 shadow-xl shadow-slate-200/5 focus-within:ring-2 border border-border flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                        <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isDefaulter ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        
                        <div className="flex-1 w-full space-y-4 z-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-widest text-textSecondary">Overall Progress</p>
                                    <h2 className={`text-5xl font-black tracking-tighter mt-1 ${isDefaulter ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {overall.percentage}%
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-textPrimary font-bold text-lg">{overall.total_present} / {overall.total_classes}</p>
                                    <p className="text-textSecondary text-xs uppercase font-bold tracking-widest">Sessions Attended</p>
                                </div>
                            </div>
                            
                            <div className="w-full bg-secondary rounded-full h-4 relative overflow-hidden ring-1 ring-inset ring-border/50">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isDefaulter ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
                                    style={{ width: `${overall.percentage}%` }}
                                ></div>
                                <div className="absolute top-0 bottom-0 left-[75%] w-1 bg-amber-400 z-10 shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-textSecondary px-1">
                                <span>0%</span>
                                <span className="text-amber-500 flex items-center flex-col ml-[-10px]"><span className="text-xl -mt-2">↓</span>75% Required Limit</span>
                                <span>100%</span>
                            </div>

                            <div className="mt-4">
                                {isDefaulter ? (
                                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4">
                                        <span className="text-2xl animate-bounce">⚠️</span>
                                        <div>
                                            <p className="text-rose-500 font-black text-sm uppercase tracking-widest">Critical Alert: Below Eligibility</p>
                                            <p className="text-rose-400 max-w-lg mt-1 text-xs font-medium">
                                                You need to attend ~<strong className="text-rose-300 mx-1">{requiredToReach75}</strong> consecutive sessions to reach the 75% minimum eligibility. Note: this is a projection.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4">
                                        <span className="text-2xl">🎉</span>
                                        <div>
                                            <p className="text-emerald-500 font-black text-sm uppercase tracking-widest">Safe Zone Status Active</p>
                                            <p className="text-emerald-400/80 mt-1 text-xs font-medium">You are maintaining excellent attendance metrics. Keep it up!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subject Breakdown grouped by Semester */}
                    {Object.entries(groupedSubjects).sort(([semA], [semB]) => semA.localeCompare(semB)).map(([semester, subjects]) => (
                        <div key={semester} className="space-y-4">
                            <div className="flex items-center gap-4 px-2">
                                <h3 className="text-xl font-black uppercase tracking-widest text-textPrimary">{semester}</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                            </div>

                            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
                                                <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-16">Sl.No.</th>
                                                <th 
                                                    className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors"
                                                    onClick={() => handleSort('subject_name')}
                                                >
                                                    Course Name <SortIcon columnKey="subject_name" />
                                                </th>
                                                <th 
                                                    className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors w-32"
                                                    onClick={() => handleSort('total_classes')}
                                                >
                                                    Total Classes <SortIcon columnKey="total_classes" />
                                                </th>
                                                <th 
                                                    className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors w-32"
                                                    onClick={() => handleSort('total_present')}
                                                >
                                                    Attended <SortIcon columnKey="total_present" />
                                                </th>
                                                <th 
                                                    className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap cursor-pointer hover:bg-black/5 transition-colors w-40"
                                                    onClick={() => handleSort('subject_percentage')}
                                                >
                                                    Percentage <SortIcon columnKey="subject_percentage" />
                                                </th>
                                                <th className="p-4 text-xs font-black text-textSecondary uppercase tracking-widest text-center whitespace-nowrap w-28">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {subjects.map((sub, idx) => {
                                                const percent = parseFloat(sub.subject_percentage);
                                                const isShortage = percent < 75;
                                                return (
                                                    <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                                        <td className="p-4 text-sm font-bold text-textSecondary text-center">{idx + 1}</td>
                                                        <td className="p-4">
                                                            <div className="text-sm font-bold text-textPrimary group-hover:text-primary transition-colors">{sub.subject_name}</div>
                                                            <div className="text-xs font-mono text-textSecondary mt-0.5">{sub.subject_code}</div>
                                                        </td>
                                                        <td className="p-4 text-sm font-bold text-textPrimary text-center bg-background/20">
                                                            {sub.total_classes}
                                                        </td>
                                                        <td className="p-4 text-sm font-bold text-textPrimary text-center bg-background/20">
                                                            {sub.total_present}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-col gap-1.5 max-w-[120px] mx-auto">
                                                                <span className={`text-sm font-black text-center ${isShortage ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                    {sub.subject_percentage}%
                                                                </span>
                                                                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full ${isShortage ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                                        style={{width: `${Math.min(percent, 100)}%`}}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isShortage ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                {isShortage ? 'Shortage' : 'Safe'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-background/80 border-t border-border">
                                            <tr>
                                                <td colSpan="2" className="p-4 text-right text-xs font-black text-textSecondary uppercase tracking-widest">
                                                    {semester} Aggregate
                                                </td>
                                                <td className="p-4 text-center text-sm font-black text-textPrimary">
                                                    {subjects.reduce((sum, s) => sum + parseInt(s.total_classes), 0)}
                                                </td>
                                                <td className="p-4 text-center text-sm font-black text-textPrimary">
                                                    {subjects.reduce((sum, s) => sum + parseInt(s.total_present), 0)}
                                                </td>
                                                <td className="p-4 text-center text-lg font-black text-primary">
                                                    {(subjects.reduce((sum, s) => sum + parseInt(s.total_present), 0) / subjects.reduce((sum, s) => sum + parseInt(s.total_classes), 0) * 100).toFixed(2)}%
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}

                    {Object.keys(groupedSubjects).length === 0 && (
                        <div className="p-10 text-center bg-surface border border-border rounded-2xl opacity-50 text-sm font-medium">
                            No subject specific attendance registered yet.
                        </div>
                    )}
                </>
            ) : (
                <HourlyView />
            )}
        </div>
    );
};

export default StudentAttendance;
