import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({
          type: 'success',
          message: data.message,
          link: data.resetLink // Display mock dev link natively
        });
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to process request.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please ensure the server is running.' });
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight mb-3">Reset Password</h2>
          <p className="text-textSecondary leading-relaxed px-4">
            Enter the email address associated with your account, and we'll securely route a reset configuration link.
          </p>
        </div>

        {status && status.type === 'error' && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm font-medium">
            {status.message}
          </div>
        )}

        {status && status.type === 'success' && (
           <div className="mb-6 p-5 bg-green-500/10 border border-green-500/30 rounded-xl space-y-3">
             <div className="text-green-600 font-semibold">{status.message}</div>
             <div className="text-xs text-textSecondary px-3 py-2 bg-surface rounded-lg border border-border overflow-x-auto break-all font-mono shadow-inner select-all">
               {status.link}
             </div>
             <p className="text-xs text-green-600/80 font-medium">✨ Click or copy the secure link above to proceed.</p>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-textPrimary mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@campus.edu"
              className="w-full px-5 py-4 bg-background/50 border border-border/60 rounded-xl text-foreground placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium shadow-sm backdrop-blur-sm"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || status?.type === 'success'}
            className="w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-2 relative overflow-hidden group"
          >
            <span className="relative z-10">{loading ? 'Processing Protocol...' : 'Dispatch Reset Link'}</span>
            {!loading && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center relative z-10 text-sm font-medium">
          <span className="text-textSecondary">Remembered your password? </span>
          <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
