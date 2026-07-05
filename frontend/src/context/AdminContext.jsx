// src/context/AdminContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(r => setAdmin(r.data.admin))
      .catch(err => {
        // Supprimer le token UNIQUEMENT si le serveur dit qu'il est invalide/expiré
        // (401) — pas pour les erreurs réseau (err.response sera undefined)
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
        }
        // Pour toute autre erreur (réseau, serveur 500…) on garde le token
        // et on essaiera de nouveau à la prochaine requête
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('adminToken', data.token);
    setAdmin(data.admin);
    return data.admin;
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setAdmin(null);
  }

  return (
    <AdminContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }