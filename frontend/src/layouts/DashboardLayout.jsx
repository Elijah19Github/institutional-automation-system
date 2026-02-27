import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { user, logout } = useAuth(); // Native Auth Context Integration
    const location = useLocation();

    // Fallback if context is mysteriously missing user temporarily before redirect kick
    const displayUser = user || { name: 'User', role: '...', email: '' };

    const handleLogout = () => {
        logout(); // Calls navigate('/login') and purges token internally
    };

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Sidebar */}
            <aside className={`bg-[#1e293b] transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} border-r border-slate-700/50 flex flex-col shadow-xl z-10`}>
                <div className="h-16 flex items-center justify-center border-b border-slate-700/50 bg-[#1e293b]">
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-widest cursor-pointer whitespace-nowrap overflow-hidden">
                        {isSidebarOpen ? 'SMART OS' : 'OS'}
                    </span>
                </div>
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                    <Link to="/dashboard" className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-colors ${location.pathname === '/dashboard' ? 'bg-slate-700/80 text-indigo-300' : 'hover:bg-slate-700/50'} `}>
                        <span className="text-xl">📊</span>
                        {isSidebarOpen && <span>Dashboard</span>}
                    </Link>
                    <Link to="/attendance" className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-colors ${location.pathname === '/attendance' ? 'bg-slate-700/80 text-indigo-300' : 'hover:bg-slate-700/50'} `}>
                        <span className="text-xl">📅</span>
                        {isSidebarOpen && <span>Attendance</span>}
                    </Link>
                    {user?.role === 'admin' && (
                        <>
                            <Link to="/admissions" className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-colors ${location.pathname === '/admissions' ? 'bg-slate-700/80 text-indigo-300' : 'hover:bg-slate-700/50'} `}>
                                <span className="text-xl">🎓</span>
                                {isSidebarOpen && <span>Admissions</span>}
                            </Link>
                            <Link to="/academic" className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-colors ${location.pathname === '/academic' ? 'bg-slate-700/80 text-indigo-300' : 'hover:bg-slate-700/50'} `}>
                                <span className="text-xl">🏛️</span>
                                {isSidebarOpen && <span>Academic Setup</span>}
                            </Link>
                        </>
                    )}
                    <Link to="/ai-risk" className={`flex items-center space-x-3 py-2.5 px-4 rounded-lg transition-colors ${location.pathname === '/ai-risk' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-500/5 text-indigo-400/80 hover:bg-indigo-500/20 border border-transparent'} `}>
                        <span className="text-xl">🤖</span>
                        {isSidebarOpen && <span className="font-medium whitespace-nowrap overflow-hidden">AI Risk Engine</span>}
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Navbar */}
                <header className="h-16 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-20">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-slate-800 focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div className="flex items-center space-x-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-200">{displayUser.name}</p>
                            <p className="text-xs text-indigo-400 capitalize">{displayUser.role?.toLowerCase()}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] cursor-pointer shadow-lg shadow-indigo-500/20">
                                <div className="w-full h-full bg-[#1e293b] rounded-full flex items-center justify-center font-bold text-slate-200 text-xs text-center border-2 border-transparent">
                                    {(displayUser.name?.charAt(0) || 'U').toUpperCase()}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-xs font-medium text-rose-400 border border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-y-auto w-full p-6 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-[#0f172a]">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
