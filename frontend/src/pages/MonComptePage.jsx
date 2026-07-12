// src/pages/MonComptePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUT_COLORS = {
  en_attente:  'bg-amber-100 text-amber-800 border-amber-300',
  confirmee:   'bg-green-100 text-green-800 border-green-300',
  annulee:     'bg-red-100 text-red-800 border-red-300',
  terminee:    'bg-gray-100 text-gray-700 border-gray-300',
};
const STATUT_LABELS = {
  en_attente: 'En attente',
  confirmee:  'Confirmée',
  annulee:    'Annulée',
  terminee:   'Terminée',
};

const ABN_STATUT_COLORS = {
  en_attente: 'bg-amber-100 text-amber-800 border-amber-300',
  active:     'bg-[#C9A84C]/15 text-[#8a6f1f] border-[#C9A84C]/40',
  annulee:    'bg-red-100 text-red-800 border-red-300',
  expiree:    'bg-gray-100 text-gray-700 border-gray-300',
};
const ABN_STATUT_LABELS = {
  en_attente: 'En attente',
  active:     'Active',
  annulee:    'Annulée',
  expiree:    'Expirée',
};

export default function MonComptePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('reservations');

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '' });
  const [pwForm, setPwForm] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [msgProfil, setMsgProfil] = useState('');
  const [msgPw, setMsgPw] = useState('');

  const [categories, setCategories] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingAbn, setLoadingAbn] = useState(true);
  const [abnForm, setAbnForm] = useState({ organizationName: '', categoryId: '', numberOfPersons: '', planType: 'monthly' });
  const [estimation, setEstimation] = useState(null);
  const [msgAbn, setMsgAbn] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showAbnForm, setShowAbnForm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/connexion'); return; }

    api.get('/reservations/mine')
      .then(r => setReservations(r.data.reservations || []))
      .catch(err => {
        const status = err.response?.status;
        if (status === 401) {
          logout();
          navigate('/connexion');
        } else {
          setError('Impossible de charger vos réservations. Veuillez réessayer.');
        }
      })
      .finally(() => setLoading(false));

    api.get('/account/me')
      .then(r => setForm({
        nom: r.data.user?.nom || '',
        prenom: r.data.user?.prenom || '',
        telephone: r.data.user?.telephone || '',
      }))
      .catch(() => {});

    api.get('/subscriptions/categories')
      .then(r => setCategories(r.data.categories || []))
      .catch(() => {});

    api.get('/subscriptions/mine')
      .then(r => setSubscriptions(r.data.subscriptions || []))
      .catch(() => {})
      .finally(() => setLoadingAbn(false));
  }, [user, authLoading, navigate, logout]);

  async function saveProfil(e) {
    e.preventDefault();
    try {
      await api.put('/account/me', form);
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
      await api.put('/account/password', { currentPassword: pwForm.actuel, newPassword: pwForm.nouveau });
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

  useEffect(() => {
    const { categoryId, numberOfPersons, planType } = abnForm;
    if (!categoryId || !numberOfPersons || parseInt(numberOfPersons) < 1) {
      setEstimation(null);
      return;
    }
    setCalculating(true);
    const timeout = setTimeout(() => {
      api.post('/subscriptions/calculate', {
        categoryId: parseInt(categoryId),
        numberOfPersons: parseInt(numberOfPersons),
        planType,
      })
        .then(r => setEstimation(r.data))
        .catch(() => setEstimation(null))
        .finally(() => setCalculating(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [abnForm.categoryId, abnForm.numberOfPersons, abnForm.planType]);

  async function submitAbonnement(e) {
    e.preventDefault();
    const { organizationName, categoryId, numberOfPersons, planType } = abnForm;
    if (!organizationName.trim() || !categoryId || !numberOfPersons) {
      setMsgAbn('❌ Merci de remplir tous les champs');
      return;
    }
    try {
      const { data } = await api.post('/subscriptions', {
        organizationName: organizationName.trim(),
        categoryId: parseInt(categoryId),
        numberOfPersons: parseInt(numberOfPersons),
        planType,
      });
      setSubscriptions(prev => [data.subscription, ...prev]);
      setAbnForm({ organizationName: '', categoryId: '', numberOfPersons: '', planType: 'monthly' });
      setEstimation(null);
      setShowAbnForm(false);
      setMsgAbn('✅ Demande envoyée — en attente de validation par le musée');
      setTimeout(() => setMsgAbn(''), 5000);
    } catch (err) {
      setMsgAbn('❌ ' + (err.response?.data?.message || 'Erreur lors de la demande'));
    }
  }

  const inputCls = 'input-royal';
  const labelCls = 'text-[11px] font-bold text-[#1B3A7A]/60 uppercase tracking-wider mb-1.5 block';

  if (authLoading) {
    return (
      <div className="bg-azure min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-azure min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">

        {/* En-tête */}
        <div className="mb-10">
          <div className="section-tag mb-3">✦ &nbsp; Espace personnel</div>
          <h1 className="font-display text-5xl font-bold text-royal mb-3 tracking-tight">Mon Espace</h1>
          <div className="gold-line" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche : profil ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <div className="flex items-center gap-4 mb-1">
                <div className="w-14 h-14 rounded-full bg-royal flex items-center justify-center text-gold text-2xl font-display font-bold flex-shrink-0 shadow-md">
                  {user?.prenom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-heading text-royal font-bold text-lg leading-tight">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-[#1B3A7A]/50 font-semibold">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <h3 className="font-heading text-royal font-bold text-base mb-1">Informations personnelles</h3>
              <div className="gold-line mb-4" style={{ width: 28 }} />
              {msgProfil && <p className="text-sm font-semibold mb-3">{msgProfil}</p>}
              <form onSubmit={saveProfil} className="space-y-3">
                {[['Prénom', 'prenom'], ['Nom', 'nom'], ['Téléphone', 'telephone']].map(([label, key]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input className={inputCls} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={`${inputCls} bg-azure`} value={user?.email || ''} disabled />
                </div>
                <button type="submit" className="btn-royal w-full mt-2">
                  Enregistrer
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6 border border-azure">
              <h3 className="font-heading text-royal font-bold text-base mb-1">Changer le mot de passe</h3>
              <div className="gold-line mb-4" style={{ width: 28 }} />
              {msgPw && <p className="text-sm font-semibold mb-3">{msgPw}</p>}
              <form onSubmit={savePassword} className="space-y-3">
                {[['Mot de passe actuel','actuel','password'],['Nouveau','nouveau','password'],['Confirmation','confirmation','password']].map(([label,key,type]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input type={type} className={inputCls}
                      value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <button type="submit" className="btn-outline w-full mt-2">
                  Mettre à jour
                </button>
              </form>
            </div>
          </div>

          {/* ── Colonne droite : onglets Réservations / Abonnement ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card border border-azure overflow-hidden">

              {/* Barre d'onglets */}
              <div className="flex border-b-2 border-azure bg-[#FAFBFF]">
                <button type="button" onClick={() => setTab('reservations')}
                  className={`flex-1 px-6 py-6 font-display text-xl font-bold uppercase tracking-wide transition-colors relative ${
                    tab === 'reservations' ? 'text-royal bg-white' : 'text-[#1B3A7A]/35 hover:text-royal/70'
                  }`}>
                  Réservations
                  <span className="ml-2 text-sm font-sans font-bold text-gold align-middle">({reservations.length})</span>
                  {tab === 'reservations' && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold" />}
                </button>
                <button type="button" onClick={() => setTab('abonnement')}
                  className={`flex-1 px-6 py-6 font-display text-xl font-bold uppercase tracking-wide transition-colors relative ${
                    tab === 'abonnement' ? 'text-royal bg-white' : 'text-[#1B3A7A]/35 hover:text-royal/70'
                  }`}>
                  Abonnement
                  <span className="ml-2 text-sm font-sans font-bold text-gold align-middle">({subscriptions.length})</span>
                  {tab === 'abonnement' && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold" />}
                </button>
              </div>

              <div className="p-6">

                {/* ── Onglet Réservations ── */}
                {tab === 'reservations' && (
                  loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-red-600 text-sm font-semibold mb-4">{error}</p>
                      <button type="button" onClick={() => window.location.reload()} className="btn-royal">
                        Réessayer
                      </button>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="font-display text-5xl text-gold/30 mb-4">✦</div>
                      <p className="text-[#1B3A7A]/60 text-sm font-semibold mb-5">Vous n'avez pas encore de réservation</p>
                      <a href="/contact" className="btn-royal">Réserver une visite</a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reservations.map(r => (
                        <div key={r.id} className="border-l-4 border-royal bg-[#FAFBFF] rounded-r-lg rounded-l-sm p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-xs text-royal font-bold bg-white px-2 py-0.5 rounded border border-azure">{r.reference}</span>
                                <span className={`text-[10px] tracking-[1px] uppercase px-2.5 py-1 rounded-full border font-bold ${STATUT_COLORS[r.statut] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                  {STATUT_LABELS[r.statut] || r.statut}
                                </span>
                              </div>
                              <p className="font-heading text-royal font-bold text-base">{r.espace}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[#1B3A7A]/70 font-semibold">
                                <span>📅 {r.date_visite ? new Date(r.date_visite).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : '—'}</span>
                                <span>🕐 {r.heure_visite || '—'}</span>
                                <span>👤 {r.nombre_personnes || 1} personne(s)</span>
                              </div>
                              {r.reponse_admin && (
                                <div className="mt-3 bg-white rounded p-3 text-xs text-[#1B3A7A]/80 font-semibold border-l-2 border-gold">
                                  <span className="font-bold text-royal">Message du musée :</span> {r.reponse_admin}
                                </div>
                              )}
                            </div>
                            {r.statut === 'en_attente' && (
                              <button type="button" onClick={() => annuler(r.id)}
                                className="text-xs font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors flex-shrink-0 border-2 border-red-300 hover:border-red-500 px-3 py-1.5 rounded uppercase tracking-wide">
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* ── Onglet Abonnement ── */}
                {tab === 'abonnement' && (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <p className="text-xs text-[#1B3A7A]/60 font-semibold max-w-md leading-relaxed">
                        Pour les agences touristiques, hôtels, écoles et autres organismes souhaitant un accès régulier au musée.
                      </p>
                      <button type="button" onClick={() => setShowAbnForm(s => !s)}
                        className="btn-gold whitespace-nowrap flex-shrink-0">
                        {showAbnForm ? 'Annuler' : '+ Nouvelle demande'}
                      </button>
                    </div>

                    {msgAbn && <p className="text-sm font-semibold mb-4">{msgAbn}</p>}

                    {showAbnForm && (
                      <form onSubmit={submitAbonnement} className="space-y-4 mb-8 bg-[#FAFBFF] rounded-lg p-5 border-2 border-gold/30">
                        <div>
                          <label className={labelCls}>Nom de l'organisme</label>
                          <input className={inputCls} placeholder="Ex: Agence Sahara Voyages"
                            value={abnForm.organizationName}
                            onChange={e => setAbnForm(f => ({ ...f, organizationName: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>Catégorie</label>
                            <select className={inputCls} value={abnForm.categoryId}
                              onChange={e => setAbnForm(f => ({ ...f, categoryId: e.target.value }))}>
                              <option value="">Sélectionner…</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Personnes</label>
                            <input type="number" min="1" className={inputCls} placeholder="Ex: 30"
                              value={abnForm.numberOfPersons}
                              onChange={e => setAbnForm(f => ({ ...f, numberOfPersons: e.target.value }))} />
                          </div>
                          <div>
                            <label className={labelCls}>Formule</label>
                            <select className={inputCls} value={abnForm.planType}
                              onChange={e => setAbnForm(f => ({ ...f, planType: e.target.value }))}>
                              <option value="monthly">Mensuel</option>
                              <option value="annual">Annuel</option>
                            </select>
                          </div>
                        </div>

                        {calculating && (
                          <p className="text-xs text-[#1B3A7A]/50 font-semibold">Calcul du tarif…</p>
                        )}
                        {!calculating && estimation && (
                          <div className="bg-white rounded-lg p-4 border-2 border-gold/40 shadow-sm">
                            <div className="flex justify-between text-xs text-[#1B3A7A]/60 font-semibold mb-1.5">
                              <span>Prix de base</span>
                              <span>{estimation.basePrice.toFixed(2)} TND</span>
                            </div>
                            {estimation.discountPercent > 0 && (
                              <div className="flex justify-between text-xs text-green-700 font-bold mb-1.5">
                                <span>Remise ({estimation.discountPercent}%)</span>
                                <span>- {(estimation.basePrice - estimation.totalPrice).toFixed(2)} TND</span>
                              </div>
                            )}
                            <div className="flex justify-between font-heading text-royal font-bold text-lg pt-2 border-t-2 border-gold/20 mt-2">
                              <span>Total</span>
                              <span>{estimation.totalPrice.toFixed(2)} TND</span>
                            </div>
                          </div>
                        )}

                        <button type="submit" className="btn-royal w-full" disabled={!estimation}>
                          Envoyer la demande d'abonnement
                        </button>
                      </form>
                    )}

                    {loadingAbn ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="font-display text-5xl text-gold/30 mb-4">✦</div>
                        <p className="text-[#1B3A7A]/60 text-sm font-semibold">Aucun abonnement pour le moment</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map(s => (
                          <div key={s.id} className="border-l-4 border-gold bg-[#FAFBFF] rounded-r-lg rounded-l-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-xs text-royal font-bold bg-white px-2 py-0.5 rounded border border-azure">{s.reference}</span>
                              <span className={`text-[10px] tracking-[1px] uppercase px-2.5 py-1 rounded-full border font-bold ${ABN_STATUT_COLORS[s.statut] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                {ABN_STATUT_LABELS[s.statut] || s.statut}
                              </span>
                            </div>
                            <p className="font-heading text-royal font-bold text-base">{s.organization_name}</p>
                            {s.category_name && (
                              <p className="text-xs text-gold font-bold uppercase tracking-wide mt-0.5">{s.category_name}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[#1B3A7A]/70 font-semibold">
                              <span>👥 {s.number_of_persons} personne(s)</span>
                              <span>{s.plan_type === 'annual' ? '📅 Annuel' : '🗓️ Mensuel'}</span>
                              <span className="font-bold text-royal">💰 {parseFloat(s.total_price).toFixed(2)} TND</span>
                            </div>
                            {s.reponse_admin && (
                              <div className="mt-3 bg-white rounded p-3 text-xs text-[#1B3A7A]/80 font-semibold border-l-2 border-gold">
                                <span className="font-bold text-royal">Message du musée :</span> {s.reponse_admin}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}