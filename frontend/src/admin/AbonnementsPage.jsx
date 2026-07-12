// src/admin/AbonnementsPage.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUT_LABELS = { en_attente:'En attente', active:'Active', annulee:'Annulée', expiree:'Expirée' };
const STATUT_COLORS = {
  en_attente: 'bg-yellow-100 text-yellow-800',
  active:     'bg-green-100 text-green-800',
  annulee:    'bg-red-100 text-red-800',
  expiree:    'bg-gray-100 text-gray-500',
};

export default function AbonnementsPage() {
  const [tab, setTab] = useState('demandes'); // 'demandes' | 'categories'

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', pricePerPersonMonth: '' });
  const [newTier, setNewTier] = useState({});

  // Édition catégorie
  const [editingCat, setEditingCat] = useState(null); // id en cours d'édition
  const [editCatForm, setEditCatForm] = useState({ name: '', pricePerPersonMonth: '' });

  // Édition palier
  const [editingTier, setEditingTier] = useState(null); // id en cours d'édition
  const [editTierForm, setEditTierForm] = useState({ minPersons: '', maxPersons: '', discountPercent: '' });

  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [modal, setModal] = useState(null);
  const [newStatut, setNewStatut] = useState('');
  const [reponse, setReponse] = useState('');

  async function loadCategories() {
    setLoadingCats(true);
    try {
      const { data } = await api.get('/subscriptions/categories');
      setCategories(data.categories);
    } finally { setLoadingCats(false); }
  }

  async function loadSubs() {
    setLoadingSubs(true);
    try {
      const params = filterStatut ? `?statut=${filterStatut}` : '';
      const { data } = await api.get(`/subscriptions/admin${params}`);
      setSubs(data.subscriptions);
    } finally { setLoadingSubs(false); }
  }

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadSubs(); }, [filterStatut]);

  async function createCategory(e) {
    e.preventDefault();
    if (!newCat.name.trim() || !newCat.pricePerPersonMonth) return;
    try {
      await api.post('/subscriptions/admin/categories', {
        name: newCat.name.trim(),
        pricePerPersonMonth: parseFloat(newCat.pricePerPersonMonth),
      });
      setNewCat({ name: '', pricePerPersonMonth: '' });
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la création de la catégorie');
    }
  }

  function startEditCat(cat) {
    setEditingCat(cat.id);
    setEditCatForm({ name: cat.name, pricePerPersonMonth: cat.price_per_person_month });
  }

  async function saveEditCat(id) {
    try {
      await api.put(`/subscriptions/admin/categories/${id}`, {
        name: editCatForm.name.trim(),
        pricePerPersonMonth: parseFloat(editCatForm.pricePerPersonMonth),
      });
      setEditingCat(null);
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la modification');
    }
  }

  async function deleteCategory(id, name) {
    if (!window.confirm(`Supprimer la catégorie "${name}" et tous ses paliers ?`)) return;
    try {
      await api.delete(`/subscriptions/admin/categories/${id}`);
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  async function createTier(categoryId) {
    const t = newTier[categoryId];
    if (!t?.minPersons || t.discountPercent === undefined) return;
    try {
      await api.post(`/subscriptions/admin/categories/${categoryId}/tiers`, {
        minPersons: parseInt(t.minPersons),
        maxPersons: t.maxPersons ? parseInt(t.maxPersons) : null,
        discountPercent: parseFloat(t.discountPercent),
      });
      setNewTier(nt => ({ ...nt, [categoryId]: { minPersons:'', maxPersons:'', discountPercent:'' } }));
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la création du palier');
    }
  }

  function startEditTier(tier) {
    setEditingTier(tier.id);
    setEditTierForm({
      minPersons: tier.min_persons,
      maxPersons: tier.max_persons ?? '',
      discountPercent: tier.discount_percent,
    });
  }

  async function saveEditTier(id) {
    try {
      await api.put(`/subscriptions/admin/tiers/${id}`, {
        minPersons: parseInt(editTierForm.minPersons),
        maxPersons: editTierForm.maxPersons === '' ? null : parseInt(editTierForm.maxPersons),
        discountPercent: parseFloat(editTierForm.discountPercent),
      });
      setEditingTier(null);
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la modification du palier');
    }
  }

  async function deleteTier(id) {
    if (!window.confirm('Supprimer ce palier ?')) return;
    try {
      await api.delete(`/subscriptions/admin/tiers/${id}`);
      loadCategories();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur lors de la suppression');
    }
  }

  function openDetail(s) {
    setModal(s);
    setNewStatut(s.statut);
    setReponse(s.reponse_admin || '');
  }

  async function updateStatut() {
    if (!newStatut) return;
    try {
      await api.patch(`/subscriptions/admin/${modal.id}/status`, { statut: newStatut, reponse_admin: reponse });
      setModal(null);
      loadSubs();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Erreur');
    }
  }

  const editInputCls = 'border border-gray-300 rounded px-2 py-1 text-xs';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-deep">Abonnements</h1>
          <p className="text-gray-500 text-sm">Gestion des abonnements collectifs (agences, hôtels, écoles...)</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['demandes','Demandes d\'abonnement'], ['categories','Catégories & tarifs']].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === k ? 'border-sand text-brown-deep' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Nouvelle catégorie</h2>
            <form onSubmit={createCategory} className="flex flex-wrap gap-3">
              <input placeholder="Nom (ex: École primaire)" value={newCat.name}
                onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-sand/40" />
              <input type="number" step="0.01" placeholder="Prix/personne/mois (TND)"
                value={newCat.pricePerPersonMonth}
                onChange={e => setNewCat(c => ({ ...c, pricePerPersonMonth: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-sand/40" />
              <button type="submit"
                className="bg-brown-deep text-ivory px-4 py-2 text-sm font-semibold rounded hover:bg-sand hover:text-brown-deep transition-colors">
                Créer
              </button>
            </form>
          </div>

          {loadingCats ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Aucune catégorie créée</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-3">
                  {editingCat === cat.id ? (
                    <div className="flex gap-2 items-center flex-1">
                      <input className={editInputCls} value={editCatForm.name}
                        onChange={e => setEditCatForm(f => ({ ...f, name: e.target.value }))} />
                      <input type="number" step="0.01" className={`${editInputCls} w-32`}
                        value={editCatForm.pricePerPersonMonth}
                        onChange={e => setEditCatForm(f => ({ ...f, pricePerPersonMonth: e.target.value }))} />
                      <button onClick={() => saveEditCat(cat.id)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">✓ Enregistrer</button>
                      <button onClick={() => setEditingCat(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">Annuler</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-heading text-lg text-brown-deep">{cat.name}</h3>
                        <p className="text-xs text-gray-400">{parseFloat(cat.price_per_person_month).toFixed(2)} TND / personne / mois</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditCat(cat)}
                          className="text-xs text-brown-deep hover:text-sand px-2 py-1 rounded hover:bg-gray-50">✎ Modifier</button>
                        <button onClick={() => deleteCategory(cat.id, cat.name)}
                          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">✕ Supprimer</button>
                      </div>
                    </>
                  )}
                </div>

                {cat.tiers?.length > 0 && (
                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase">
                        <th className="text-left py-1">Min personnes</th>
                        <th className="text-left py-1">Max personnes</th>
                        <th className="text-left py-1">Remise</th>
                        <th className="text-left py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cat.tiers.map(t => (
                        <tr key={t.id}>
                          {editingTier === t.id ? (
                            <>
                              <td className="py-1">
                                <input type="number" className={`${editInputCls} w-16`}
                                  value={editTierForm.minPersons}
                                  onChange={e => setEditTierForm(f => ({ ...f, minPersons: e.target.value }))} />
                              </td>
                              <td className="py-1">
                                <input type="number" placeholder="∞" className={`${editInputCls} w-16`}
                                  value={editTierForm.maxPersons}
                                  onChange={e => setEditTierForm(f => ({ ...f, maxPersons: e.target.value }))} />
                              </td>
                              <td className="py-1">
                                <input type="number" step="0.01" className={`${editInputCls} w-16`}
                                  value={editTierForm.discountPercent}
                                  onChange={e => setEditTierForm(f => ({ ...f, discountPercent: e.target.value }))} />
                              </td>
                              <td className="py-1">
                                <button onClick={() => saveEditTier(t.id)}
                                  className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700 mr-1">✓</button>
                                <button onClick={() => setEditingTier(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-1">{t.min_persons}</td>
                              <td className="py-1">{t.max_persons ?? '∞'}</td>
                              <td className="py-1 font-medium text-sand">{parseFloat(t.discount_percent)}%</td>
                              <td className="py-1">
                                <button onClick={() => startEditTier(t)}
                                  className="text-xs text-brown-deep hover:text-sand px-1.5 py-0.5 rounded hover:bg-gray-50 mr-1">✎</button>
                                <button onClick={() => deleteTier(t.id)}
                                  className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50">✕</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="flex flex-wrap gap-2 items-center bg-gray-50 rounded p-2">
                  <input type="number" placeholder="Min" className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                    value={newTier[cat.id]?.minPersons || ''}
                    onChange={e => setNewTier(nt => ({ ...nt, [cat.id]: { ...nt[cat.id], minPersons: e.target.value } }))} />
                  <input type="number" placeholder="Max (vide=∞)" className="border border-gray-300 rounded px-2 py-1 text-xs w-28"
                    value={newTier[cat.id]?.maxPersons || ''}
                    onChange={e => setNewTier(nt => ({ ...nt, [cat.id]: { ...nt[cat.id], maxPersons: e.target.value } }))} />
                  <input type="number" step="0.01" placeholder="% remise" className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                    value={newTier[cat.id]?.discountPercent || ''}
                    onChange={e => setNewTier(nt => ({ ...nt, [cat.id]: { ...nt[cat.id], discountPercent: e.target.value } }))} />
                  <button onClick={() => createTier(cat.id)}
                    className="text-xs bg-brown-deep text-ivory px-3 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors">
                    + Ajouter palier
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'demandes' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
            <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
              value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingSubs ? (
              <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>
            ) : subs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">Aucune demande d'abonnement</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Référence','Organisme','Catégorie','Personnes','Plan','Total','Statut','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subs.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-brown-deep font-bold">{s.reference}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{s.organization_name}</p>
                          <p className="text-xs text-gray-400">{s.user_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.category_name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.number_of_persons}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{s.plan_type === 'annual' ? 'Annuel' : 'Mensuel'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-brown-deep">{parseFloat(s.total_price).toFixed(2)} TND</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_COLORS[s.statut]}`}>
                            {STATUT_LABELS[s.statut]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openDetail(s)}
                            className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded hover:bg-sand hover:text-brown-deep transition-colors">
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-night/70 z-50 flex items-center justify-center px-4"
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between">
              <div>
                <h2 className="font-heading text-xl text-brown-deep">{modal.organization_name}</h2>
                <p className="font-mono text-sm text-sand">{modal.reference}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Catégorie',  modal.category_name || '—'],
                  ['Personnes',  modal.number_of_persons],
                  ['Plan',       modal.plan_type === 'annual' ? 'Annuel' : 'Mensuel'],
                  ['Prix de base', `${parseFloat(modal.base_price).toFixed(2)} TND`],
                  ['Remise',     `${parseFloat(modal.discount_percent)}%`],
                  ['Total',      `${parseFloat(modal.total_price).toFixed(2)} TND`],
                ].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 uppercase">{k}</p>
                    <p className="font-medium text-gray-800">{v}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase mb-2">Modifier le statut</p>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm w-full mb-3"
                  value={newStatut} onChange={e => setNewStatut(e.target.value)}>
                  {Object.entries(STATUT_LABELS).map(([k,label]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <textarea rows={3} placeholder="Réponse à l'organisme (optionnel)..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-sand/40"
                  value={reponse} onChange={e => setReponse(e.target.value)} />
                <button onClick={updateStatut}
                  className="w-full bg-brown-deep text-ivory py-2 text-sm font-semibold hover:bg-sand hover:text-brown-deep transition-colors rounded">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}