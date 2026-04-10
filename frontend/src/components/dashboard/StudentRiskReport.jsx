import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StudentRiskReport = ({ isOpen, onClose, studentId }) => {
  const { token } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchReport();
    } else {
      setReportData(null);
      setError(null);
    }
  }, [isOpen, studentId]);

  const fetchReport = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/api/admin/student-risk/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load report.');
      }
    } catch (err) {
      console.error('Error fetching risk report:', err);
      setError(err.response?.data?.message || 'Could not connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const ai = reportData?.ai_analysis;
  const riskColor = {
    HIGH: { bg: 'bg-rose-500', text: 'text-rose-500', light: 'bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-700' },
    MEDIUM: { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    LOW: { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  };
  const riskLevel = ai?.risk_level?.toUpperCase() || 'LOW';
  const colors = riskColor[riskLevel] || riskColor.LOW;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative w-full max-w-4xl bg-white border border-slate-200 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 relative flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-xs font-bold uppercase tracking-widest">
                  🤖 AI Risk Assessment Report
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-3">
                  {loading ? 'Analyzing student data...' : (reportData?.student?.name || 'Loading...')}
                </h2>
                {reportData?.student && (
                  <p className="text-slate-400 mt-1 text-sm">
                    Reg No: <strong className="text-slate-200">{reportData.student.enrollment_number}</strong>
                    {reportData.student.course_name && <> &nbsp;|&nbsp; Course: <strong className="text-slate-200">{reportData.student.course_name}</strong></>}
                    {reportData.student.semester_name && <> &nbsp;|&nbsp; {reportData.student.semester_name}</>}
                  </p>
                )}
              </div>
              {ai && (
                <div className="text-center mr-10">
                  <div className={`text-4xl font-black ${colors.text}`}>
                    {(ai.probability * 100).toFixed(0)}%
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                    {riskLevel} RISK
                  </span>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all text-white text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Running ML prediction model...</p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                <p className="text-rose-600 font-bold text-lg mb-2">⚠️ Could not load report</p>
                <p className="text-rose-500 text-sm">{error}</p>
                <button onClick={fetchReport} className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700">
                  Retry
                </button>
              </div>
            )}

            {/* Full report */}
            {!loading && !error && reportData && (
              <>
                {/* AI Summary Card */}
                <section className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Recommendation</h4>
                    <span className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-bold">
                      Powered by ML Model
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-base">
                    {reportData.summary}
                  </p>
                </section>

                {/* Quick Stat Pills */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Attendance', value: `${ai?.avg_attendance ?? '-'}%`, warn: ai?.avg_attendance < 75 },
                    { label: 'Academic Score', value: `${ai?.avg_marks ?? '-'}%`, warn: ai?.avg_marks < 50 },
                    { label: 'Risk Level', value: riskLevel, warn: riskLevel === 'HIGH' },
                    { label: 'Risk Score', value: `${(ai?.probability * 100).toFixed(1)}%`, warn: ai?.probability > 0.6 },
                    { label: 'Department', value: reportData.student.department || 'N/A', warn: false },
                    { label: 'Prediction', value: ai?.prediction === 1 ? '⚠️ At Risk' : '✅ Safe', warn: ai?.prediction === 1 },
                  ].map((stat, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${stat.warn ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className={`text-xl font-black ${stat.warn ? 'text-rose-600' : 'text-slate-800'}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Risk Factors */}
                {reportData.reasons?.length > 0 && (
                  <section>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Identified Risk Factors</h4>
                    <div className="grid gap-2">
                      {reportData.reasons.map((reason, i) => (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center text-rose-700 font-medium text-sm"
                        >
                          <div className="w-2 h-2 bg-rose-500 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                          {reason}
                        </motion.div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Breakdown grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attendance */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      📊 Subject-wise Attendance
                    </h5>
                    {reportData.attendance?.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No attendance data available</p>
                    ) : (
                      <div className="space-y-4">
                        {reportData.attendance?.map((a, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700 font-semibold text-sm truncate max-w-[70%]">{a.course_name}</span>
                              <span className={`text-xs font-bold ${a.rate < 75 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {a.rate}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${a.rate < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${a.rate}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Marks */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      📈 Subject-wise Performance (%)
                    </h5>
                    {reportData.marks?.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No marks data available</p>
                    ) : (
                      <div className="space-y-4">
                        {reportData.marks?.map((m, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700 font-semibold text-sm truncate max-w-[70%]">{m.course_name}</span>
                              <span className={`text-xs font-bold ${m.avg_score < 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {m.avg_score}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${m.avg_score < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${m.avg_score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center flex-shrink-0">
            <div className="text-slate-400 text-xs">
              Powered by Logistic Regression + Rule-based Fallback Engine
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md text-sm"
            >
              Close Assessment
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentRiskReport;
