import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

const VerificationSuccess = () => {
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();
    const hasChecked = useRef(false);

    useEffect(() => {
        const verifyEmail = async () => {
            if (hasChecked.current) return;
            hasChecked.current = true;
            
            try {
                const response = await AuthService.verifyEmail(token);
                
                if (response.data.success) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    
                    // Auto redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/auth');
                    }, 3000);
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Verifying your email...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <p className="text-sm text-gray-500 mb-4">Redirecting to login in 3 seconds...</p>
                        <Link 
                            to="/auth" 
                            className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login Now
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Link 
                            to="/auth" 
                            className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Back to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerificationSuccess;