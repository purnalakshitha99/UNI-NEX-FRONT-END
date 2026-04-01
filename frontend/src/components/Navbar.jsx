import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();

  useEffect(() => {
    // Sync state on mount
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);

    // Listen for storage changes (for multiple tab/window sync)
    const handleStorageChange = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };

    // Listen for internal auth changes
    const handleAuthChange = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    navigate('/auth');
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <nav className="sticky top-0 z-50 bg-blue-700/80 backdrop-blur-md border-b border-blue-500/30 px-6 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-blue-700 font-extrabold text-xl">E</span>
          </div>
          <Link to="/" className="text-white text-2xl font-extrabold tracking-tight hover:text-blue-100 transition duration-300">
            EventManager
          </Link>
        </div>

        <div className="hidden md:flex gap-8 text-blue-50 font-medium">
          <Link to="/" className="hover:text-white transition-colors duration-300 font-semibold">Home</Link>
          <Link to="/events" className="hover:text-white transition-colors duration-300">Events</Link>
          {/* <Link to="/my-events" className="hover:text-white transition-colors duration-300">My Events</Link> */}
          <a href="#" className="hover:text-white transition-colors duration-300">Planning</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Services</a>
          <Link to="/create-event" className="hover:text-white transition-colors duration-300">Event Creation</Link>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={handleThemeToggle}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M4.5 12H2.25M21.75 12H19.5M5.636 5.636L4.045 4.045M19.955 19.955l-1.591-1.591M18.364 5.636l1.591-1.591M4.045 19.955l1.591-1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-blue-700 font-bold text-lg">{currentUser.user?.firstName?.charAt(0) || 'U'}</span>
                </div>
                <span className="text-white font-medium group-hover:text-blue-200 transition-colors hidden sm:inline">
                  {currentUser.user?.firstName || 'User'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-lg px-6 py-2.5 rounded-full font-bold transition-all duration-300"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
