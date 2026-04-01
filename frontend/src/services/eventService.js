import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:5000/api/v1/events';

const toFormData = (eventData) => {
  const formData = new FormData();

  Object.entries(eventData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'tickets') {
      formData.append('tickets', JSON.stringify(value));
      return;
    }

    if (key === 'tags') {
      formData.append('tags', Array.isArray(value) ? JSON.stringify(value) : String(value));
      return;
    }

    if (key === 'coverImage') {
      if (value instanceof File) {
        formData.append('image', value);
      }
      return;
    }

    formData.append(key, value);
  });

  return formData;
};

const createEvent = (eventData) => {
  const token = AuthService.getAuthToken();
  const formData = toFormData(eventData);

  return axios.post(`${API_URL}/create`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const updateEvent = (eventId, eventData) => {
  const token = AuthService.getAuthToken();
  const formData = toFormData(eventData);

  return axios.put(`${API_URL}/update/${eventId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const deleteEvent = (eventId) => {
  const token = AuthService.getAuthToken();

  return axios.delete(`${API_URL}/delete/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getMyEvents = () => {
  const token = AuthService.getAuthToken();

  return axios.get(`${API_URL}/my-events`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getPublicEvents = () => {
  return axios.get(`${API_URL}/public`);
};

const getEventById = (eventId) => {
  return axios.get(`${API_URL}/public/${eventId}`);
};

const registerForEvent = (eventId, payload) => {
  const token = AuthService.getAuthToken();

  return axios.post(`${API_URL}/register/${eventId}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getMyRegistrations = () => {
  const token = AuthService.getAuthToken();

  return axios.get(`${API_URL}/my-registrations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const getAdminAllBookings = () => {
  const token = AuthService.getAuthToken();
  return axios.get(`${API_URL}/admin/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const getAdminEventBookings = (eventId) => {
  const token = AuthService.getAuthToken();
  return axios.get(`${API_URL}/admin/bookings/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const getAdminEventAttendance = (eventId) => {
  const token = AuthService.getAuthToken();
  return axios.get(`${API_URL}/admin/attendance/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const markAttendanceByQr = (payload) => {
  const token = AuthService.getAuthToken();
  return axios.post(`${API_URL}/admin/attendance/scan`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default {
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getPublicEvents,
  getEventById,
  registerForEvent,
  getMyRegistrations,
  getAdminAllBookings,
  getAdminEventBookings,
  getAdminEventAttendance,
  markAttendanceByQr,
};

