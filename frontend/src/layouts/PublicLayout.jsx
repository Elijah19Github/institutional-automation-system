import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/useTheme';

const PublicLayout = () => {
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Courses', path: '/courses' },
        { name: 'Contact', path: '/contact' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Smart Campus OS Logo" className="w-12 h-12 object-contain" />
                            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                Smart OS
                            </span>
                        </div>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-sm font-medium transition-colors hover:text-primary ${
                                        location.pathname === link.path ? 'text-primary' : 'text-textSecondary'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setTheme(theme === 'light' ? 'dark' : (theme === 'dark' ? 'blue' : 'light'))}
                                className="p-2 rounded-full bg-secondary text-textPrimary hover:bg-secondary/80 transition-colors shadow-sm focus:outline-none"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'light' ? '🌙' : (theme === 'dark' ? '🌊' : '☀️')}
                            </button>
                            
                            <Link
                                to="/login"
                                className="hidden md:inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                            >
                                Sign In
                            </Link>

                            <Link
                                to="/register"
                                className="hidden md:inline-flex items-center justify-center px-6 py-2.5 border border-border text-sm font-medium rounded-xl text-textPrimary bg-surface hover:bg-secondary transition-all"
                            >
                                Register Now
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-border/50 bg-surface/80 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" alt="Smart Campus OS" className="w-8 h-8 object-contain" />
                                <span className="text-lg font-bold text-textPrimary">Smart Campus OS</span>
                            </div>
                            <p className="text-textSecondary text-sm mb-4 max-w-sm leading-relaxed">
                                The next-generation unified platform bridging academic excellence, automated admissions, and AI-driven institutional management.
                            </p>
                            <p className="text-textSecondary text-sm">
                                📍 Smart OS Tech Park, Bangalore, 560070
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-textPrimary mb-4 uppercase tracking-wider">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/" className="text-textSecondary hover:text-primary transition-colors">Home Landing</Link></li>
                                <li><Link to="/about" className="text-textSecondary hover:text-primary transition-colors">About Us</Link></li>
                                <li><Link to="/courses" className="text-textSecondary hover:text-primary transition-colors">Course Catalog</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-textPrimary mb-4 uppercase tracking-wider">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/register" className="text-textSecondary hover:text-primary transition-colors">Admissions Portal</Link></li>
                                <li><Link to="/contact" className="text-textSecondary hover:text-primary transition-colors">Contact Us</Link></li>
                                <li><Link to="/login" className="text-textSecondary hover:text-primary transition-colors">Staff Login</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-textSecondary text-sm">
                            © {new Date().getFullYear()} Smart Campus Institution. All rights reserved.
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <Link to="/legal" className="text-textSecondary hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link to="/legal" className="text-textSecondary hover:text-primary transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
