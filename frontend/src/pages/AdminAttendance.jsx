import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const AdminAttendance = () => {
    const { token } = useAuth();
    const [searchParams] = useSearchParams();

    const [allConfigs, setAllConfigs] = useState([]);
    const [academicHours, setAcademicHours] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Locking States
    const [locks, setLocks] = useState([]);
    const [globalLocked, setGlobalLocked] = useState(false);
    const [activeView, setActiveView] = useState('analytics'); // 'audit', 'control', or 'analytics'
    
    // Analytics States
    const [analyticsData, setAnalyticsData] = useState({ groupings: [], defaulters: [] });
    const [anLoading, setAnLoading] = useState(false);

    // Auto-select based on query params (from Manage button)
    const initialSectionId = searchParams.get('section_id');
    const initialSubjectId = searchParams.get('subject_id');
    const initialCourseId = searchParams.get('course_id');

    const [selectedConfig, setSelectedConfig] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedHour, setSelectedHour] = useState('');

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchData = async () => {
        try {
            const [configsRes, hoursRes, locksRes] = await Promise.all([
                fetch('http://localhost:5000/api/attendance/admin/all-configs', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/attendance/academic-hours', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/admin/attendance-control', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const configsData = await configsRes.json();
            const hoursData = await hoursRes.json();
            const locksData = await locksRes.json();

            if (configsData.success) {
                setAllConfigs(configsData.data);
                // Deep link logic
                if (initialSectionId && initialSubjectId) {
                    const target = configsData.data.find(c => c.section_id === initialSectionId && c.subject_id === initialSubjectId);
                    if (target) {
                        setSelectedConfig(target);
                        setActiveView('audit');
                    }
                } else if (initialCourseId) {
                    const firstMatch = configsData.data.find(c => c.course_id === initialCourseId);
                    if (firstMatch) {
                        setSelectedConfig(firstMatch);
                        setSearchTerm(firstMatch.course_name);
                        setActiveView('audit');
                    }
                }
            }

            if (hoursData.success) setAcademicHours(hoursData.data);
            
            if (locksData.success) {
                setLocks(locksData.data);
                const global = locksData.data.find(l => l.scope === 'global');
                setGlobalLocked(global?.is_locked || false);
            }
        } catch (err) {
            console.error("Failed to fetch Master Attendance data:", err);
        }
    };

    const fetchAnalytics = async () => {
        setAnLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/attendance/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setAnalyticsData(data.data);
            }
        } catch(e) {
            console.error("Analytics fetch error:", e);
        } finally {
            setAnLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
            fetchAnalytics();
        }
    }, [token, initialSectionId, initialSubjectId, initialCourseId]);

    // 2. Fetch students for selected session
    useEffect(() => {
        if (!selectedConfig || !selectedDate || !selectedHour || activeView !== 'audit') {
            setStudents([]);
            return;
        }

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `http://localhost:5000/api/attendance/session/students?section_id=${selectedConfig.section_id}&subject_id=${selectedConfig.subject_id}&date=${selectedDate}&hour_id=${selectedHour}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const data = await response.json();
                if (data.success) {
                    setStudents(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch students:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedConfig, selectedDate, selectedHour, token, activeView]);

    const handleToggleLock = async (scope, target_id, currentStatus) => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/attendance-control/toggle', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ scope, target_id, is_locked: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
                setMessage({ text: `System ${!currentStatus ? 'Locked' : 'Unlocked'} successfully.`, type: 'success' });
            }
        } catch (err) {
            console.error('Error toggling lock:', err);
        }
    };

    const getLockStatus = (scope, id) => {
        return locks.find(l => l.scope === scope && l.target_id === id)?.is_locked || false;
    };

    const handleStatusChange = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, today_status: status } : s
        ));
    };

    const handleSaveAttendance = async () => {
        setSaveLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const records = students.map(s => ({
                student_id: s.student_id,
                status: s.today_status === 'present' ? 'P' : 'A'
            }));

            const response = await fetch('http://localhost:5000/api/attendance/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject_id: selectedConfig.subject_id,
                    section_id: selectedConfig.section_id,
                    session_date: selectedDate,
                    hour_id: selectedHour,
                    records: records
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ text: 'Administrative Override: Attendance saved successfully.', type: 'success' });
            } else {
                setMessage({ text: data.message || 'Error saving attendance.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Server connection error.', type: 'error' });
        } finally {
            setSaveLoading(false);
        }
    };

    const filteredConfigs = allConfigs.filter(c => 
        c.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.faculty_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-textPrimary tracking-tight uppercase">Attendance Command Center</h1>
                    <p className="text-textSecondary mt-1">Institutional override, audit, and permission governance.</p>
                </div>
                
                <div className="flex bg-secondary/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
                    <button 
                        onClick={() => setActiveView('analytics')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-textSecondary hover:text-textPrimary'}`}
                    >
                        📊 Institutional Analytics
                    </button>
                    <button 
                        onClick={() => setActiveView('audit')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'audit' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textSecondary hover:text-textPrimary'}`}
                    >
                        🔍 Audit
                    </button>
                    <button 
                        onClick={() => setActiveView('control')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'control' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-textSecondary hover:text-textPrimary'}`}
                    >
                        🔒 Control
                    </button>
                </div>
            </header>

            {/* Global System Lock Alert (Persistent in Audit view if locked) */}
            {globalLocked && activeView === 'audit' && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-rose-500 font-black text-xs uppercase tracking-widest">Global Attendance Lock is ACTIVE</p>
                        <p className="text-rose-400/80 text-[10px] font-medium">Standard faculty marking is disabled across the entire institution. Only Master Overrides are permitted.</p>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 ${activeView === 'analytics' ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-8`}>
                
                {/* Global Navigator Sidebar */}
                {activeView !== 'analytics' && (
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-surface/50 backdrop-blur-xl rounded-3xl border border-border/50 p-6 shadow-2xl sticky top-24">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">
                                {activeView === 'audit' ? 'Academic Units' : 'Permissions Meta'}
                            </h3>
                            
                            <div className="relative mb-4">
                                <input 
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium py-3 text-textPrimary"
                                />
                            </div>

                            <div className="space-y-2 h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredConfigs.map(config => {
                                    const isCourseLocked = getLockStatus('course', config.course_id);
                                    return (
                                        <button
                                            key={config.mapping_id}
                                            onClick={() => setSelectedConfig(config)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all border group relative ${
                                                selectedConfig?.mapping_id === config.mapping_id
                                                ? 'bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                                : 'bg-secondary/20 border-border/30 hover:bg-secondary/40 hover:border-border'
                                            }`}
                                        >
                                            {isCourseLocked && (
                                                <span className="absolute -top-1 -right-1 bg-rose-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black uppercase shadow-lg">Locked</span>
                                            )}
                                            <div className={`font-bold text-sm ${selectedConfig?.mapping_id === config.mapping_id ? 'text-white' : 'text-textPrimary'}`}>
                                                {config.subject_name}
                                            </div>
                                            <div className={`text-[10px] mt-1 flex justify-between ${selectedConfig?.mapping_id === config.mapping_id ? 'text-white/70' : 'text-textSecondary font-medium'}`}>
                                                <span>{config.section_name}</span>
                                                <span className="opacity-50 group-hover:opacity-100 transition-opacity">{config.faculty_name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Management Stage */}
                <div className={`${activeView === 'analytics' ? 'w-full' : 'lg:col-span-3'} space-y-6`}>
                    
                    {activeView === 'analytics' ? (
                        <div className="bg-surface/50 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-8 min-h-[600px] space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-textPrimary tracking-tight">INSTITUTIONAL ANALYTICS</h2>
                                <p className="text-textSecondary text-sm">Macro-level attendance insight and department comparisons.</p>
                            </div>
                            
                            {anLoading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Department Comparison */}
                                    <div className="bg-background rounded-3xl p-6 border border-border">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-textPrimary mb-4">Department Performance</h3>
                                        <div className="space-y-4">
                                            {analyticsData.groupings.map((g, idx) => (
                                                <div key={idx} className="flex flex-col gap-2">
                                                    <div className="flex justify-between text-xs font-bold text-textSecondary uppercase tracking-widest">
                                                        <span>{g.course_name} (Sem {g.semester_number})</span>
                                                        <span className={parseFloat(g.average_percentage) < 75 ? 'text-rose-500' : 'text-emerald-500'}>{g.average_percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${parseFloat(g.average_percentage) < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                            style={{ width: `${g.average_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {analyticsData.groupings.length === 0 && <p className="text-sm text-textSecondary italic">No data recorded.</p>}
                                        </div>
                                    </div>
                                    
                                    {/* Defaulters System */}
                                    <div className="bg-background rounded-3xl p-6 border border-border bg-rose-500/5">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2"><span>⚠️</span> Critical Defaulters (&lt;75%)</h3>
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                            {analyticsData.defaulters.map((d, idc) => (
                                                <div key={idc} className="bg-surface border border-rose-500/20 p-3 rounded-2xl flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-bold text-textPrimary">{d.student_name}</p>
                                                    </div>
                                                    <span className="bg-rose-500/10 text-rose-500 text-xs font-black uppercase px-3 py-1 rounded-full border border-rose-500/20">
                                                        {d.overall_percentage}%
                                                    </span>
                                                </div>
                                            ))}
                                            {analyticsData.defaulters.length === 0 && <p className="text-sm text-emerald-500 font-bold">No students under 75% globally. Great!</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeView === 'control' ? (
                        <div className="bg-surface/50 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-8 min-h-[600px] space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-textPrimary tracking-tight">SYSTEM GOVERNANCE</h2>
                                <p className="text-textSecondary text-sm">Manage institutional attendance permissions and locks.</p>
                            </div>

                            {/* Global Switch */}
                            <div className={`p-8 rounded-3xl border transition-all duration-500 flex items-center justify-between shadow-xl ${globalLocked ? 'bg-rose-500/10 border-rose-500/30' : 'bg-secondary/10 border-border'}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-transform duration-500 ${globalLocked ? 'bg-rose-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}>
                                        {globalLocked ? '🔒' : '🔓'}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${globalLocked ? 'text-rose-500' : 'text-textPrimary'}`}>Institutional Master Lock</h3>
                                        <p className="text-textSecondary text-xs max-w-sm mt-1">Disables attendance marking for EVERY faculty member across the entire system. Use for holidays, exams, or maintenance.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleToggleLock('global', null, globalLocked)}
                                    className={`px-10 py-4 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl active:scale-95 ${globalLocked ? 'bg-surface text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                                >
                                    {globalLocked ? 'UNLOCK SYSTEM' : 'ENGAGE LOCK'}
                                </button>
                            </div>

                            {/* Course Permissions List */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-textSecondary px-2">Unit-Level Permissions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[...new Map(allConfigs.map(item => [item.course_id, item])).values()].map(unit => {
                                        const isLocked = getLockStatus('course', unit.course_id);
                                        return (
                                            <div key={unit.course_id} className={`p-6 rounded-3xl border transition-all flex items-center justify-between group ${isLocked ? 'bg-amber-500/5 border-amber-500/20' : 'bg-surface/40 border-border hover:border-primary/30'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${isLocked ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                                                        {isLocked ? '🔒' : '🎯'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-textPrimary">{unit.course_name}</div>
                                                        <div className="text-[10px] text-textSecondary uppercase font-black opacity-50 tracking-widest">{unit.dept_name || 'Department Academic'}</div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleToggleLock('course', unit.course_id, isLocked)}
                                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLocked ? 'bg-amber-500 text-white' : 'text-primary hover:bg-primary/10 border border-primary/20'}`}
                                                >
                                                    {isLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // AUDIT VIEW (EXISTING)
                        !selectedConfig ? (
                            <div className="bg-surface/30 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-border/50 h-[600px] flex flex-col items-center justify-center text-textSecondary gap-4">
                                <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center text-4xl mb-2 animate-bounce">🏛️</div>
                                <h2 className="text-xl font-bold text-textPrimary text-center px-8 uppercase tracking-tight">Select an academic unit to begin audit</h2>
                                <p className="max-w-xs text-center text-sm opacity-70">Browse through the global list of courses and sections in the sidebar to view or modify records.</p>
                            </div>
                        ) : (
                            <div className="bg-surface/50 backdrop-blur-xl rounded-[2.5rem] border border-border/50 shadow-2xl p-8 min-h-[600px] flex flex-col">
                                
                                {/* Control Bar */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/50 pb-8 mb-8 gap-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">Master Access</span>
                                            <h2 className="text-2xl font-black text-textPrimary leading-none uppercase tracking-tighter">{selectedConfig.subject_name}</h2>
                                        </div>
                                        <div className="mt-3 flex items-center gap-6 text-sm text-textSecondary font-medium">
                                            <span className="flex items-center gap-1.5"><span className="opacity-40">📍</span> {selectedConfig.section_name}</span>
                                            <span className="flex items-center gap-1.5"><span className="opacity-40">👨‍🏫</span> {selectedConfig.faculty_name}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-textSecondary tracking-tighter">Session Date</label>
                                            <input 
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="block w-full bg-secondary/40 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-textPrimary font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-textSecondary tracking-tighter">Academic Hour</label>
                                            <select 
                                                value={selectedHour}
                                                onChange={(e) => setSelectedHour(e.target.value)}
                                                className="block w-full bg-secondary/40 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-textPrimary font-bold"
                                            >
                                                <option value="">Select Slot</option>
                                                {academicHours.map(h => (
                                                    <option key={h.id} value={h.id}>{h.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Notifications */}
                                {message.text && (
                                    <div className={`mb-8 p-6 rounded-2xl border flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 ${
                                        message.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{message.type === 'error' ? '🚫' : '✨'}</span>
                                            <span className="font-bold text-xs tracking-tight uppercase">{message.text}</span>
                                        </div>
                                        <button onClick={() => setMessage({text:'', type:''})} className="opacity-50 hover:opacity-100 transition-opacity">✕</button>
                                    </div>
                                )}

                                {/* Student List Grid */}
                                {!selectedHour ? (
                                    <div className="flex-1 flex flex-col items-center justify-center opacity-40 grayscale py-20">
                                        <div className="text-6xl mb-4 animate-pulse">⌛</div>
                                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Slot Selection</p>
                                    </div>
                                ) : (
                                    <>
                                        {loading ? (
                                            <div className="flex-1 flex items-center justify-center py-20">
                                                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full shadow-lg shadow-primary/20"></div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[600px]">
                                                {students.map((student, idx) => (
                                                    <div key={student.student_id} className="bg-secondary/10 border border-border/30 p-5 rounded-3xl flex items-center justify-between group hover:border-primary/30 hover:bg-secondary/20 transition-all">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-textPrimary shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-textPrimary tracking-tight">{student.student_name}</div>
                                                                <div className="text-[10px] font-mono text-textSecondary uppercase opacity-60">ENR: {student.enrollment_number}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <button 
                                                                onClick={() => handleStatusChange(student.student_id, 'present')}
                                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                    student.today_status === 'present' 
                                                                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                                                                    : 'bg-secondary/40 text-textSecondary hover:bg-emerald-500/10 hover:text-emerald-500'
                                                                }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusChange(student.student_id, 'absent')}
                                                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                    student.today_status === 'absent' 
                                                                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' 
                                                                    : 'bg-secondary/40 text-textSecondary hover:bg-rose-500/10 hover:text-rose-500'
                                                                }`}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {students.length === 0 && (
                                                    <div className="py-20 text-center opacity-50 italic text-sm">No students found for this section.</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-textSecondary bg-secondary/20 px-6 py-3 rounded-2xl border border-border/30">
                                                Audit summary: <span className="text-emerald-500 ml-2">{students.filter(s=>s.today_status==='present').length} Present</span> • <span className="text-rose-500 ml-2">{students.filter(s=>s.today_status==='absent').length} Absent</span>
                                            </div>
                                            <button 
                                                onClick={handleSaveAttendance}
                                                disabled={saveLoading || students.length === 0}
                                                className="px-10 py-5 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                            >
                                                {saveLoading ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <span className="text-xl">🛡️</span> Apply Global Override
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminAttendance;
