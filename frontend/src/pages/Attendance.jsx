import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentAttendance from './StudentAttendance';

const Attendance = () => {
    const { token, user } = useAuth();

    if (user?.role === 'student') {
        return <StudentAttendance />;
    }

    const [courses, setCourses] = useState([]);
    const [academicHours, setAcademicHours] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedHour, setSelectedHour] = useState('');

    const [students, setStudents] = useState([]);
    const [initialState, setInitialState] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [coursesRes, hoursRes] = await Promise.all([
                    fetch('http://localhost:5000/api/attendance/faculty/assigned', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:5000/api/attendance/academic-hours', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                
                const coursesData = await coursesRes.json();
                const hoursData = await hoursRes.json();
                
                if (coursesData.success) setCourses(coursesData.data);
                if (hoursData.success) setAcademicHours(hoursData.data);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            }
        };
        fetchBaseData();
    }, [token]);

    useEffect(() => {
        if (!selectedCourse || !selectedDate || !selectedHour) {
            setStudents([]);
            setInitialState([]);
            setIsEditing(false);
            return;
        }

        const fetchStudents = async () => {
            setLoading(true);
            setMessage({ text: '', type: '' });
            try {
                const response = await fetch(
                    `http://localhost:5000/api/attendance/session/students?section_id=${selectedCourse.section_id}&subject_id=${selectedCourse.subject_id}&date=${selectedDate}&hour_id=${selectedHour}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const data = await response.json();
                if (data.success) {
                    const mappedData = data.data.map(s => ({
                        ...s,
                        today_status: s.today_status === 'unmarked' ? 'present' : s.today_status
                    }));
                    setStudents(mappedData);
                    setInitialState(JSON.parse(JSON.stringify(mappedData)));
                    setIsEditing(data.data.some(s => s.today_status !== 'unmarked'));
                }
            } catch (err) {
                setMessage({ text: 'Failed to fetch students.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCourse, selectedDate, selectedHour, token]);

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
                    subject_id: selectedCourse.subject_id,
                    section_id: selectedCourse.section_id,
                    session_date: selectedDate,
                    hour_id: selectedHour,
                    records
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ text: 'Attendance saved successfully!', type: 'success' });
                setInitialState(JSON.parse(JSON.stringify(students)));
                setIsEditing(true);
            } else {
                setMessage({ text: data.message || 'Error saving attendance.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Connection error.', type: 'error' });
        } finally {
            setSaveLoading(false);
        }
    };

    const classAverage = students.length > 0 
        ? (students.reduce((acc, curr) => acc + parseFloat(curr.overall_percentage || 0), 0) / students.length).toFixed(1)
        : null;

    return (
        <div className="space-y-6 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">ATTENDANCE GOVERNANCE</h1>
                    <p className="text-slate-500 font-medium italic">Secure institutional session tracking</p>
                </div>
                {classAverage && (
                    <div className="px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Class Average: {classAverage}%</span>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Courses Sidebar */}
                <div className="col-span-1 lg:col-span-1 space-y-4">
                    <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8"></div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Course Catalog</h3>
                        <div className="space-y-3">
                            {courses.map(course => (
                                <button
                                    key={course.mapping_id}
                                    onClick={() => setSelectedCourse(course)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                        selectedCourse?.mapping_id === course.mapping_id
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:shadow-md'
                                    }`}
                                >
                                    <p className={`text-sm font-black ${selectedCourse?.mapping_id === course.mapping_id ? 'text-white' : 'text-slate-800'}`}>
                                        {course.subject_name}
                                    </p>
                                    <p className={`text-[10px] mt-1 font-bold ${selectedCourse?.mapping_id === course.mapping_id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {course.section_name} • {course.subject_code}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Session View */}
                <div className="col-span-1 lg:col-span-3">
                    {!selectedCourse ? (
                        <div className="h-96 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 italic">
                            <span className="text-5xl mb-4">📖</span>
                            Select a course from the catalog to begin tracking
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-10 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* Session Settings */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                                <div className="space-y-4 w-full md:w-auto">
                                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                        Session Configuration
                                        {isEditing && <span className="ml-3 text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full uppercase tracking-widest font-black ring-1 ring-amber-200">Updating Existing</span>}
                                    </h2>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="form-group flex-1 min-w-[150px]">
                                            <label className="form-label">Date</label>
                                            <input 
                                                type="date" 
                                                value={selectedDate}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="form-input" 
                                            />
                                        </div>
                                        <div className="form-group flex-1 min-w-[200px]">
                                            <label className="form-label">Hour Slot</label>
                                            <select 
                                                value={selectedHour}
                                                onChange={(e) => setSelectedHour(e.target.value)}
                                                className="form-input"
                                            >
                                                <option value="" disabled>Select Hour Slot...</option>
                                                {academicHours.map(hr => (
                                                    <option key={hr.id} value={hr.id}>{hr.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications */}
                            {message.text && (
                                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                                    message.type === 'error' ? 'bg-rose-50 border border-rose-100 text-rose-500' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                                }`}>
                                    <span className="text-xl">{message.type === 'error' ? '⚠️' : '✅'}</span>
                                    <span className="text-sm font-bold">{message.text}</span>
                                </div>
                            )}

                            {/* Student List */}
                            {!selectedHour ? (
                                <div className="py-20 text-center text-slate-400 italic">
                                    <span className="text-4xl block mb-4">⌛</span>
                                    Define the session hour to reveal student roster
                                </div>
                            ) : (
                                <>
                                    {loading ? (
                                        <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <span>👥</span> Roster Analysis ({students.length} Records)
                                            </h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {students.map((student, idx) => (
                                                    <div 
                                                        key={student.student_id} 
                                                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
                                                            student.today_status === 'present' 
                                                            ? 'bg-emerald-50/30 border-emerald-100' 
                                                            : 'bg-rose-50/30 border-rose-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm border border-slate-200">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-800 tracking-tight">{student.student_name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.enrollment_number}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                                            <button 
                                                                onClick={() => handleStatusChange(student.student_id, 'present')}
                                                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                    student.today_status === 'present'
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-500'
                                                                }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button 
                                                                onClick={() => handleStatusChange(student.student_id, 'absent')}
                                                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                    student.today_status === 'absent'
                                                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-rose-300 hover:text-rose-500'
                                                                }`}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Submit Area */}
                                            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                                <p className="text-[10px] font-bold text-slate-400 italic">
                                                    Institutional Policy: All attendance logs are audited by the academic governance committee.
                                                </p>
                                                <button 
                                                    onClick={handleSaveAttendance}
                                                    disabled={saveLoading}
                                                    className="w-full md:w-auto btn-primary flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]"
                                                >
                                                    {saveLoading ? 'Processing...' : (isEditing ? 'Update Session Logs' : 'Finalize Attendance Log')}
                                                    <span>➡️</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
