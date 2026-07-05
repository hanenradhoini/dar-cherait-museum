// src/admin/AdminLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

/* ─────────────────────────────────────────────
   MoorishRing — motif géométrique doré animé (étoile à 8 branches
   façon zellige andalou), tourne lentement, accélère à la soumission.
───────────────────────────────────────────── */
function MoorishRing({ speed = 'idle' }) {
  const durOuter = speed === 'fast' ? '2.5s' : '28s';
  const durInner = speed === 'fast' ? '1.8s' : '20s';

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      width: 0, height: 0,
      pointerEvents: 'none', zIndex: 0,
    }}>
      <svg viewBox="0 0 400 400" width={600} height={600}
        style={{ width: 600, height: 600, display: 'block', position: 'absolute', top: '-300px', left: '-300px' }}>
        <defs>
          <style>{`
            .ring-outer { transform-origin: 200px 200px; animation: spin-cw ${durOuter} linear infinite; }
            .ring-inner { transform-origin: 200px 200px; animation: spin-ccw ${durInner} linear infinite; }
            @keyframes spin-cw  { to { transform: rotate(360deg); } }
            @keyframes spin-ccw { to { transform: rotate(-360deg); } }
          `}</style>
        </defs>

        <circle cx="200" cy="200" r="185" fill="none" stroke="#C9A84C" strokeWidth="2.5"
          strokeDasharray="3 10" className="ring-outer" opacity="0.95" />

        <g className="ring-outer">
          {[...Array(8)].map((_, i) => (
            <line key={i}
              x1="200" y1="200"
              x2={200 + 150 * Math.cos((i * 45 * Math.PI) / 180)}
              y2={200 + 150 * Math.sin((i * 45 * Math.PI) / 180)}
              stroke="#C9A84C" strokeWidth="1.5" opacity="0.6" />
          ))}
        </g>

        <g className="ring-inner">
          <circle cx="200" cy="200" r="140" fill="none" stroke="#C9A84C" strokeWidth="2.5" opacity="0.9" />
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const cx = 200 + 140 * Math.cos(angle);
            const cy = 200 + 140 * Math.sin(angle);
            return (
              <rect key={i} x={cx - 4} y={cy - 4} width="8" height="8"
                transform={`rotate(45 ${cx} ${cy})`}
                fill="#C9A84C" opacity="0.85" />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStatus('submitting');
    try {
      await login(form.email, form.password);
      setStatus('success');
      setTimeout(() => navigate('/admin'), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
      setStatus('error');
      setLoading(false);
      setTimeout(() => setStatus('idle'), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-[#D6E4F5] flex items-center justify-center px-4 relative">
      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fade-in-up 0.35s ease forwards; }
      `}</style>

      <div className="relative">
        <MoorishRing speed={status === 'submitting' ? 'fast' : 'idle'} />

        <div className="relative z-10 bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="font-display text-sand tracking-widest text-xs uppercase mb-2">Administration</p>
            <h1 className="font-display text-3xl text-brown-deep">Dar Cheraït</h1>
            <p className="text-gray-400 text-sm mt-2">Accès réservé au personnel</p>
          </div>

          {status === 'success' && (
            <p className="fade-in-up bg-sand/10 border border-sand text-brown-deep font-semibold px-4 py-2 rounded text-sm mb-4 text-center">
              ✦ Connexion réussie
            </p>
          )}
          {status === 'error' && error && (
            <p className="fade-in-up bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-deep mb-1">Email administrateur</label>
              <input type="email" required autoFocus
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/50"
                value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-deep mb-1">Mot de passe</label>
              <input type="password" required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/50"
                value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-brown-deep text-ivory py-2.5 font-semibold hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}