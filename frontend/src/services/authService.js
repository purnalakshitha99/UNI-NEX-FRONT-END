import axios from 'axios';

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'https://uni-nex-api.onrender.com'
).replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/v1/auth`;

const register = (userData) => {
    return axios.post(`${API_URL}/register`, userData);
};

const login = (userData) => {
    return axios.post(`${API_URL}/login`, userData);
};

// Verify email with token
const verifyEmail = (token) => {
    return axios.get(`${API_URL}/verify-email/${token}`);
};

// Resend verification email
const resendVerification = (email) => {
    return axios.post(`${API_URL}/resend-verification`, { email });
};

// NEW: Store user data after login
const setUserData = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) {
        localStorage.setItem('token', userData.token);
    }
    // Notify components of auth change
    window.dispatchEvent(new Event('authChange'));
};

const logout = () => {
    const token = getAuthToken();
    if (token) {
        axios.post(`${API_URL}/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).catch(err => console.error("Logout API failed", err));
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Notify components of auth change
    window.dispatchEvent(new Event('authChange'));
};

// FIXED: Handle case when no user in localStorage
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
};

// Check if user is authenticated
const isAuthenticated = () => {
    const user = getCurrentUser();
    return !!user?.token;
};

// Get auth token for requests
const getAuthToken = () => {
    const user = getCurrentUser();
    return user?.token || null;
};

// NEW: Check if email is verified
const isEmailVerified = () => {
    const user = getCurrentUser();
    return user?.user?.isVerified === true;
};

const getAllUsers = () => {
    const token = getAuthToken();
    return axios.get(`${API_URL}/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const getProfile = () => {
    const token = getAuthToken();
    return axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const updateProfile = (profileData) => {
    const token = getAuthToken();
    return axios.put(`${API_URL}/update-profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const deleteUser = (id) => {
    const token = getAuthToken();
    return axios.delete(`${API_URL}/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export default {
    register,
    login,
    verifyEmail,
    resendVerification,
    logout,
    getCurrentUser,
    isAuthenticated,
    getAuthToken,
    isEmailVerified,
    setUserData,
    getProfile,
    updateProfile,
    getAllUsers,
    deleteUser,
};