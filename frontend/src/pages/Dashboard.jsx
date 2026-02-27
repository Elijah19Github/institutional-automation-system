import React from 'react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Students Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-indigo-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Students</p>
              <h3 className="text-4xl font-bold text-slate-100 mt-2">1,248</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl">
              🎓
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-emerald-400">
            <span>↑ 12% from last year</span>
          </div>
        </div>

        {/* Average Attendance Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-cyan-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Avg Attendance</p>
              <h3 className="text-4xl font-bold text-slate-100 mt-2">84.5%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl">
              📊
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-rose-400">
            <span>↓ 2.1% from last month</span>
          </div>
        </div>

        {/* High Risk Alerts Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-rose-500/50 transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>
          <div className="relative flex items-center justify-between z-10">
            <div>
              <p className="text-rose-400/80 text-sm font-medium">High Risk Alerts</p>
              <h3 className="text-4xl font-bold text-rose-400 mt-2">42</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-2xl animate-pulse">
              ⚠️
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-sm font-medium text-slate-400 z-10">
            <span>Requires immediate action</span>
          </div>
        </div>
      </div>

      {/* Middle Section (Charts Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Attendance Trends</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
            [ Chart Placeholder ]
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Academic Risk Detections</h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-700/30 p-4 rounded-xl flex items-center justify-between hover:bg-slate-700/50 transition-colors cursor-pointer border border-slate-700/30">
                <div>
                  <p className="font-medium text-slate-200">Johnathan Doe {i}</p>
                  <p className="text-xs text-slate-400 mt-1">CS Dept • 5th Sem</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20">
                    8{i}% Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
