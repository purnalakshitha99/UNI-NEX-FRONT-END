import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import AuthService from '../services/authService';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await AuthService.getProfile();
                if (response.data.success) {
                    setUser(response.data.user);
                }
            } catch (err) {
                console.error("Fetch Profile Error:", err);
                setError('Failed to load profile. Please sign in again.');
                // If token expired, logout
                if (err.response?.status === 401) {
                    AuthService.logout();
                    navigate('/auth');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">{error}</h2>
                        <button 
                            onClick={() => navigate('/auth')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
                {/* Header section */}
                <div className="mb-10 animate-fade-in">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">My Profile</h1>
                    <p className="text-slate-500 font-medium">Manage your personal information and event preferences.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left col: Avatar & Status */}
                    <div className="lg:col-span-1 space-y-6 animate-slide-in-left">
                        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
                            <div className="relative w-32 h-32 mb-6">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
                                <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white">
                                    <span className="text-white text-5xl font-black">{user?.firstName?.charAt(0)}</span>
                                </div>
                                {user?.isVerified && (
                                    <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg" title="Verified Account">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-4">{user?.role}</p>
                            
                            <div className="w-full h-[1px] bg-slate-100 my-6"></div>
                            
                            <div className="w-full space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium tracking-tight">Status</span>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user?.isVerified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {user?.isVerified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium tracking-tight">Joined</span>
                                    <span className="text-slate-700 font-bold">{new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick actions or Stats could go here */}
                    </div>

                    {/* Right col: Details */}
                    <div className="lg:col-span-2 animate-slide-in-right">
                        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Personal Details</h3>
                                <button className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors">Edit Profile</button>
                            </div>
                            
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Email Address</label>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm overflow-hidden text-ellipsis">
                                        {user?.email}
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Contact Number</label>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm">
                                        {user?.phone}
                                    </div>
                                </div>

                                {/* Student ID (conditionally rendered) */}
                                {(user?.role === 'student' || user?.role === 'organizer') && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Identification ID</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm">
                                            {user?.studentId || 'N/A'}
                                        </div>
                                    </div>
                                )}

                                {/* Faculty (conditionally rendered) */}
                                {(user?.role === 'student' || user?.role === 'organizer') && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Affiliated Faculty</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm">
                                            {user?.faculty || 'N/A'}
                                        </div>
                                    </div>
                                )}

                                {/* User Role (Visual only) */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Account Role</label>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm capitalize">
                                        {user?.role}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-8 border-t border-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-1">Privacy Information</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            Your profile information is visible to event organizers when you register for events. Use the Edit Profile button above to keep your contact details up to date.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-in { animation: fadeIn 0.8s ease-out both; }
                .animate-slide-in-left { animation: slideInLeft 0.8s ease-out both; }
                .animate-slide-in-right { animation: slideInRight 0.8s ease-out both; }
                `
            }} />
        </div>
    );
};

export default UserProfile;
