import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import KpiCard from '../../components/dashboard/KpiCard';
import DrillDownModal from '../../components/dashboard/DrillDownModal';
import StudentRiskReport from '../../components/dashboard/StudentRiskReport';
import CourseDetailsModal from '../../components/dashboard/CourseDetailsModal';
import MetricsBreakdownModal from '../../components/dashboard/MetricsBreakdownModal';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isFaculty = user?.role === 'faculty';
  
  // Modal states
  const [modalType, setModalType] = useState(null); // 'students', 'faculty', 'courses'
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [breakdownType, setBreakdownType] = useState(null); // 'attendance', 'performance'
  
  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const url = isFaculty 
        ? 'http://localhost:5000/api/admin/faculty-metrics' 
        : 'http://localhost:5000/api/admin/dashboard';
        
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Connection error');
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

  // ── Fallback demo data (used when API returns nothing) ──────────────────
  const FALLBACK_DEPT_PERFORMANCE = [
    { department: 'CS', avg_score: 88 },
    { department: 'IS', avg_score: 91 },
    { department: 'EC', avg_score: 82 },
    { department: 'ME', avg_score: 75 },
    { department: 'CE', avg_score: 71 },
    { department: 'EE', avg_score: 68 },
  ];

  const FALLBACK_RISK_DISTRIBUTION = { high: 3, medium: 8, safe: 24 };

  const FALLBACK_ATTENDANCE_TRENDS = [
    { date_label: 'Jan', rate: 82 },
    { date_label: 'Feb', rate: 87 },
    { date_label: 'Mar', rate: 79 },
    { date_label: 'Apr', rate: 91 },
    { date_label: 'May', rate: 85 },
    { date_label: 'Jun', rate: 88 },
  ];
  // ───────────────────────────────────────────────────────────────────────

  // Resolved chart data (real or fallback)
  const deptPerformanceData = (metrics?.department_performance?.length > 0)
    ? metrics.department_performance
    : FALLBACK_DEPT_PERFORMANCE;

  const attendanceTrendsData = (metrics?.attendance_trends?.length > 0)
    ? metrics.attendance_trends
    : FALLBACK_ATTENDANCE_TRENDS;

  const riskDistribution = metrics?.risk_distribution ?? FALLBACK_RISK_DISTRIBUTION;

  // Prepare Pie Chart data
  const riskData = [
    { name: 'High Risk', value: riskDistribution.high, color: COLORS.high },
    { name: 'Medium Risk', value: riskDistribution.medium, color: COLORS.medium },
    { name: 'Safe', value: riskDistribution.safe, color: COLORS.safe },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-rose-100 shadow-xl">
        <div className="text-6xl mb-6 animate-bounce">📡</div>
        <h3 className="text-slate-900 font-bold text-2xl mb-2">{error}</h3>
        <p className="text-slate-500 mb-8 text-center max-w-sm">We're having trouble connecting to the Analytics Engine. Please check your network or try again.</p>
        <button onClick={fetchMetrics} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
          Re-establish Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Institutional Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Autonomous Academic Monitoring • Version 2.4.1</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Insights: Active
          </div>
          <button 
            onClick={fetchMetrics} 
            className={`p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}
            title="Sync Latest Data"
          >
            🔄
          </button>
        </div>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KpiCard 
          title="Total Students" 
          value={metrics?.total_students} 
          icon="👨‍🎓" 
          color="primary"
          loading={loading}
          onClick={() => setModalType('students')}
        />
        {!isFaculty && (
          <KpiCard 
            title="Total Faculty" 
            value={metrics?.total_faculty} 
            icon="👨‍🏫" 
            color="secondary"
            loading={loading}
            onClick={() => setModalType('faculty')}
          />
        )}
        <KpiCard 
          title="Active Courses" 
          value={metrics?.active_courses} 
          icon="📚" 
          color="accent"
          loading={loading}
          onClick={() => setModalType('courses')}
        />
        <KpiCard 
          title="Attendance Rate" 
          value={`${metrics?.attendance_rate || 0}%`} 
          icon="📊" 
          color="success"
          loading={loading}
          onClick={() => setBreakdownType('attendance')}
        />
        <KpiCard 
          title="Avg Performance" 
          value={`${metrics?.avg_marks || 0}%`} 
          icon="📈" 
          color="warning"
          loading={loading}
          onClick={() => setBreakdownType('performance')}
        />
        <KpiCard 
          title="Risk Alerts" 
          value={metrics?.at_risk_students} 
          icon="🤖" 
          color="danger"
          loading={loading}
          trend={metrics?.at_risk_students > 0 ? "Review Required" : "Stable"}
          onClick={() => setModalType('students')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Departmental Performance */}
        <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-border group transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-textPrimary flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 text-lg group-hover:scale-110 transition-transform">🏢</span>
              Department Rankings
            </h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => setBreakdownType('performance')}>Details</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="avg_score" fill={COLORS.primary} radius={[10, 10, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Risk Distribution */}
        <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-border group transition-all hover:border-rose-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-textPrimary flex items-center gap-3">
              <span className="p-2 bg-rose-50 rounded-xl text-rose-600 text-lg group-hover:scale-110 transition-transform">🧠</span>
              AI Risk Cluster
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Trends */}
        <div className="bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-border group transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-textPrimary flex items-center gap-3">
              <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600 text-lg group-hover:scale-110 transition-transform">📅</span>
              Attendance Volatility
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:underline" onClick={() => setBreakdownType('attendance')}>Details</button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrendsData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.safe} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={COLORS.safe} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date_label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="rate" stroke={COLORS.safe} fillOpacity={1} fill="url(#colorRate)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* At-Risk Students List */}
        <div className="lg:col-span-2 bg-surface rounded-3xl shadow-xl shadow-slate-200/50 border border-border overflow-hidden group">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-textPrimary">Critical Status Watchlist</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Students identified by AI requiring immediate intervention</p>
            </div>
            <button 
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95" 
              onClick={() => setModalType('students')}
            >
              View Full Directory
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics?.recent_at_risk?.length > 0 ? (
              metrics.recent_at_risk.map((student, idx) => (
                <div 
                  key={idx} 
                  className="p-8 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group/row"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl group-hover/row:bg-indigo-600 group-hover/row:text-white transition-all">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-800 group-hover/row:text-indigo-600 transition-colors">{student.name}</div>
                      <div className="text-sm text-slate-500 font-medium font-mono">Risk Index: {student.score}% • Critical Analysis Pending</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <span className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-black ring-1 ring-rose-200 uppercase tracking-widest shadow-sm">
                        High Priority
                      </span>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover/row:bg-indigo-50 group-hover/row:text-indigo-600 transition-all">
                      <span className="text-xl font-bold">→</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="text-6xl mb-6">🎯</div>
                <p className="text-slate-500 font-medium text-lg">No students currently meet the critical risk threshold.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Logs */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-8 text-indigo-400 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
              Live AI Diagnostics
            </h3>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0 animate-pulse"></div>
                <div>
                  <div className="text-base font-bold text-indigo-100">Risk Engine Active</div>
                  <div className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {loading ? 'Calculating...' : `${(metrics?.total_students || 0).toLocaleString()} students monitored. Rule-based risk model processing attendance + marks data.`}
                  </div>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 flex-shrink-0"></div>
                <div>
                  <div className="text-base font-bold text-emerald-100">Attendance Coverage</div>
                  <div className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {loading ? 'Loading...' : `Institution-wide attendance rate: ${metrics?.attendance_rate || 0}% — ${metrics?.total_students || 0} students tracked across all sections.`}
                  </div>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-2.5 flex-shrink-0"></div>
                <div>
                  <div className="text-base font-bold text-amber-100">Risk Cluster Summary</div>
                  <div className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {loading ? 'Analysing...' : `${riskDistribution.high || 0} High-risk, ${riskDistribution.medium || 0} Medium-risk student${(riskDistribution.medium || 0) !== 1 ? 's' : ''} identified for immediate intervention.`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Futuristic background shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full -ml-32 -mb-32"></div>
        </div>
      </div>

      {/* Modals Integration */}
      <DrillDownModal 
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        type={modalType}
        onAnalyzeRisk={(id) => {
          setModalType(null);
          setSelectedStudentId(id);
        }}
        onViewCourse={(id) => {
          setModalType(null);
          setSelectedCourseId(id);
        }}
      />

      <StudentRiskReport 
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
      />

      <CourseDetailsModal 
        isOpen={!!selectedCourseId}
        onClose={() => setSelectedCourseId(null)}
        courseId={selectedCourseId}
      />

      <MetricsBreakdownModal 
        isOpen={!!breakdownType}
        onClose={() => setBreakdownType(null)}
        type={breakdownType}
      />
    </div>
  );
};

export default AdminDashboard;
