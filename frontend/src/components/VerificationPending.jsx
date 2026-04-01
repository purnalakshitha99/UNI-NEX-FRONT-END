import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const VerificationPending = () => {
    const location = useLocation();
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const email = location.state?.email || userObj?.user?.email || 'your email';
    const message = location.state?.message || 'Registration successful!';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-600 mb-4">{message}</p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-700">
                        We've sent a verification link to:
                    </p>
                    <p className="font-semibold text-blue-600 mt-1">{email}</p>
                </div>

                <div className="space-y-4">
                    <div className="text-left bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">📋 Next Steps:</h3>
                        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                            <li>Check your inbox (and spam folder)</li>
                            <li>Click the verification link in the email</li>
                            <li>Return here and login with your credentials</li>
                        </ol>
                    </div>

                    <Link 
                        to="/auth" 
                        className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </Link>

                    <button 
                        onClick={() => window.location.reload()}
                        className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        Didn't receive email? Check spam folder
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;