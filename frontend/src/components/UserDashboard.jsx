import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import Navbar from './Navbar';

const UserDashboard = () => {
    const navigate = useNavigate();
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-700">You are not logged in.</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Header */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-10 mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 mb-2">
                                    Welcome back, <span className="text-blue-600">{currentUser.user?.firstName}!</span>
                                </h1>
                                <p className="text-slate-500 font-medium">Manage your events and track your progress from here.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm border border-blue-100 uppercase tracking-wider">
                                    {currentUser.user?.role} Account
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats or Info Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all duration-300">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Details</h2>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-medium">Full Name</span>
                                    <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                                        {currentUser.user?.firstName} {currentUser.user?.lastName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-medium">Email Address</span>
                                    <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                                        {currentUser.user?.email}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-medium">Phone Number</span>
                                    <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                                        {currentUser.user?.phone || 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all duration-300">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Academic Info</h2>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-medium">Faculty</span>
                                    <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                                        {currentUser.user?.faculty || 'N/A'}
                                    </span>
                                </div>
                                {currentUser.user?.studentId && (
                                    <div className="flex justify-between items-center group">
                                        <span className="text-slate-500 font-medium">Student ID</span>
                                        <span className="text-slate-900 font-bold group-hover:text-blue-600 transition-colors">
                                            {currentUser.user?.studentId}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-medium">Verification Status</span>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${currentUser.user?.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {currentUser.user?.isVerified ? 'Verified' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
