import axios from 'axios';
import AuthService from './authService';

// const API_URL = 'http://localhost:5000/api/v1/payment-slips';
const API_URL = 'https://your-backend.onrender.com/api/v1/payment-slips';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${AuthService.getAuthToken()}`,
});

// ── STUDENT ───────────────────────────────────────────────────────────────────

/** Submit a bank-transfer payment slip (multipart/form-data) */
const submitPaymentSlip = (formData) => {
  return axios.post(`${API_URL}/submit`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
};

/** Get all payment-slip registrations for the logged-in student */
const getMyPaymentSlips = () => {
  return axios.get(`${API_URL}/my-registrations`, { headers: getAuthHeaders() });
};

/** Get a single payment-slip registration (student view) */
const getPaymentSlipDetails = (id) => {
  return axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
};

/** Update a pending payment-slip registration */
const updatePaymentSlip = (id, formData) => {
  return axios.put(`${API_URL}/${id}`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
};

/** Cancel (delete) a pending payment-slip registration */
const cancelPaymentSlip = (id) => {
  return axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
};

/** Download QR code for an approved registration */
const downloadQRCode = (id) => {
  return axios.get(`${API_URL}/${id}/download-qr`, { headers: getAuthHeaders() });
};

// ── ADMIN / ORGANIZER ─────────────────────────────────────────────────────────

/** Get all payment slips for a specific event */
const getEventPaymentSlips = (eventId) => {
  return axios.get(`${API_URL}/event/${eventId}`, { headers: getAuthHeaders() });
};

/** Get all approved attendees for a specific event */
const getEventAttendees = (eventId) => {
  return axios.get(`${API_URL}/event/${eventId}/attendees`, { headers: getAuthHeaders() });
};

/** Approve a payment slip and generate QR code */
const approvePaymentSlip = (id, body = {}) => {
  return axios.put(`${API_URL}/${id}/approve`, body, { headers: getAuthHeaders() });
};

/** Reject a payment slip with a reason */
const rejectPaymentSlip = (id, body) => {
  return axios.put(`${API_URL}/${id}/reject`, body, { headers: getAuthHeaders() });
};

/** Regenerate QR code for an approved slip */
const regenerateQRCode = (id) => {
  return axios.put(`${API_URL}/${id}/regenerate-qr`, {}, { headers: getAuthHeaders() });
};

/** Check in an attendee via QR data */
const checkInAttendee = (qrData) => {
  return axios.post(`${API_URL}/check-in`, { qrData }, { headers: getAuthHeaders() });
};

/** Get ALL payment slips across all events (admin only) */
const getAllPaymentSlips = (status = '') => {
  const params = status ? `?status=${status}` : '';
  return axios.get(`${API_URL}/all${params}`, { headers: getAuthHeaders() });
};

export default {
  submitPaymentSlip,
  getMyPaymentSlips,
  getPaymentSlipDetails,
  updatePaymentSlip,
  cancelPaymentSlip,
  downloadQRCode,
  getEventPaymentSlips,
  getEventAttendees,
  approvePaymentSlip,
  rejectPaymentSlip,
  regenerateQRCode,
  checkInAttendee,
  getAllPaymentSlips,
};
