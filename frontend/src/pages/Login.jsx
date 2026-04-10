import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validate } from '../utils/validation';
import '../styles/login.css';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        // Basic check for empty fields (required is already set on input, but good for UX)
        if (!email || !password) {
            setError('Please provide all credentials.');
            return;
        }

        const passError = validate('password', password);
        if (passError) {
            setError(passError);
            return;
        }

        setLoading(true);

    try {
      // Note: In local dev, configure Vite proxy or use absolute URL if CORS is not an issue
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success || data.token) {
        // Delegate state updates and routing to the Context
        login(data.user, data.token);
      } else {
        setError(data.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err) {
      setError('Google Login failed: ' + err.message);
    }
  };

  return (
    <div className="login-wrapper">

      <Link to="/" className="back-button group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Home
      </Link>

      {/* Background Decorations */}
      <div className="bg-decoration-primary"></div>
      <div className="bg-decoration-accent"></div>

      <div className="login-card">

        <div className="text-center mb-8">
          <div className="logo-container">
            <img src="/logo.png" alt="Smart Campus OS Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="login-title">Smart Campus OS</h2>
          <p className="text-textSecondary mt-2 text-sm">Secure Portal Authentication</p>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="input-label">Official Email ID or RegNo</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="name@campus.edu or 26MCA01"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="input-label">Password</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn group"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : 'Sign In to Portal'}
            </span>
            {!loading && <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>}
          </button>

          <div className="divider-container">
            <div className="divider-line"></div>
            <span className="text-textSecondary text-sm font-medium">OR</span>
            <div className="divider-line"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="google-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="text-center mt-6">
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
          </div>

          <p className="text-center text-xs text-textSecondary mt-6 pb-2">
            Institutional Access Only. Monitored by AI Risk Engine.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
