// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Injecter le bon token selon le contexte :
// - Si on est sur une route /admin → adminToken
// - Sinon → token visiteur
api.interceptors.request.use((config) => {
  const isAdminRequest =
    config.url?.includes('/admin/') ||
    config.url?.includes('/auth/me') ||
    config.url?.includes('/auth/login') ||
    window.location.pathname.startsWith('/admin');

  const token = isAdminRequest
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error)
);

export default api;