import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    // Responsive listener
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const displayUser = user || { name: 'User', role: '...', email: '' };

    const handleLogout = () => {
        logout();
    };

    const sidebarLinks = [
        { to: "/dashboard", label: "Dashboard", icon: "📊", roles: ['admin', 'supadmin', 'faculty', 'student'] },
        { to: "/attendance", label: "Attendance", icon: "📅", roles: ['faculty', 'student'] },
        { to: "/assessments", label: "Assessments", icon: "📝", roles: ['student', 'faculty', 'admin', 'supadmin'] },
        { to: "/my-marks", label: "My Marks", icon: "📊", roles: ['student'] },
        { to: "/admissions", label: "Admissions", icon: "🎓", roles: ['admin', 'supadmin'] },
        { to: "/academic", label: "Academic Setup", icon: "🏛️", roles: ['admin', 'supadmin'] },
        { to: "/admin/students", label: "Student Records", icon: "👥", roles: ['admin', 'supadmin'] },
        { to: "/admin/faculty", label: "Faculty Management", icon: "👨‍🏫", roles: ['admin', 'supadmin'] },
        { to: "/admin/attendance", label: "Attendance Governance", icon: "📅", roles: ['admin', 'supadmin'] },
        { to: "/admin/marks-governance", label: "Marks Governance", icon: "🏆", roles: ['admin', 'supadmin'] },
        { to: "/marks-entry", label: "Marks Entry", icon: "✍️", roles: ['faculty'] },
        { to: "/quiz-creator", label: "Build Quiz", icon: "✨", roles: ['faculty', 'admin', 'supadmin'], highlight: true },
        { to: "/quiz-library", label: "Manage Quizzes", icon: "📚", roles: ['faculty', 'admin', 'supadmin'], highlight: true },
        { to: "/profile", label: "My Profile", icon: "👤", roles: ['admin', 'supadmin', 'faculty', 'student'] }
    ];

    const filteredLinks = sidebarLinks.filter(link => link.roles.includes(user?.role?.toLowerCase() || 'student'));

    return (
        <div className="flex h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-surface transition-all duration-300 ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 lg:w-20 -translate-x-full lg:translate-x-0'} border-r border-border flex flex-col shadow-2xl lg:shadow-xl`}>
                <div className="h-16 flex items-center justify-between border-b border-border bg-surface px-4 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-max">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        {(isSidebarOpen || window.innerWidth < 1024) && (
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 tracking-widest whitespace-nowrap">
                                SMART OS
                            </span>
                        )}
                    </div>
                    {window.innerWidth < 1024 && (
                        <button onClick={() => setIsSidebarOpen(false)} className="text-textSecondary p-1 hover:bg-secondary rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    )}
                </div>
                
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {filteredLinks.map(link => (
                        <Link 
                            key={link.to}
                            to={link.to} 
                            onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-all group ${
                                location.pathname === link.to 
                                ? (link.highlight ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-secondary text-primary font-bold') 
                                : 'hover:bg-secondary/50 text-textSecondary hover:text-primary font-medium'
                            }`}
                        >
                            <span className={`text-xl transition-transform group-hover:scale-110 ${location.pathname === link.to && link.highlight ? 'grayscale-0' : ''}`}>{link.icon}</span>
                            {(isSidebarOpen || window.innerWidth < 1024) && <span className="text-sm whitespace-nowrap overflow-hidden transition-all duration-300">{link.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User Info at Bottom (Compact) */}
                {(isSidebarOpen || window.innerWidth < 1024) && (
                    <div className="p-4 border-t border-border bg-secondary/10 mx-2 mb-4 rounded-2xl">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-black text-xs">
                                {displayUser.name.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-textPrimary truncate">{displayUser.name}</p>
                                <p className="text-[10px] text-textSecondary uppercase tracking-tighter">{displayUser.role}</p>
                            </div>
                         </div>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Navbar */}
                <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-textSecondary hover:text-primary transition-colors p-2 rounded-xl hover:bg-secondary focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h2 className="hidden md:block text-sm font-black text-slate-800 tracking-tight uppercase">
                            {filteredLinks.find(l => l.to === location.pathname)?.label || 'Institutional Identity'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                        <button 
                            onClick={() => setTheme(theme === 'light' ? 'dark' : (theme === 'dark' ? 'blue' : 'light'))} 
                            className="p-2.5 rounded-xl bg-secondary text-textPrimary hover:bg-secondary/80 transition-colors shadow-sm"
                        >
                            {theme === 'light' ? '🌙' : (theme === 'dark' ? '🌊' : '☀️')}
                        </button>
                        
                        <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

                        <button
                            onClick={handleLogout}
                            className="px-3 md:px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center gap-2"
                        >
                            <span className="hidden sm:inline">Logout</span>
                            <span>🚪</span>
                        </button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-background scroll-smooth">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
