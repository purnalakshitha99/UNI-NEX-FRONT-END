import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AuthService from '../services/authService';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeRole, setActiveRole] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await AuthService.getAllUsers();
                if (response.data.success) {
                    setUsers(response.data.users);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = activeRole === 'all' || user.role === activeRole;
        
        return matchesSearch && matchesRole;
    });

    const handleDelete = async (userId) => {
        if (window.confirm('Are you absolutely sure you want to terminate this user session permanently? This action cannot be undone.')) {
            try {
                const response = await AuthService.deleteUser(userId);
                if (response.data.success) {
                    setUsers(users.filter(u => u._id !== userId));
                }
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to terminate session');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden">
            <AdminSidebar />
            
            <main className="ml-72 flex-1 p-12 overflow-y-auto">
                <header className="mb-8 flex justify-between items-end animate-fade-in">
                    <div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] mb-2 leading-none">User Management</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter">System <span className="text-blue-500">Directory</span></h1>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="Search by name or email..."
                                className="bg-slate-900/50 border border-slate-800 rounded-2xl py-3 px-12 text-sm text-white outline-none focus:border-blue-500 transition-all w-80 backdrop-blur-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </header>

                <div className="flex gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {[
                        { id: 'all', label: 'All Users', icon: '🌍' },
                        { id: 'student', label: 'Students', icon: '🎓' },
                        { id: 'organizer', label: 'Organizers', icon: '👔' },
                    ].map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setActiveRole(role.id)}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 border
                                ${activeRole === role.id 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'}
                            `}
                        >
                            <span>{role.icon}</span>
                            {role.label}
                        </button>
                    ))}
                </div>

                <div className="bg-slate-900/40 rounded-[40px] border border-slate-800 backdrop-blur-xl overflow-hidden animate-slide-up">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Communication Path</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Authority Role</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Initializing Data Stream...</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-blue-600/[0.02] transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white font-black group-hover:bg-blue-600 transition-colors">
                                                {user.firstName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-slate-200 font-bold text-sm tracking-wide">{user.firstName} {user.lastName}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user._id.substring(user._id.length - 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-slate-400 text-sm font-medium">{user.email}</p>
                                        <p className="text-[10px] text-slate-600 font-bold">{user.phone}</p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                            user.role === 'organizer' ? 'bg-amber-500/10 text-amber-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${user.isVerified ? 'text-emerald-500' : 'text-slate-600'}`}>
                                                {user.isVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => handleDelete(user._id)}
                                            className="text-slate-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-xl"
                                            title="Terminate User"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default AdminUsers;
