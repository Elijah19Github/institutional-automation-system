import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
    const { token } = useAuth();

    const [courses, setCourses] = useState([]);
    const [academicHours, setAcademicHours] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedHour, setSelectedHour] = useState('');

    const [students, setStudents] = useState([]);
    const [initialState, setInitialState] = useState([]); // For dirty checking

    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Fetch faculty assigned courses on component mount
    useEffect(() => {
        const fetchAssignedCourses = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/attendance/faculty/assigned', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setCourses(data.data);
                }

                const hoursRes = await fetch('http://localhost:5000/api/attendance/academic-hours', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const hoursData = await hoursRes.json();
                if (hoursData.success) {
                    setAcademicHours(hoursData.data);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchAssignedCourses();
    }, [token]);

    // Fetch students automatically if course, date, and hour are selected
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
                    setStudents(data.data);
                    setInitialState(JSON.parse(JSON.stringify(data.data))); // Deep copy for comparison

                    // Check if any student already has attendance (Editing Mode)
                    const hasExisting = data.data.some(s => s.today_status !== 'unmarked');
                    setIsEditing(hasExisting);
                }
            } catch (err) {
                console.error("Failed to fetch students:", err);
                setMessage({ text: 'Failed to fetch students.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCourse, selectedDate, selectedHour, token]);

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setMessage({ text: '', type: '' });
    };

    const handleStatusChange = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, today_status: status } : s
        ));
    };

    const handleSaveAttendance = async () => {
        setSaveLoading(true);
        setMessage({ text: '', type: '' });

        // Ensure all students are marked before saving
        const unmarked = students.filter(s => s.today_status === 'unmarked');
        if (unmarked.length > 0) {
            setMessage({ text: `Please mark attendance for all students. ${unmarked.length} remaining.`, type: 'error' });
            setSaveLoading(false);
            return;
        }

        // Detect local changes before transmitting
        let hasChanges = false;
        for (let i = 0; i < students.length; i++) {
            if (students[i].today_status !== initialState[i].today_status) {
                hasChanges = true;
                break;
            }
        }

        if (!hasChanges && isEditing) {
            setMessage({ text: 'No changes detected. Attendance is already up to date.', type: 'error' });
            setSaveLoading(false);
            return;
        }

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
                    records: records
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ text: 'Attendance saved successfully to Database!', type: 'success' });
                // Re-sync initial state to new state to prevent re-submits without changes
                setInitialState(JSON.parse(JSON.stringify(students)));
                setIsEditing(true);
            } else {
                // Handle specific backend constraints
                if (data.code === 'NO_CHANGES_DETECTED') {
                    setMessage({ text: 'No changes detected by the server.', type: 'error' });
                } else if (data.code === 'FUTURE_DATE_NOT_ALLOWED') {
                    setMessage({ text: 'Cannot mark attendance for upcoming dates.', type: 'error' });
                } else if (data.code === 'UNAUTHORIZED_SUBJECT_ACCESS') {
                    setMessage({ text: 'You are not assigned to this class.', type: 'error' });
                } else {
                    setMessage({ text: data.message || 'Error saving attendance.', type: 'error' });
                }
            }
        } catch (err) {
            setMessage({ text: 'Unable to connect to server.', type: 'error' });
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-100">Faculty Attendance Module</h1>
            <p className="text-slate-400">Select a course, date, and hour slot to log attendance securely into the institutional database.</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Course Selection Sidebar */}
                <div className="col-span-1 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 shadow-xl h-fit">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <span>📚</span> Assigned Courses
                    </h3>
                    <div className="space-y-3">
                        {courses.length === 0 && !loading && (
                            <div className="text-slate-500 text-sm p-2 text-center">No assigned courses found.</div>
                        )}
                        {courses.map(course => (
                            <button
                                key={course.mapping_id}
                                onClick={() => handleCourseSelect(course)}
                                className={`w-full text-left p-4 rounded-xl transition-all border ${selectedCourse?.mapping_id === course.mapping_id
                                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-700/30 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-medium text-slate-200">{course.subject_name} ({course.subject_code})</div>
                                <div className="text-xs text-slate-400 mt-1">{course.section_name} - {course.semester_name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Attendance List Area */}
                <div className="col-span-1 lg:col-span-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative min-h-[500px]">

                    {!selectedCourse ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <span className="text-6xl mb-4 opacity-50">📋</span>
                            <p className="text-lg font-medium">Select a course to load attendance.</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-700/50 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                                        {selectedCourse.subject_name}
                                        {isEditing && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md ml-2 border border-indigo-500/30">Editing Existing</span>}
                                    </h2>

                                    {/* Date & Hour Selectors */}
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        <div>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={selectedHour}
                                                onChange={(e) => setSelectedHour(e.target.value)}
                                                className="bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="" disabled>Select Academic Hour</option>
                                                {academicHours.map(hr => (
                                                    <option key={hr.id} value={hr.id}>{hr.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-slate-300">Present ({students.filter(s => s.today_status === 'present').length})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                        <span className="text-sm text-slate-300">Absent ({students.filter(s => s.today_status === 'absent').length})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications */}
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${message.type === 'error'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    }`}>
                                    <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
                                    <span className="font-medium text-sm">{message.text}</span>
                                </div>
                            )}

                            {!selectedHour ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 mt-10">
                                    <span className="text-5xl mb-3 opacity-50">⏳</span>
                                    <p className="text-md font-medium">Please select an Academic Hour to load the student list.</p>
                                </div>
                            ) : (
                                <>
                                    {/* List */}
                                    {loading ? (
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                            {students.map((student, idx) => (
                                                <div key={student.student_id} className="bg-slate-700/30 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shadow-inner">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-200">{student.student_name}</p>
                                                            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {student.enrollment_number}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.student_id, 'present')}
                                                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${student.today_status === 'present'
                                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                                : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                                                                }`}
                                                        >
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.student_id, 'absent')}
                                                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${student.today_status === 'absent'
                                                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                                                                : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-rose-500/50 hover:text-rose-400'
                                                                }`}
                                                        >
                                                            Absent
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer Submit */}
                                    <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-end">
                                        <button
                                            onClick={handleSaveAttendance}
                                            disabled={saveLoading}
                                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {saveLoading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <span>💾</span> Save Attendance
                                                </>
                                            )}
                                        </button>
                                    </div>
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
