import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CourseDetailsModal = ({ isOpen, onClose, courseId }) => {
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCourseDetails();
    }
  }, [isOpen, courseId]);

  const fetchCourseDetails = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourse(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        >
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500">Loading course curriculum data...</p>
            </div>
          ) : course ? (
            <>
              {/* Header */}
              <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
                  <span className="text-2xl">×</span>
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                      {course.department}
                    </span>
                    <h2 className="text-3xl font-bold">{course.name}</h2>
                    <p className="text-indigo-100 mt-2">Active Academic Module • {course.credits} Credits</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl min-w-[100px] text-center border border-white/10">
                      <div className="text-2xl font-bold">{course.stats?.student_count}</div>
                      <div className="text-[10px] uppercase text-indigo-200 font-bold">Enrolled</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Panel */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-tight">Academic Performance</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 font-medium">Avg Class Score</span>
                          <span className="font-bold text-slate-900">{course.stats?.avg_marks}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${course.stats?.avg_marks}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 font-medium">Attendance Rate</span>
                          <span className="font-bold text-slate-900">{course.stats?.avg_attendance}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${course.stats?.avg_attendance}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-sm font-bold text-amber-700 uppercase mb-2 tracking-tight">Active Faculty</h3>
                    <p className="text-amber-800 font-bold">Dr. Sarah Johnson (Primary)</p>
                    <p className="text-xs text-amber-600 mt-1 italic">3 supporting TAs allocated this semester.</p>
                  </div>
                </div>

                {/* Enrollment List */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span>Enrollment Details</span>
                      <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Top 50 Students</span>
                    </h3>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                          <tr>
                            <th className="px-6 py-3">Student Name</th>
                            <th className="px-6 py-3">Reg. No</th>
                            <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {course.students?.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 font-semibold text-slate-800">{s.name}</td>
                              <td className="px-6 py-3 font-mono text-slate-500">{s.enrollment_number}</td>
                              <td className="px-6 py-3 text-right">
                                <button className="text-indigo-600 font-bold hover:underline">View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-slate-500 text-xs">
                <span>Data updated in real-time from Academic Records</span>
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                  Close Details
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Unable to load course data.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CourseDetailsModal;
