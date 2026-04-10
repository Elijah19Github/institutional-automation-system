import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('sc_token') || null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            // 1. Check LocalStorage for custom backend session
            const storedToken = localStorage.getItem('sc_token');
            const storedUser = localStorage.getItem('sc_user');

            if (storedToken && storedUser) {
                try {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                }
            } else {
                // 2. Check Supabase for OAuth session (Google)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setToken(session.access_token);
                    setUser({
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.user_metadata.full_name || session.user.email,
                        role: 'STUDENT', // Default for social auth if not mapped
                        isSupabase: true
                    });
                }
            }
            setLoading(false);
        };

        initializeAuth();

        // Listen for Supabase Auth changes (Google Login/Logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setToken(session.access_token);
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata.full_name || session.user.email,
                    role: 'STUDENT',
                    isSupabase: true
                });
                // If it's the first time landing after OAuth, navigate to dashboard
                if (window.location.pathname === '/login') {
                    navigate('/dashboard');
                }
            } else if (!localStorage.getItem('sc_token')) {
                // Only clear if there's no custom backend token either
                setUser(null);
                setToken(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const login = (userData, jwtToken) => {
        localStorage.setItem('sc_token', jwtToken);
        localStorage.setItem('sc_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        navigate('/dashboard');
    };

    const logout = async () => {
        // Clear Supabase session if exists
        await supabase.auth.signOut();
        
        localStorage.removeItem('sc_token');
        localStorage.removeItem('sc_user');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
