
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthService from '../services/authService';

const FACULTY_PREFIX = {
    Computing: 'IT',
    Engineering: 'EN',
    Business: 'BU',
    Humanities: 'HU',
    Science: 'SC',
    Other: 'OT'
};

// Password strength checker function
const getPasswordStrength = (password) => {
    if (!password) return { strength: '', color: '', label: '' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character type checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/[0-9]/.test(password)) score++; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score++; // special chars
    
    // Return strength based on score
    if (score <= 2) {
        return { strength: 'weak', color: 'bg-red-500', textColor: 'text-red-500', label: 'Weak' };
    } else if (score <= 4) {
        return { strength: 'medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', label: 'Medium' };
    } else {
        return { strength: 'strong', color: 'bg-green-500', textColor: 'text-green-500', label: 'Strong' };
    }
};

const LoginView = ({
    onHome,
    setIsLogin,
    handleLogin,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showPassword,
    setShowPassword,
    loading
}) => {
    const passwordStrength = getPasswordStrength(loginPassword);
    
    return (
    <div className="min-h-screen w-full bg-[#0a0a1a] flex font-sans overflow-hidden relative selection:bg-blue-100 selection:text-blue-900 animate-fade-in">

        {/* ── BACKGROUND PHOTO ── */}
        <div className="fixed inset-0 z-0">
            <img
                src="/event-auth-bg.png"
                alt="event background"
                className="w-full h-full object-cover scale-105 animate-subtle-zoom opacity-85"
            />
            <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-transparent"></div>
        </div>

        {/* ── AMBIENT GLOW ── */}
        <div className="absolute inset-0 z-2 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-100 h-100 bg-indigo-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            {[...Array(25)].map((_, i) => (
                <div key={i} className="absolute bg-white rounded-full opacity-0 animate-float-particle" style={{
                    width: Math.random() * 2.5 + 1 + 'px',
                    height: Math.random() * 2.5 + 1 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                    animationDuration: Math.random() * 10 + 8 + 's',
                    animationDelay: Math.random() * 8 + 's'
                }} />
            ))}
        </div>

        {/* ── BELISSA-STYLE ORGANIC BLOB ── */}
        <div className="absolute inset-0 z-3 pointer-events-none overflow-hidden">
            <svg
                className="absolute animate-blob-stable"
                style={{ left: '-5%', top: '-5%', width: '70%', height: '115%' }}
                viewBox="0 0 700 850"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="blob-shadow" x="-15%" y="-15%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur" />
                        <feOffset dx="6" dy="8" result="offsetBlur" />
                        <feFlood floodColor="rgba(0,0,0,0.13)" result="color" />
                        <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
                        <feMerge>
                            <feMergeNode in="shadow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Belissa pattern: anchored top-left, organic bulge right in center, wiggly right edge, back to bottom-left */}
                <path
                    d="
                        M 0,0
                        L 340,0
                        C 390,0   440,10  470,40
                        C 530,95  580,160 590,240
                        C 605,340 570,400 530,450
                        C 490,500 540,560 520,630
                        C 500,700 440,760 370,800
                        C 300,840 180,855 80,840
                        C 30,832 0,820 0,820
                        Z
                    "
                    fill="white"
                    fillOpacity="0.96"
                    filter="url(#blob-shadow)"
                />
            </svg>
        </div>

        {/* ── LIVE EVENT BADGE ── */}
        <div className="absolute bottom-10 right-10 z-10 w-60 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl hidden lg:block">
            <div className="flex justify-between items-center text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                <span>Live Event</span>
                <span className="text-red-400 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block"></span> Live
                </span>
            </div>
            <span className="text-white text-sm font-bold">International Tech Summit</span>
        </div>

        {/* ── FULL CONTENT ── */}
        <div className="relative z-20 w-full flex flex-col min-h-screen">

            {/* TOP NAV */}
            <header className="w-full flex items-center justify-between px-10 lg:px-16 pt-8 pb-4">
                {/* Logo */}
                <div className="flex items-center gap-3 group cursor-default">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-lg"></div>
                        <div className="relative w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                            <span className="text-white font-black text-lg leading-none select-none">E</span>
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-900 text-xl tracking-tighter leading-none select-none">
                            <span className="font-extrabold">Event</span><span className="font-light text-slate-500">Manager</span>
                        </span>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.3em] pl-0.5 opacity-70">Professional Suite</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex items-center gap-3">
                    <button
                        onClick={onHome}
                        className="text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2 bg-white/5 hover:bg-white/15 rounded-full border border-white/15 transition-all backdrop-blur-md"
                    >
                        ← Home
                    </button>
                    <div className="flex items-center bg-black/25 backdrop-blur-md rounded-full border border-white/15 shadow-xl overflow-hidden">
                        <button disabled className="text-blue-300 text-[11px] font-black uppercase tracking-widest px-6 py-2.5">
                            Sign In
                        </button>
                        <div className="h-4 w-px bg-white/20"></div>
                        <button
                            onClick={() => setIsLogin(false)}
                            className="text-white/60 hover:text-white text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 transition-colors"
                        >
                            Sign Up
                        </button>
                    </div>
                </nav>
            </header>

            {/* MAIN */}
            <main className="flex-1 flex items-center">
                <div className="w-[52%] flex justify-center">
                <div className="w-full max-w-sm px-4 flex flex-col justify-center">

                    <div className="animate-form-reveal" style={{ animationDelay: '0.1s' }}>
                        <p className="text-slate-400 text-2xl font-light mb-1">Welcome Back,</p>
                    </div>
                    <div className="animate-form-reveal" style={{ animationDelay: '0.18s' }}>
                        <h1 className="text-slate-900 font-black tracking-tighter leading-tight mb-12 whitespace-nowrap" style={{ fontSize: 'clamp(2rem, 3.2vw, 3.8rem)' }}>
                            Manage your <span className="text-blue-600">Events</span>
                        </h1>
                    </div>

                    <form className="space-y-7 w-full max-w-md" onSubmit={handleLogin}>

                        {/* Email */}
                        <div className="animate-form-reveal" style={{ animationDelay: '0.26s' }}>
                            <div className="group/inp space-y-2">
                                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-[0.28em] pl-1 group-focus-within/inp:text-blue-600 transition-colors">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Email Portal
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 outline-none focus:border-blue-400/60 focus:bg-white focus:ring-4 focus:ring-blue-100/70 transition-all text-sm text-slate-700 placeholder:text-slate-300 font-medium"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="animate-form-reveal" style={{ animationDelay: '0.34s' }}>
                            <div className="group/inp space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-[0.28em] pl-1 group-focus-within/inp:text-blue-600 transition-colors">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Security Key
                                    </label>
                                    <a href="#" className="text-[10px] font-bold text-slate-300 hover:text-blue-500 uppercase tracking-widest transition-colors">Forgot?</a>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 pr-12 outline-none focus:border-blue-400/60 focus:bg-white focus:ring-4 focus:ring-blue-100/70 transition-all text-sm text-slate-700 placeholder:text-slate-300 font-bold tracking-[0.2em]"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-1.5 rounded-lg bg-white/60"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                                {loginPassword && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                    style={{ 
                                                        width: passwordStrength.strength === 'weak' ? '33%' : 
                                                               passwordStrength.strength === 'medium' ? '66%' : '100%' 
                                                    }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${passwordStrength.textColor}`}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="animate-form-reveal pt-2" style={{ animationDelay: '0.42s' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black text-[12px] py-4 rounded-2xl shadow-[0_16px_36px_-8px_rgba(37,99,235,0.45)] hover:shadow-[0_20px_44px_-6px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-[0.28em] overflow-hidden"
                            >
                                <span className="relative z-10">{loading ? 'Accessing...' : 'Access Dashboard'}</span>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    </form>

                    {/* Social + footer */}
                    <div className="animate-form-reveal mt-10" style={{ animationDelay: '0.5s' }}>
                        <div className="flex items-center gap-5 mb-4">
                            <span className="text-[10px] text-slate-400 font-bold italic tracking-wider whitespace-nowrap">Connect via:</span>
                            <div className="flex gap-5">
                                {['google', 'twitter', 'facebook'].map((social, i) => (
                                    <button key={i} className="text-slate-500 opacity-50 hover:opacity-100 hover:scale-125 transition-all outline-none">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            {social === 'google' && <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.32-2.32 4.28-1.52 1.04-3.48 1.64-5.52 1.64-4.8 0-8.8-3.32-10.24-7.8-.32-.96-.52-1.96-.52-3s.2-2.04.52-3c1.44-4.48 5.44-7.8 10.24-7.8 2.52 0 4.84.92 6.6 2.48l2.56-2.56c-2.4-2.2-5.56-3.52-9.16-3.52-8.32 0-15.08 6.76-15.08 15.08s6.76 15.08 15.08 15.08c7.2 0 13.08-5.2 14.68-12.12.32-1.44.4-2.48.4-4.16h-15.08z" />}
                                            {social === 'twitter' && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />}
                                            {social === 'facebook' && <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />}
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                            By continuing, you agree to our{' '}
                            <a href="#" className="text-blue-600 underline underline-offset-2">Terms</a>.{' '}
                            Need help?{' '}
                            <a href="#" className="text-blue-600 font-bold hover:underline">Support</a>
                        </p>
                    </div>
                </div>
                </div>

                {/* Right side — photo shows through */}
                <div className="flex-1" />
            </main>
        </div>

        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes subtleZoom {
                0%   { transform: scale(1.05); }
                50%  { transform: scale(1.10); }
                100% { transform: scale(1.05); }
            }
            @keyframes blobStable {
                0%, 100% { transform: translate(0, 0px)   rotate(0deg)    scale(1);     }
                33%       { transform: translate(4px,-6px) rotate(0.6deg)  scale(1.004); }
                66%       { transform: translate(-3px,3px) rotate(-0.4deg) scale(0.997); }
            }
            @keyframes formReveal {
                from { opacity: 0; transform: translateX(-32px); }
                to   { opacity: 1; transform: translateX(0);     }
            }
            @keyframes floatParticle {
                0%   { transform: translateY(0)       translateX(0);   opacity: 0;   }
                20%  { opacity: 0.7; }
                80%  { opacity: 0.7; }
                100% { transform: translateY(-100vh)  translateX(40px); opacity: 0; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            .animate-subtle-zoom    { animation: subtleZoom    30s ease-in-out infinite; }
            .animate-blob-stable    { animation: blobStable    18s ease-in-out infinite; }
            .animate-form-reveal    { animation: formReveal    1.1s cubic-bezier(0.19,1,0.22,1) both; }
            .animate-float-particle { animation: floatParticle linear infinite; }
            .animate-fade-in        { animation: fadeIn        0.7s ease-out both; }
            `
        }} />
    </div>
);

};

const RegisterView = ({
    onHome,
    setIsLogin,
    handleRegister,
    registerFirstName,
    setRegisterFirstName,
    registerLastName,
    setRegisterLastName,
    registerPhone,
    setRegisterPhone,
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    registerConfirmPassword,
    setRegisterConfirmPassword,
    registerRole,
    setRegisterRole,
    registerStudentNumber,
    setRegisterStudentNumber,
    facultyPrefix,
    registerFaculty,        // ← ADD THIS
    setRegisterFaculty,
    loading
}) => {
    const passwordStrength = getPasswordStrength(registerPassword);
    
    return (
    <div className="min-h-screen w-full bg-[#0a192f] flex items-center justify-center font-sans p-4 relative overflow-hidden animate-fade-in">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" />

        <div className="fixed top-8 right-8 z-100 flex gap-4 items-center">
            <button onClick={() => setIsLogin(true)} className="px-6 py-2.5 bg-black/20 backdrop-blur-2xl border border-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-full shadow-xl hover:bg-blue-600/40 hover:border-blue-400/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group">
                <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
            </button>
            <div className="h-4 w-px bg-white/10"></div>
            <button onClick={onHome} className="px-6 py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] rounded-full shadow-xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group">
                <svg className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
            </button>
        </div>

        <div className="relative w-full max-w-5xl h-175 bg-white rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex">
            <div className="relative w-[45%] h-full overflow-hidden hidden lg:block">
                <img src="/event-auth-bg.png" className="w-full h-full object-cover blur-[1px] scale-110" alt="bg" />
                <div className="absolute inset-0 bg-[#1e40af]/90 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-12 text-white">
                    <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                    <p className="text-sm font-light opacity-80 mb-10 max-w-62.5">To keep connected with us please login with your personal info.</p>
                    <button onClick={() => setIsLogin(true)} className="px-14 py-3 border-2 border-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-blue-700 transition-all transform hover:scale-105">Sign In</button>
                </div>
            </div>

            <div className="flex-1 h-full flex flex-col items-center justify-start px-14 py-8 bg-white overflow-y-auto">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Create Account</h1>

                <div className="flex gap-4 mb-6">
                    {[{ icon: 'f', color: 'text-blue-600' }, { icon: 'G', color: 'text-red-500' }, { icon: 'i', color: 'text-pink-500' }, { icon: 'in', color: 'text-blue-800' }].map((s, i) => (
                        <button key={i} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:scale-110 transition-all shadow-sm">
                            <span className={`font-black text-sm ${s.color}`}>{s.icon}</span>
                        </button>
                    ))}
                </div>

                <span className="text-[11px] text-slate-400 font-medium mb-6">Or use your email for registration</span>

                <form className="w-full space-y-3.5 max-w-sm" onSubmit={handleRegister}>
                    <input type="text" placeholder="First Name" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerFirstName} onChange={(e) => setRegisterFirstName(e.target.value)} />
                    <input type="text" placeholder="Last Name" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerLastName} onChange={(e) => setRegisterLastName(e.target.value)} />
                    <input type="text" placeholder="Phone" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} />
                    <input type="email" placeholder="Email Address" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                    
                    <div className="space-y-2">
                        <input type="password" placeholder="Password" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                        {registerPassword && (
                            <div className="px-2 space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                            style={{ 
                                                width: passwordStrength.strength === 'weak' ? '33%' : 
                                                       passwordStrength.strength === 'medium' ? '66%' : '100%' 
                                            }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${passwordStrength.textColor}`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <input type="password" placeholder="Confirm Password" className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} />
                     <select 
                        className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        value={registerFaculty} 
                        onChange={(e) => setRegisterFaculty(e.target.value)}
                        required={registerRole === 'student' || registerRole === 'organizer'}
                    >
                        <option value="">Select Faculty</option>
                        <option value="Computing">Computing</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business</option>
                        <option value="Humanities">Humanities</option>
                        <option value="Science">Science</option>
                        <option value="Other">Other</option>
                    </select>
                    <div className="w-full bg-[#f4f8f7] rounded-[18px] flex items-stretch focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
                        <div className="min-w-16 px-4 flex items-center justify-center text-sm font-bold text-blue-700 border-r border-slate-200 rounded-l-[18px] bg-slate-100">
                            {facultyPrefix || '--'}
                        </div>
                        <input
                            type="text"
                            placeholder="Student Number (8 digits)"
                            className="w-full bg-transparent border-none py-3.5 px-5 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                            value={registerStudentNumber}
                            onChange={(e) => setRegisterStudentNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            maxLength={8}
                            required={registerRole === 'student' || registerRole === 'organizer'}
                        />
                    </div>
                    {/* ← ADD FACULTY FIELD HERE */}
                   
                    <select className="w-full bg-[#f4f8f7] border-none py-3.5 px-5 rounded-[18px] outline-none text-sm text-slate-700 focus:ring-2 focus:ring-blue-600/10 transition-all" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)}>
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                    </select>

                    <div className="pt-4 flex flex-col items-center">
                        <button type="submit" disabled={loading} className="px-16 py-3.5 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-full shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 transition-all">
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
            .animate-fade-in { animation: fadeIn 0.7s ease-out both; }
            `
        }} />
    </div>
);

};


const AuthPage = ({ onHome: onHomeProp, initialMode = 'login' }) => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [showPassword, setShowPassword] = useState(false);

    const onHome = onHomeProp || (() => navigate('/'));

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [registerFirstName, setRegisterFirstName] = useState('');
    const [registerLastName, setRegisterLastName] = useState('');
    const [registerPhone, setRegisterPhone] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerRole, setRegisterRole] = useState('student');
    const [registerStudentNumber, setRegisterStudentNumber] = useState('');
    const [registerFaculty, setRegisterFaculty] = useState(''); 

    const [loading, setLoading] = useState(false);

    const facultyPrefix = FACULTY_PREFIX[registerFaculty] || '';
    const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const response = await AuthService.login({ 
            email: loginEmail, 
            password: loginPassword 
        });
        
        if (response.data.success) {
            // Store user data using the service
            AuthService.setUserData(response.data);
            
            // Redirect based on role
            if (response.data.user?.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }
    } catch (err) {
        const errorMsg = err.response?.data?.message;
        
        if (errorMsg === "Please verify your email first") {
            // Keep user on the home page but they'll see their status in Navbar (if verified/not)
            navigate('/');
        } else {
            toast.error(errorMsg || 'Login failed');
        }
    } finally {
        setLoading(false);
    }
    };

    const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (registerPassword !== registerConfirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
    }

    if (!registerFaculty) {
        toast.error('Please select faculty');
        setLoading(false);
        return;
    }

    if (!/^\d{8}$/.test(registerStudentNumber)) {
        toast.error('Student number must be exactly 8 digits');
        setLoading(false);
        return;
    }

    const userData = {
        firstName: registerFirstName,
        lastName: registerLastName,
        phone: registerPhone,
        email: registerEmail,
        password: registerPassword,
        confirmPassword: registerConfirmPassword,
        role: registerRole,
        studentId: `${FACULTY_PREFIX[registerFaculty] || ''}${registerStudentNumber}`,
        faculty: registerFaculty
    };

    try {
        const response = await AuthService.register(userData);
        
        if (response.data.success) {
            // DON'T store user or token automatically
            // DON'T redirect to dashboard
            
            // Show success message and redirect to verification pending page
            navigate('/verification-pending', { 
                state: { 
                    email: registerEmail,
                    message: response.data.message 
                } 
            });
        }
    } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
        setLoading(false);
    }
    };

    const loginViewProps = {
        onHome, setIsLogin, handleLogin,
        loginEmail, setLoginEmail,
        loginPassword, setLoginPassword,
        showPassword, setShowPassword,
        loading
    };

    const registerViewProps = {
        onHome, setIsLogin, handleRegister,
        registerFirstName, setRegisterFirstName,
        registerLastName, setRegisterLastName,
        registerPhone, setRegisterPhone,
        registerEmail, setRegisterEmail,
        registerPassword, setRegisterPassword,
        registerConfirmPassword, setRegisterConfirmPassword,
        registerRole, setRegisterRole,
        registerStudentNumber, setRegisterStudentNumber,
        facultyPrefix,
        registerFaculty, setRegisterFaculty,
        loading
    };

    return isLogin ? <LoginView {...loginViewProps} /> : <RegisterView {...registerViewProps} />;
};

export default AuthPage;