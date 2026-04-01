import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

const AdminSidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        AuthService.logout();
        navigate('/auth');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Manage Users' },
        { path: '/admin/events', icon: '📅', label: 'All Events' },
        { path: '/admin/payment-slips', icon: '🧾', label: 'Payment Slips' },
        { path: '/admin/event-bookings', icon: '📋', label: 'Event Bookings' },
        { path: '/admin/attendance', icon: '📷', label: 'Attendance Scan' },
        { path: '/admin/announcements', icon: '📢', label: 'Announcements' },
        { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0f172a] text-slate-300 flex flex-col z-50 border-r border-slate-800 shadow-2xl">
            {/* Logo area */}
            <div className="p-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <span className="text-white font-black text-xl italic">A</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-white text-lg font-black tracking-tight leading-none">Admin</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Control Suite</span>
                </div>
            </div>

            {/* Navigation Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
                            ${isActive 
                                ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' 
                                : 'hover:bg-slate-800/50 hover:text-white border border-transparent'}
                        `}
                    >
                        <span className="text-xl group-hover:scale-125 transition-transform">{item.icon}</span>
                        <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        {item.path === '/admin/dashboard' && (
                            <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-sm"></div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-6 border-t border-slate-800 bg-[#0b1121]">
                <div className="flex items-center gap-4 mb-6 px-2">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-black">
                        A
                    </div>
                    <div>
                        <p className="text-xs font-black text-white">System Admin</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Main Controller</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-red-500/20 shadow-lg shadow-red-500/5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Terminate Session
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
