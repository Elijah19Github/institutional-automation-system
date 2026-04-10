import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to authorize reset.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] select-none pointer-events-none left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] select-none pointer-events-none right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply"></div>

      <div className="w-full max-w-lg mx-4 z-10 p-8 sm:p-12 relative overflow-hidden rounded-[2rem] border border-border/50 bg-surface/80 backdrop-blur-xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6 shadow-inner border border-primary/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight mb-3">Create New Password</h2>
          <p className="text-textSecondary leading-relaxed px-4">
            Your identity has been successfully verified. Please securely enter a new password below.
          </p>
        </div>

        {status && status.type === 'error' && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 font-semibold text-rose-500 rounded-xl text-sm">
            {status.message}
          </div>
        )}

        {status && status.type === 'success' ? (
          <div className="text-center py-6 relative z-10">
            <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 text-4xl border border-green-500/20 shadow-inner">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-textPrimary mb-2">Reset Successful!</h3>
            <p className="text-textSecondary mb-8 font-medium">Your credentials have been updated.</p>
            <Link to="/login" className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
              Login Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-1.5 ml-1">New Password</label>
              <input
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-background/50 border border-border/60 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium shadow-sm backdrop-blur-sm tracking-widest"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-textPrimary mb-1.5 ml-1">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-background/50 border border-border/60 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium shadow-sm backdrop-blur-sm tracking-widest"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? 'Securing Account...' : 'Confirm New Password'}</span>
              {!loading && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
