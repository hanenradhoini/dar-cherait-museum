// src/pages/MonComptePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUT_COLORS = {
  en_attente:  'bg-amber-100 text-amber-700 border-amber-200',
  confirmee:   'bg-green-100 text-green-700 border-green-200',
  annulee:     'bg-red-100 text-red-700 border-red-200',
  terminee:    'bg-gray-100 text-gray-600 border-gray-200',
};
const STATUT_LABELS = {
  en_attente: 'En attente',
  confirmee:  'Confirmée',
  annulee:    'Annulée',
  terminee:   'Terminée',
};

export default function MonComptePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [msgProfil, setMsgProfil] = useState('');
  const [msgPw, setMsgPw] = useState('');

  useEffect(() => {
    if (!user) { navigate('/connexion'); return; }

    // Charger les réservations
    api.get('/reservations/mine')
      .then(r => setReservations(r.data.reservations || []))
      .catch(err => {
        const status = err.response?.status;
        if (status === 401) {
          // Token expiré — déconnecter et rediriger
          logout();
          navigate('/connexion');
        } else {
          setError('Impossible de charger vos réservations. Veuillez réessayer.');
        }
      })
      .finally(() => setLoading(false));

    // Charger le profil
    api.get('/account/profile')
      .then(r => setForm({
        nom: r.data.user?.nom || '',
        prenom: r.data.user?.prenom || '',
        telephone: r.data.user?.telephone || '',
      }))
      .catch(() => {});
  }, [user, navigate, logout]);

  async function saveProfil(e) {
    e.preventDefault();
    try {
      await api.put('/account/profile', form);
      setMsgProfil('✅ Profil mis à jour');
      setTimeout(() => setMsgProfil(''), 3000);
    } catch (err) {
      setMsgProfil('❌ ' + (err.response?.data?.message || 'Erreur'));
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (pwForm.nouveau !== pwForm.confirmation) {
      setMsgPw('❌ Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    try {
      await api.put('/account/password', { motDePasseActuel: pwForm.actuel, nouveauMotDePasse: pwForm.nouveau });
      setPwForm({ actuel: '', nouveau: '', confirmation: '' });
      setMsgPw('✅ Mot de passe mis à jour');
      setTimeout(() => setMsgPw(''), 3000);
    } catch (err) {
      setMsgPw('❌ ' + (err.response?.data?.message || 'Erreur'));
    }
  }

  async function annuler(id) {
    if (!window.confirm('Annuler cette réservation ?')) return;
    try {
      await api.patch(`/reservations/mine/${id}/annuler`);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, statut: 'annulee' } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }

  const inputCls = 'input-royal';

  return (
    <div className="bg-azure min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">

        {/* En-tête */}
        <div className="mb-10">
          <div className="section-tag mb-2">✦ &nbsp; Espace personnel</div>
          <h1 className="font-display text-4xl text-royal mb-1">Mon Espace</h1>
          <div className="w-10 h-0.5 bg-gold mt-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche : profil ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-royal flex items-center justify-center text-gold text-xl font-display flex-shrink-0">
                  {user?.prenom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-heading text-royal font-semibold">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-text-sub">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <h3 className="font-heading text-royal font-semibold mb-4">Informations personnelles</h3>
              {msgProfil && <p className="text-sm mb-3">{msgProfil}</p>}
              <form onSubmit={saveProfil} className="space-y-3">
                {[['Prénom', 'prenom'], ['Nom', 'nom'], ['Téléphone', 'telephone']].map(([label, key]) => (
                  <div key={key}>
                    <label className="text-xs text-text-sub uppercase tracking-wide mb-1 block">{label}</label>
                    <input className={inputCls} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-text-sub uppercase tracking-wide mb-1 block">Email</label>
                  <input className={`${inputCls} bg-azure`} value={user?.email || ''} disabled />
                </div>
                <button type="submit" className="btn-royal w-full text-[11px] mt-2">
                  Enregistrer
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <h3 className="font-heading text-royal font-semibold mb-4">Changer le mot de passe</h3>
              {msgPw && <p className="text-sm mb-3">{msgPw}</p>}
              <form onSubmit={savePassword} className="space-y-3">
                {[['Mot de passe actuel','actuel','password'],['Nouveau','nouveau','password'],['Confirmation','confirmation','password']].map(([label,key,type]) => (
                  <div key={key}>
                    <label className="text-xs text-text-sub uppercase tracking-wide mb-1 block">{label}</label>
                    <input type={type} className={inputCls}
                      value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <button type="submit" className="btn-outline w-full text-[11px] mt-2">
                  Mettre à jour
                </button>
              </form>
            </div>
          </div>

          {/* ── Colonne droite : réservations ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <h3 className="font-heading text-royal font-semibold text-lg mb-5">
                Mes réservations
                <span className="ml-2 text-sm text-text-sub font-sans font-normal">({reservations.length})</span>
              </h3>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                  <button type="button" onClick={() => window.location.reload()} className="btn-royal text-xs">
                    Réessayer
                  </button>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="font-display text-5xl text-royal/10 mb-4">✦</div>
                  <p className="text-text-sub text-sm mb-5">Vous n'avez pas encore de réservation</p>
                  <a href="/contact" className="btn-royal text-[11px]">Réserver une visite</a>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map(r => (
                    <div key={r.id} className="border border-azure rounded-lg p-5 hover:border-sky/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-xs text-sky font-bold">{r.reference}</span>
                            <span className={`text-[10px] tracking-[1px] uppercase px-2.5 py-0.5 rounded-full border font-bold ${STATUT_COLORS[r.statut] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUT_LABELS[r.statut] || r.statut}
                            </span>
                          </div>
                          <p className="font-heading text-royal font-semibold text-sm">{r.espace}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-sub">
                            <span>📅 {r.date_visite ? new Date(r.date_visite).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—'}</span>
                            <span>🕐 {r.heure_visite || '—'}</span>
                            <span>👤 {r.nombre_personnes || 1} personne(s)</span>
                          </div>
                          {r.reponse_admin && (
                            <div className="mt-3 bg-azure rounded p-3 text-xs text-text-sub border-l-2 border-royal/30">
                              <span className="font-bold text-royal">Message du musée :</span> {r.reponse_admin}
                            </div>
                          )}
                        </div>
                        {r.statut === 'en_attente' && (
                          <button type="button" onClick={() => annuler(r.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors flex-shrink-0 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded">
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
