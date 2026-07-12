// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Endpoints qui doivent TOUJOURS utiliser le token visiteur, peu importe la page
// affichée (ex: AuthContext appelle /account/me au chargement de l'app, même
// si on navigue sur une page /admin/... — il ne faut jamais lui donner le token admin).
const ALWAYS_USER_PREFIXES = [
  '/account',
  '/subscriptions/calculate',
  '/subscriptions/mine',
  '/subscriptions/categories',
  '/reservations/mine',
  '/reservations/lookup',
];

// Endpoints qui doivent TOUJOURS utiliser le token admin, peu importe la page.
const ADMIN_PATH_RE = /\/admin(\/|$)/;

function isAlwaysUser(url) {
  return ALWAYS_USER_PREFIXES.some(p => url?.startsWith(p)) || url === '/subscriptions';
}

// Injecter le bon token :
// 1. Si l'endpoint est explicitement "toujours visiteur" → token visiteur, point final.
// 2. Sinon, si l'endpoint contient /admin ou /auth/ → token admin.
// 3. Sinon, on se base sur la page affichée (/admin/... → token admin) — nécessaire
//    car des routes comme /media, /content, /annonces, /reservations (liste admin)
//    n'ont pas "/admin" dans leur URL mais sont bien des routes admin.
api.interceptors.request.use((config) => {
  const url = config.url || '';
  let isAdminRequest;

  if (isAlwaysUser(url)) {
    isAdminRequest = false;
  } else {
    isAdminRequest =
      ADMIN_PATH_RE.test(url) ||
      url.startsWith('/auth/') ||
      window.location.pathname.startsWith('/admin');
  }

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