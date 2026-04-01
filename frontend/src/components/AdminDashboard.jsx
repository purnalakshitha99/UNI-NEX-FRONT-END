import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminDashboard = () => {
    const stats = [
        { label: 'Total Users', value: '1,280', change: '+12%', icon: '👤', color: 'bg-blue-600/10 text-blue-500' },
        { label: 'Active Events', value: '43', change: '+5%', icon: '⚡', color: 'bg-amber-600/10 text-amber-500' },
        { label: 'Bookings Today', value: '15', change: '+8%', icon: '🎫', color: 'bg-green-600/10 text-green-500' },
        { label: 'Revenue (LKR)', value: '45,200', change: '+15%', icon: '💰', color: 'bg-indigo-600/10 text-indigo-500' },
    ];

    const alerts = [
        { message: 'New event registration: "Tech Summit 2024"', time: '2 mins ago', type: 'info' },
        { message: 'System backup completed successfully', time: '1 hour ago', type: 'success' },
        { message: 'User "Chamath" requested password reset', time: '3 hours ago', type: 'warning' },
    ];

    return (
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">
            <AdminSidebar />
            
            <main className="ml-72 flex-1 p-12 overflow-y-auto">
                {/* Header section */}
                <header className="mb-12 flex justify-between items-center animate-fade-in">
                    <div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2 leading-none">System Administration</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Real-time <span className="text-blue-500">Analytics</span></h1>
                    </div>
                    
                    <div className="flex gap-4">
                        <button className="bg-slate-800/50 text-slate-400 p-3 rounded-2xl hover:bg-slate-800 transition-colors border border-slate-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        <button className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
                            Export Report
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-900/40 p-8 rounded-[40px] border border-slate-800 hover:border-slate-700 transition-all group backdrop-blur-xl hover:translate-y-[-4px]">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all duration-500 group-hover:scale-110 ${stat.color}`}>
                                    {stat.icon}
                                </div>
                                <span className="text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{stat.change}</span>
                            </div>
                            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                            <p className="text-white text-3xl font-black tracking-tighter select-none">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Table Mockup */}
                    <div className="lg:col-span-2 bg-slate-900/40 rounded-[40px] border border-slate-800 backdrop-blur-xl p-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black text-white tracking-tight">System Logs</h3>
                            <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Full History →</button>
                        </div>
                        
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((_, i) => (
                                <div key={i} className="flex items-center gap-6 p-1 hover:translate-x-1 transition-transform group">
                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-slate-200 font-bold text-sm tracking-wide">Automatic Syncing completed</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Service: DATABASE_REPLICA</p>
                                    </div>
                                    <span className="text-slate-600 text-xs font-bold tabular-nums">09:4{i} AM</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts/Status */}
                    <div className="lg:col-span-1 bg-slate-900/40 rounded-[40px] border border-slate-800 backdrop-blur-xl p-10 flex flex-col animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h3 className="text-xl font-black text-white tracking-tight mb-8">System Health</h3>
                        
                        <div className="space-y-8 flex-1">
                            {alerts.map((alert, i) => (
                                <div key={i} className="relative pl-6 border-l-2 border-slate-800 hover:border-blue-500 transition-colors py-1">
                                    <div className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2 h-2 bg-slate-800 rounded-full border border-dark group-hover:bg-blue-500"></div>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed mb-1">{alert.message}</p>
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">{alert.time}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-blue-600/10 rounded-3xl border border-blue-600/20">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                <span className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Active Server</span>
                            </div>
                            <p className="text-slate-400 text-[11px] font-bold tracking-wide">
                                All subsystems are functioning within normal parameters.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 1.2s ease-out both; }
                .animate-slide-up { animation: slideUp 1s ease-out both; }
                `
            }} />
        </div>
    );
};

export default AdminDashboard;
