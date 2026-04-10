import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DrillDownModal = ({ isOpen, onClose, type, onAnalyzeRisk, onViewCourse }) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  const departments = ['Computer Science', 'Electronic Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Admin'];

  const titles = {
    students: 'Student Directory',
    faculty: 'Faculty Roster',
    courses: 'Course Catalog'
  };

  useEffect(() => {
    if (isOpen && type) {
      fetchData();
    } else {
      setData([]);
      setFilteredData([]);
      setSearchTerm('');
      setSelectedDept('');
    }
  }, [isOpen, type, selectedDept]);

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          search: searchTerm,
          department: selectedDept
        }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Local filtering for search (if backend search is not enough or to be reactive)
  useEffect(() => {
    if (data) {
      setFilteredData(data.filter(item => {
        const searchStr = searchTerm.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(searchStr)) ||
          (item.regno && item.regno.toLowerCase().includes(searchStr)) ||
          (item.employee_id && item.employee_id.toLowerCase().includes(searchStr)) ||
          (item.department && item.department.toLowerCase().includes(searchStr))
        );
      }));
    }
  }, [searchTerm, data]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{titles[type] || 'Details'}</h2>
              <p className="text-slate-500 text-sm mt-1">{filteredData.length} active records</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search by name, ID, or info..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-700 focus:ring-2 focus:ring-primary/50 shadow-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 animate-pulse">Updating directory...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-slate-400 text-sm uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Primary Info</th>
                    <th className="px-6 py-3 font-semibold">Department</th>
                    {type === 'students' && <th className="px-6 py-3 font-semibold text-center">Academic Status</th>}
                    {type === 'courses' && <th className="px-6 py-3 font-semibold text-center">Credits</th>}
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="group bg-white hover:bg-slate-50 border border-slate-100 transition-all rounded-xl shadow-sm">
                      <td className="px-6 py-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                            {item.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{item.regno || item.employee_id || 'ID N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 text-sm">{item.department || 'General'}</span>
                      </td>
                      {type === 'students' && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.attendance_rate >= 75 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              Att: {item.attendance_rate}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Score: {item.avg_marks}%</span>
                          </div>
                        </td>
                      )}
                      {type === 'courses' && (
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-900">{item.credits} Units</span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right rounded-r-xl">
                        {type === 'students' ? (
                          <button 
                            onClick={() => onAnalyzeRisk(item.id)}
                            className="text-danger hover:text-white bg-danger/10 hover:bg-danger px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Analyze Risk
                          </button>
                        ) : type === 'courses' ? (
                          <button 
                            onClick={() => onViewCourse(item.id)}
                            className="text-primary hover:text-white bg-primary/10 hover:bg-primary px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Course Details
                          </button>
                        ) : (
                          <button className="text-slate-400 hover:text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                            View Profile
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <span className="text-4xl mb-4">📭</span>
                <p>No matching records found.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-right">
            <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all shadow-sm">
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DrillDownModal;
