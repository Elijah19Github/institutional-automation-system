import React, { useState, useEffect } from 'react';
import axios from 'axios';
import KpiCard from '../../components/dashboard/KpiCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FacultyDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/admin/faculty-metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching faculty metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return <div className="h-full flex items-center justify-center"><div className="animate-spin text-4xl">⏳</div></div>;
  }

  if (!metrics) return <div className="text-center p-8 text-rose-500 font-bold">Failed to load dashboard</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Faculty Portal <span className="opacity-50">|</span> {user.name}</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Manage your classes, track performance, and intervene early.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/attendance')} className="px-5 py-2.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors">
              Take Attendance
           </button>
           <button onClick={() => navigate('/quiz-creator')} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
              Create Quiz
           </button>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Students Handled" 
          value={metrics.total_students} 
          icon="👨‍🎓" 
          color="primary"
        />
        <KpiCard 
          title="Active Subjects" 
          value={metrics.active_courses} 
          icon="📚" 
          color="secondary"
        />
        <KpiCard 
          title="Avg Class Attendance" 
          value={`${metrics.attendance_rate}%`} 
          icon="📅" 
          color={metrics.attendance_rate >= 75 ? 'success' : 'danger'}
        />
        <KpiCard 
          title="Avg Class Performance" 
          value={`${metrics.avg_marks}%`} 
          icon="📊" 
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* LEFT COLUMN: SCHEDULE & QUICK ACTIONS */}
         <div className="space-y-8 lg:col-span-1">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">📅 Quick Access</h3>
                <div className="space-y-3">
                   <button onClick={() => navigate('/marks-entry')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all font-medium text-slate-700 flex justify-between items-center group">
                      Enter Subject Marks
                      <span className="text-slate-300 group-hover:text-indigo-500">→</span>
                   </button>
                   <button onClick={() => navigate('/quiz-library')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all font-medium text-slate-700 flex justify-between items-center group">
                      Manage Quizzes
                      <span className="text-slate-300 group-hover:text-indigo-500">→</span>
                   </button>
                   <button onClick={() => navigate('/overall-marks')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all font-medium text-slate-700 flex justify-between items-center group">
                      View Overal Results
                      <span className="text-slate-300 group-hover:text-indigo-500">→</span>
                   </button>
                </div>
             </div>

             {/* Dynamic Risk Summary for assigned sections */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl text-white">
                <h3 className="font-bold text-indigo-400 text-lg mb-4">Risk Distribution</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> <span className="font-medium">High Risk</span></div>
                     <span className="font-bold text-xl">{metrics.risk_distribution.high}</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> <span className="font-medium">Medium Risk</span></div>
                     <span className="font-bold text-xl">{metrics.risk_distribution.medium}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> <span className="font-medium">Low Risk (Safe)</span></div>
                     <span className="font-bold text-xl">{metrics.risk_distribution.safe}</span>
                   </div>
                </div>
             </div>
         </div>

         {/* RIGHT COLUMN: AT RISK STUDENTS (Simulated or Real from API if added) */}
         <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">⚠️ At-Risk Students in Your Classes</h3>
                 <span className="text-xs font-bold px-3 py-1 bg-rose-100 text-rose-600 rounded-full">{metrics.at_risk_students} Total</span>
               </div>
               
               <div className="space-y-4">
                  {/* For now, utilizing the global recent_at_risk since faculty endpoint doesn't return full list, but filtered would be better later. We check if array exists. */}
                  {metrics.recent_at_risk && metrics.recent_at_risk.length > 0 ? (
                     metrics.recent_at_risk.map((student, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex justify-center items-center font-bold">
                                 {student.name.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800">{student.name}</h4>
                                 <p className="text-xs text-slate-500 font-medium font-mono mt-0.5">Risk Score Index: {student.score}%</p>
                              </div>
                           </div>
                           <button className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
                              View Profile
                           </button>
                        </div>
                     ))
                  ) : (
                     <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="font-medium text-center">No high risk students currently detected in your sessions.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

      </div>

    </div>
  );
};

export default FacultyDashboard;
