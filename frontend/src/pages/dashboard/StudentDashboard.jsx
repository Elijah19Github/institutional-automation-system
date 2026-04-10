import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import KpiCard from '../../components/dashboard/KpiCard';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [quizzes, setQuizzes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudentData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [dashRes, quizRes] = await Promise.all([
        API.get('/student-dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        API.get('/quiz/student/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (dashRes.data.success) {
        setMetrics(dashRes.data.data);
      }
      if (quizRes.data.success) {
        setQuizzes(quizRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching student dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    high: '#f43f5e',   // rose-500
    medium: '#f59e0b', // amber-500
    safe: '#10b981',   // emerald-500
    primary: '#6366f1', // indigo-500
    secondary: '#8b5cf6' // violet-500
  };

  const pieColors = ['#10b981', '#f43f5e']; // Present, Absent

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="animate-spin text-4xl">⏳</div></div>;
  }

  if (!metrics) return <div className="text-center p-8 text-rose-500 font-bold">Failed to load dashboard</div>;

  const riskLevel = metrics.risk?.risk_level || 'LOW';
  const isHighRisk = riskLevel === 'HIGH';
  const riskColor = riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-700 border-rose-200' : riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Here's your academic summary for the current semester.</p>
        </div>
      </header>

      {/* PROFILE INCOMPLETE WARNING */}
      {metrics.is_profile_incomplete && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
                <div className="text-4xl">🚧</div>
                <div>
                    <h3 className="text-xl font-bold text-amber-900">Registration Incomplete</h3>
                    <p className="text-amber-700 font-medium">Your student profile hasn't been fully set up by the administration. You can still see dummy analytics for now.</p>
                </div>
            </div>
            <div className="px-6 py-3 bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-200">
                PENDING SETUP
            </div>
        </div>
      )}

      {/* AI RISK ALERT PANEL */}
      {isHighRisk && (
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-3xl p-6 shadow-xl shadow-rose-200 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-black">CRITICAL ACADEMIC RISK ALERT</h3>
              <p className="opacity-90 font-medium">You are currently at HIGH risk due to poor attendance or academic performance.</p>
            </div>
          </div>
          <button className="px-6 py-2 bg-white text-rose-600 font-bold rounded-xl shadow-sm hover:scale-105 transition-transform" onClick={() => navigate('/assessments')}>
            Take Immediate Action
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Attendance Rate" 
          value={`${metrics.attendance_rate}%`} 
          icon="📅" 
          color={metrics.attendance_rate >= 75 ? 'success' : 'danger'}
        />
        <KpiCard 
          title="Average Marks" 
          value={`${metrics.avg_marks}%`} 
          icon="📊" 
          color="primary"
        />
        <div className={`p-6 rounded-3xl border-2 shadow-sm flex items-center gap-4 ${riskColor}`}>
          <div className="text-4xl bg-white p-3 rounded-2xl shadow-sm">🧠</div>
          <div>
            <div className="text-sm font-bold opacity-80 uppercase tracking-wider">AI Risk Assessment</div>
            <div className="text-3xl font-black">{riskLevel} RISK</div>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Performance Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">📈</span>
            Performance Over Time
          </h3>
          <div className="h-[280px]">
            {metrics.marks_over_time?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.marks_over_time}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date_label" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="score" stroke={COLORS.primary} strokeWidth={4} dot={{strokeWidth: 4, r: 4}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 font-medium">No performance data yet.</div>
            )}
          </div>
        </div>

        {/* Attendance Pie Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">pie</span>
            Attendance Breakdown
          </h3>
          <div className="h-[280px]">
             {metrics.attendance_distribution.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.attendance_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {metrics.attendance_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-medium">No attendance recorded.</div>
             )}
          </div>
        </div>
        
        {/* Subject wise performance block */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-secondary/10 text-secondary rounded-lg">📊</span>
            Subject-wise Performance
          </h3>
          <div className="h-[250px]">
            {metrics.subject_performance?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={metrics.subject_performance} layout="vertical" margin={{ left: 50 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                   <YAxis type="category" dataKey="subject" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} width={120} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                   <Bar dataKey="avg_score" fill={COLORS.secondary} radius={[0, 8, 8, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-400 font-medium">No marks recorded yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* LOWER SECTION: QUIZZES AND NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quizzes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">🧪 My Assessments</h3>
             <button onClick={() => navigate('/assessments')} className="text-indigo-600 font-bold text-sm hover:underline">View All</button>
           </div>
           
           <div className="space-y-4">
              {quizzes?.available?.length > 0 ? (
                 quizzes.available.slice(0,3).map(q => (
                    <div key={q.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                       <div>
                         <h4 className="font-bold text-indigo-900">{q.title}</h4>
                         <p className="text-sm text-indigo-600/80 font-medium mt-1">{q.duration_minutes} mins • {q.total_marks} Marks</p>
                       </div>
                       <button onClick={() => navigate('/assessments')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow hover:scale-105 active:scale-95 transition-all">Start</button>
                    </div>
                 ))
              ) : (
                 <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 font-medium">No pending assessments.</div>
              )}
           </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-6">🔔 Recent Alerts</h3>
            <div className="space-y-4">
              {metrics.notifications?.length > 0 ? (
                 metrics.notifications.map((n, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                       <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${n.risk_level === 'HIGH' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                       <div>
                          <p className="text-slate-800 font-medium">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-500 font-medium">You're all caught up!</div>
              )}
            </div>
        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
