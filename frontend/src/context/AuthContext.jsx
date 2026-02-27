import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('sc_token') || null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initializeAuth = () => {
            const storedToken = localStorage.getItem('sc_token');
            const storedUser = localStorage.getItem('sc_user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                    logout();
                }
            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (userData, jwtToken) => {
        localStorage.setItem('sc_token', jwtToken);
        localStorage.setItem('sc_user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
        navigate('/dashboard');
    };

    const logout = () => {
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
