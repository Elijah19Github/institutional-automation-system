import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${user.id}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && token) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-rose-500 font-bold bg-rose-50 rounded-2xl border border-rose-100 text-center">
      {error}
    </div>
  );

  if (!profileData) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">User Profile</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Institutional Identity Record</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Photo Placeholder */}
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-slate-50 border-8 border-white shadow-2xl flex items-center justify-center text-5xl md:text-7xl group ring-1 ring-slate-100">
             <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-300 font-bold overflow-hidden relative">
                <span className="group-hover:opacity-0 transition-opacity">
                   {profileData.role.toLowerCase() === 'student' ? '🧑‍🎓' : (profileData.role.toLowerCase() === 'faculty' ? '👨‍🏫' : '⚙️')}
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-4xl text-slate-400 bg-slate-100/80 font-black">
                   {(profileData.name || 'U').charAt(0).toUpperCase()}
                </span>
             </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block">Legal Full Name</label>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{profileData.name}</h2>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 block">Institutional Email</label>
              <p className="text-2xl font-bold text-indigo-600 border-b-2 border-indigo-100 inline-block pb-1">{profileData.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
              <span className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">
                {profileData.role}
              </span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 font-mono">
                ID: {profileData.system_id || 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-50/50 border border-slate-200 p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Department</h4>
            <p className="text-lg font-bold text-slate-800">{profileData.profile?.department || 'Unassigned'}</p>
         </div>
         <div className="bg-slate-50/50 border border-slate-200 p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registration No</h4>
            <p className="text-lg font-bold text-slate-800 font-mono">{profileData.profile?.enrollment_number || profileData.profile?.employee_id || 'PENDING'}</p>
         </div>
         <div className="bg-slate-50/50 border border-slate-200 p-6 rounded-3xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact Phone</h4>
            <p className="text-lg font-bold text-slate-800">{profileData.profile?.phone_number || 'N/A'}</p>
         </div>
      </div>
    </div>
  );
};

export default Profile;
