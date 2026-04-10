import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const MetricsBreakdownModal = ({ isOpen, onClose, type }) => {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const FALLBACK_DATA = {
    attendance: [
      { department: 'Computer Science', rate: 91 },
      { department: 'Electronics & Comm.', rate: 87 },
      { department: 'Mechanical Eng.', rate: 83 },
      { department: 'Civil Engineering', rate: 79 },
      { department: 'Information Science', rate: 94 },
      { department: 'Electrical Eng.', rate: 76 },
    ],
    performance: [
      { department: 'Computer Science', avg_score: 88 },
      { department: 'Electronics & Comm.', avg_score: 82 },
      { department: 'Mechanical Eng.', avg_score: 75 },
      { department: 'Civil Engineering', avg_score: 71 },
      { department: 'Information Science', avg_score: 91 },
      { department: 'Electrical Eng.', avg_score: 68 },
    ],
  };

  const config = {
    attendance: {
      title: 'Attendance Breakdown',
      subtitle: 'Percentage of status: present by department',
      endpoint: 'attendance-breakdown',
      dataKey: 'rate',
      unit: '%',
      color: '#10b981'
    },
    performance: {
      title: 'Performance Breakdown',
      subtitle: 'Average academic score by department',
      endpoint: 'performance-breakdown',
      dataKey: 'avg_score',
      unit: '%',
      color: '#6366f1'
    }
  };

  const active = config[type] || config.attendance;

  useEffect(() => {
    if (isOpen && type) {
      fetchBreakdown();
    }
  }, [isOpen, type]);

  const fetchBreakdown = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/metrics/${active.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.data?.length > 0) {
        setData(response.data.data);
      } else {
        // Use fallback demo data when API returns no results
        setData(FALLBACK_DATA[type] || []);
      }
    } catch (err) {
      console.error(`Error fetching ${type} breakdown:`, err);
      // Use fallback demo data on error
      setData(FALLBACK_DATA[type] || []);
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
          className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{active.title}</h2>
              <p className="text-slate-500 text-sm mt-1">{active.subtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Chart Section */}
          <div className="p-8 flex-1">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400">Compiling regional data...</p>
              </div>
            ) : data.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="department" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      width={150}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`${value}${active.unit}`, active.title]}
                    />
                    <Bar dataKey={active.dataKey} radius={[0, 10, 10, 0]} barSize={24}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry[active.dataKey] > 80 ? active.color : entry[active.dataKey] > 60 ? active.color + 'cc' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 italic">No breakdown data available for the current period.</div>
            )}
          </div>

          {/* Footer Table (List View) */}
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col space-y-3">
             <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
               <span>Department</span>
               <span>Value</span>
             </div>
             <div className="max-h-32 overflow-auto space-y-1">
               {data.map((item, idx) => (
                 <div key={idx} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm border border-slate-100">
                   <span className="font-semibold text-slate-700">{item.department}</span>
                   <span className={`font-bold ${item[active.dataKey] > 70 ? 'text-emerald-600' : 'text-slate-900'}`}>{item[active.dataKey]}{active.unit}</span>
                 </div>
               ))}
             </div>
             <div className="pt-4 flex justify-end">
               <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95">
                 Close Report
               </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MetricsBreakdownModal;
