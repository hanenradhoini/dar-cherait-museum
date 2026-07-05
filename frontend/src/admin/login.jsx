
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Identifiants invalides.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-ivory-dark">
        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl font-bold text-brown-deep">Dar Cheraït</h2>
          <p className="text-sm text-text-light mt-1">Espace Administration</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-ivory-dark rounded-md focus:outline-none focus:border-brown-deep text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-ivory-dark rounded-md focus:outline-none focus:border-brown-deep text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brown-deep text-gold hover:bg-brown-mid font-medium py-2 px-4 rounded-md transition-colors text-sm mt-2 disabled:opacity-50"
          >
            {submitting ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}


