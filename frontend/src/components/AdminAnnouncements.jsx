import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminAnnouncements = () => {
    return (
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">
            <AdminSidebar />
            
            <main className="flex-1 p-4 pt-24 sm:p-6 sm:pt-24 lg:ml-72 lg:p-12 lg:pt-12 overflow-y-auto">
                <header className="mb-8 sm:mb-12 flex justify-between items-end animate-fade-in">
                    <div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2">Communication Suite</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Broadcasting <span className="text-blue-500">Service</span></h1>
                    </div>
                </header>

                <div className="bg-slate-900/40 rounded-[40px] border border-slate-800 backdrop-blur-xl p-5 sm:p-8 lg:p-12 animate-slide-up">
                    <div className="flex flex-col gap-6 sm:gap-10 sm:flex-row sm:items-start">
                        <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center text-3xl">
                            📢
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-4 select-none">Global Broadcast Node</h2>
                            <p className="text-slate-400 font-medium mb-10 max-w-2xl leading-relaxed">
                                Deploy system-wide messages to all event participants. Announcements are delivered in real-time across all communication channels.
                            </p>
                            
                            <textarea 
                                placeholder="Input message payload..."
                                className="w-full h-40 bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 text-sm text-white outline-none focus:border-blue-500 transition-all backdrop-blur-xl mb-10 font-bold"
                            />
                            
                            <button className="bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-12 py-4 rounded-3xl shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
                                Launch Broadcast
                            </button>
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

export default AdminAnnouncements;
