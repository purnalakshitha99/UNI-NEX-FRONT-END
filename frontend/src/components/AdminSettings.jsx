import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminSettings = () => {
    return (
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">
            <AdminSidebar />
            
            <main className="ml-72 flex-1 p-12 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end animate-fade-in">
                    <div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2">System Preferences</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter">Control <span className="text-blue-500">Parameters</span></h1>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
                    <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 backdrop-blur-xl group hover:border-slate-700 transition-all">
                        <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                            ⚙️
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 leading-none">Global Configurations</h3>
                        <p className="text-white text-xl font-black tracking-tight mb-6 select-none pt-2">System Environment</p>
                        
                        <div className="space-y-4 mb-10 text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                <span>API Version 1.2.0</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                <span>SSL Status: Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 p-10 rounded-[40px] border border-slate-800 backdrop-blur-xl group hover:border-slate-700 transition-all">
                        <div className="w-16 h-16 bg-indigo-600/10 text-indigo-500 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
                            🛡️
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 leading-none">Security Parameters</h3>
                        <p className="text-white text-xl font-black tracking-tight mb-6 select-none pt-2">Account Vault</p>
                        
                        <div className="space-y-4 mb-10 text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                <span>Two-Factor Authentication</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                <span>Auto Session Terminate</span>
                            </div>
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

export default AdminSettings;
