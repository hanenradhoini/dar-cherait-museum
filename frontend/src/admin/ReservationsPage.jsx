// src/admin/ReservationsPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUTS = ['', 'en_attente', 'confirmee', 'annulee', 'terminee'];
const STATUT_LABELS = { en_attente:'En attente', confirmee:'Confirmée', annulee:'Annulée', terminee:'Terminée' };
const STATUT_COLORS = { en_attente:'bg-yellow-100 text-yellow-800', confirmee:'bg-green-100 text-green-800', annulee:'bg-red-100 text-red-800', terminee:'bg-gray-100 text-gray-500' };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ statut:'', date:'', search:'' });
  const [modal, setModal]   = useState(null);
  const [detail, setDetail] = useState(null);
  const [reponse, setReponse] = useState('');
  const [newStatut, setNewStatut] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit:15, ...filters });
        const { data } = await api.get(`/reservations?${params}`);
        setReservations(data.reservations);
        setTotal(data.total); setPages(data.pages);
      } finally { setLoading(false); }
    }
    load();
  }, [page, filters]);

  async function openDetail(r) {
    const { data } = await api.get(`/reservations/${r.id}`);
    setDetail(data);
    setModal(r);
    setNewStatut(r.statut);
    setReponse(r.reponse_admin || '');
  }

  async function updateStatut() {
    if (!newStatut) return;
    try {
      await api.patch(`/reservations/${modal.id}/status`, { statut:newStatut, reponse_admin:reponse });
      setModal(null);
      setFilters(f => ({ ...f })); // trigger reload
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur';
      const detail = e.response?.data?.detail;
      alert(detail ? `${msg}\n\nDétail : ${detail}` : msg);
      console.error('Réponse complète :', e.response?.data);
    }
  }

  async function deleteResa(id) {
    if (!window.confirm('Supprimer définitivement cette réservation ?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      setFilters(f => ({ ...f }));
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur';
      const detail = e.response?.data?.detail;
      alert(detail ? `${msg}\n\nDétail : ${detail}` : msg);
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]:v })); setPage(1); }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-deep">Réservations</h1>
          <p className="text-gray-500 text-sm">{total} au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <input placeholder="🔍 Rechercher (nom, email, référence)..."
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-sand/40"
          value={filters.search} onChange={e => setFilter('search', e.target.value)} />
        <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          value={filters.statut} onChange={e => setFilter('statut', e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.filter(Boolean).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
        <input type="date" className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          value={filters.date} onChange={e => setFilter('date', e.target.value)} />
        {(filters.statut || filters.date || filters.search) && (
          <button onClick={() => setFilters({ statut:'', date:'', search:'' })}
            className="text-xs text-gray-400 hover:text-red-500 px-2">✕ Réinitialiser</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune réservation trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Référence','Visiteur','Espace','Date visite','Statut','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-brown-deep font-bold">{r.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.visiteur_prenom} {r.visiteur_nom}</p>
                      <p className="text-xs text-gray-400">{r.visiteur_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.espace?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(r.date_visite).toLocaleDateString('fr-FR')} {r.heure_visite}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[r.statut]}`}>
                        {STATUT_LABELS[r.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openDetail(r)}
                          className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors">
                          Voir
                        </button>
                        <button onClick={() => deleteResa(r.id)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}
            className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">←</button>
          <span className="px-3 py-1 text-sm">{page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p+1)}
            className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">→</button>
        </div>
      )}

      {/* Modal détail */}
      {modal && (
        <div className="fixed inset-0 bg-night/70 z-50 flex items-center justify-center px-4"
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between">
              <div>
                <h2 className="font-heading text-xl text-brown-deep">{modal.visiteur_prenom} {modal.visiteur_nom}</h2>
                <p className="font-mono text-sm text-sand">{modal.reference}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email',     modal.visiteur_email],
                  ['Téléphone', modal.visiteur_telephone || '—'],
                  ['Espace',    modal.espace?.replace(/_/g,' ')],
                  ['Date',      `${new Date(modal.date_visite).toLocaleDateString('fr-FR')} à ${modal.heure_visite}`],
                  ['Visiteurs', `${modal.nombre_adultes} adulte(s), ${modal.nombre_enfants} enfant(s)`],
                  ['Langue',    modal.langue_visite],
                  ['Guidée',    modal.visite_guidee ? 'Oui' : 'Non'],
                  ['Nationalité', modal.visiteur_nationalite || '—'],
                ].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase">{k}</p>
                    <p className="font-medium text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
              {modal.message && (
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-400 uppercase mb-1">Message du visiteur</p>
                  <p className="text-sm text-gray-700">{modal.message}</p>
                </div>
              )}

              {detail?.historique?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-2">Historique</p>
                  <div className="space-y-1">
                    {detail.historique.filter(Boolean).map((h, i) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-500">
                        <span>{new Date(h.created_at).toLocaleString('fr-FR')}</span>
                        <span className="text-brown-deep font-medium">{h.action}</span>
                        {h.fait_par && <span>par {h.fait_par}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase mb-2">Modifier le statut</p>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm w-full mb-3"
                  value={newStatut} onChange={e => setNewStatut(e.target.value)}>
                  {['en_attente','confirmee','annulee','terminee'].map(s => (
                    <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                  ))}
                </select>
                <textarea rows={3} placeholder="Réponse au visiteur (optionnel)..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-sand/40"
                  value={reponse} onChange={e => setReponse(e.target.value)} />
                <button onClick={updateStatut}
                  className="w-full bg-brown-deep text-ivory py-2 text-sm font-semibold hover:bg-sand hover:text-brown-deep transition-colors rounded">
                  Enregistrer et notifier le visiteur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
