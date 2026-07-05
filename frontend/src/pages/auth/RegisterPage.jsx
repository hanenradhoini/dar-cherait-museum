// src/pages/auth/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'', prenom:'', nom:'', telephone:'', nationalite:'' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setErrors({}); setLoading(true);
    try {
      await register(form);
      navigate('/mon-compte');
    } catch (err) {
      if (err.response?.data?.errors) {
        const e = {};
        err.response.data.errors.forEach(er => { e[er.path] = er.msg; });
        setErrors(e);
      } else {
        setErrors({ global: err.response?.data?.message || 'Erreur serveur' });
      }
    } finally { setLoading(false); }
  }

  const inputCls = (f) =>
    `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/50 ${errors[f] ? 'border-red-400' : 'border-gray-300'}`;

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border-t-4 border-sand">
        <div className="text-center mb-8">
          <p className="font-display text-sand tracking-widest text-xs uppercase mb-1">Musée</p>
          <h1 className="font-display text-3xl text-brown-deep">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-2">Gérez vos réservations facilement</p>
        </div>

        {errors.global && <p className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{errors.global}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brown-deep mb-1">Prénom *</label>
              <input required className={inputCls('prenom')} value={form.prenom} onChange={e => set('prenom', e.target.value)} />
              {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-deep mb-1">Nom *</label>
              <input required className={inputCls('nom')} value={form.nom} onChange={e => set('nom', e.target.value)} />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1">Email *</label>
            <input type="email" required className={inputCls('email')} value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1">Mot de passe * <span className="text-gray-400 text-xs">(min 8 caractères)</span></label>
            <input type="password" required minLength={8} className={inputCls('password')} value={form.password} onChange={e => set('password', e.target.value)} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1">Téléphone</label>
            <input className={inputCls('telephone')} value={form.telephone} onChange={e => set('telephone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-deep mb-1">Nationalité</label>
            <input className={inputCls('nationalite')} value={form.nationalite} onChange={e => set('nationalite', e.target.value)} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-brown-deep text-ivory py-2.5 font-semibold hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="text-sand hover:text-gold font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
