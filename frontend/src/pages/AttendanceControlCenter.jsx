import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AttendanceControlCenter = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [locks, setLocks] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalLocked, setGlobalLocked] = useState(false);
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locksRes, coursesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/attendance-control', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/academic-setup/courses', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (locksRes.data.success) {
                setLocks(locksRes.data.data);
                const global = locksRes.data.data.find(l => l.scope === 'global');
                setGlobalLocked(global?.is_locked || false);
            }
            if (coursesRes.data.success) {
                setCourses(coursesRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching control data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleToggle = async (scope, target_id, currentStatus) => {
        try {
            const res = await axios.post('http://localhost:5000/api/admin/attendance-control/toggle', {
                scope,
                target_id,
                is_locked: !currentStatus
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                fetchData();
            }
        } catch (err) {
            console.error('Error toggling lock:', err);
        }
    };

    const handleBulkAction = async (isLocked) => {
        if (selectedIds.length === 0) return;
        setBulkActionLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/admin/attendance-control/bulk-toggle', {
                scope: 'course',
                target_ids: selectedIds,
                is_locked: isLocked
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                fetchData();
                setSelectedIds([]);
            }
        } catch (err) {
            console.error('Bulk action failed:', err);
        } finally {
            setBulkActionLoading(false);
        }
    };

    const getLockStatus = (scope, id) => {
        return locks.find(l => l.scope === scope && l.target_id === id)?.is_locked || false;
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === courses.length) setSelectedIds([]);
        else setSelectedIds(courses.map(c => c.id));
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-textPrimary">Attendance Control Center</h1>
                    <p className="text-textSecondary text-sm">Main control panel for managing institutional attendance marking permissions.</p>
                </div>
            </div>

            {/* Global Kill-Switch */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 flex items-center justify-between shadow-xl ${globalLocked ? 'bg-rose-500/10 border-rose-500/30' : 'bg-surface border-border'}`}>
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform ${globalLocked ? 'bg-rose-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}>
                        {globalLocked ? '🔒' : '🔓'}
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${globalLocked ? 'text-rose-500' : 'text-textPrimary'}`}>
                            Global Attendance Lock
                        </h2>
                        <p className="text-textSecondary text-sm max-w-sm">
                            Disable attendance marking for EVERY course and subject system-wide.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleToggle('global', null, globalLocked)}
                    className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${globalLocked ? 'bg-surface text-rose-500 border border-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                    {globalLocked ? 'UNLOCK SYSTEM' : 'LOCK SYSTEM'}
                </button>
            </div>

            {/* Course Table Control */}
            <div className="bg-surface/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-lg font-semibold text-textPrimary flex items-center gap-2">🏛️ Course Permissions</h2>
                    
                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <div className="flex gap-2 animate-in slide-in-from-right duration-300">
                                <button 
                                    onClick={() => handleBulkAction(true)} 
                                    disabled={bulkActionLoading}
                                    className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-600 disabled:opacity-50"
                                >
                                    Lock Selected ({selectedIds.length})
                                </button>
                                <button 
                                    onClick={() => handleBulkAction(false)} 
                                    disabled={bulkActionLoading}
                                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    Unlock Selected
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-secondary/30 text-textSecondary text-[10px] uppercase tracking-widest font-bold">
                            <tr>
                                <th className="p-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === courses.length && courses.length > 0} 
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                                    />
                                </th>
                                <th className="p-4">Course Name / ID</th>
                                <th className="p-4">Department</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan="5" className="p-8 bg-secondary/10"></td></tr>
                                ))
                            ) : (
                                courses.map(course => {
                                    const isLocked = getLockStatus('course', course.id);
                                    return (
                                        <tr key={course.id} className={`hover:bg-secondary/20 transition-colors ${isLocked ? 'bg-amber-500/5' : ''}`}>
                                            <td className="p-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(course.id)} 
                                                    onChange={() => toggleSelect(course.id)}
                                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-textPrimary">{course.course_name}</div>
                                                <div className="text-[10px] text-textSecondary font-mono uppercase opacity-50">{course.id}</div>
                                            </td>
                                            <td className="p-4 text-sm text-textSecondary">{course.department}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${isLocked ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                                                    {isLocked ? 'Locked' : 'Open'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => handleToggle('course', course.id, isLocked)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isLocked ? 'text-amber-500 hover:bg-amber-500/10' : 'text-primary hover:bg-primary/10'}`}
                                                >
                                                    {isLocked ? 'Unlock' : 'Lock'}
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/admin/attendance?course_id=${course.id}`)}
                                                    className="px-4 py-1.5 rounded-lg bg-secondary text-textPrimary text-xs font-bold hover:bg-border transition-all"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            {courses.length === 0 && !loading && (
                                <tr><td colSpan="5" className="p-12 text-center text-textSecondary italic">No courses available for control.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grace Period Box */}
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex items-start gap-4 shadow-inner">
                <span className="text-3xl">🛡️</span>
                <div>
                    <h3 className="font-bold text-primary">Administrative Privilege</h3>
                    <p className="text-sm text-textSecondary mt-1 leading-relaxed">
                        Administrators bypass the standard **24-hour grace period** and can modify records indefinitely.
                        Use the "Manage" button to view or edit historical attendance for any specific course.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceControlCenter;
