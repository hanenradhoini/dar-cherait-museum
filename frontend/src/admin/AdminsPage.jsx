// src/admin/AdminsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAdmin } from '../context/AdminContext';

const ROLES = [
  { value: 'admin',       label: 'Administrateur',       desc: 'Gestion du contenu, réservations, médias, annonces' },
  { value: 'super_admin', label: 'Super Administrateur', desc: 'Tous les droits + gestion des admins' },
];

function Badge({ role }) {
  return role === 'super_admin'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gold/20 text-sand-dark">⭐ Super Admin</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sand/20 text-brown-mid">🔑 Admin</span>;
}

function StatusBadge({ actif }) {
  return actif
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">● Actif</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">● Désactivé</span>;
}

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdmin();
  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ email: '', password: '', nom: '', role: 'admin' });
  const [saving, setSaving]     = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole]   = useState('');

  function flash(m)    { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 4000); }
  function flashErr(m) { setErr(m); setMsg(''); setTimeout(() => setErr(''), 6000); }

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/admins');
      setAdmins(data.admins);
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createAdmin() {
    if (!form.email || !form.password || !form.nom) { flashErr('Tous les champs sont requis'); return; }
    if (form.password.length < 8) { flashErr('Le mot de passe doit faire au moins 8 caractères'); return; }
    setSaving(true);
    try {
      await api.post('/admin/admins', form);
      setForm({ email: '', password: '', nom: '', role: 'admin' });
      setCreating(false);
      flash('✅ Administrateur créé avec succès');
      await load();
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur création');
    } finally { setSaving(false); }
  }

  async function updateRole(id) {
    try {
      await api.put(`/admin/admins/${id}`, { role: editRole });
      setEditingId(null);
      flash('✅ Rôle mis à jour');
      await load();
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur mise à jour');
    }
  }

  async function toggleActif(id, actif) {
    try {
      await api.patch(`/admin/admins/${id}/actif`, { actif: !actif });
      flash(`✅ Compte ${!actif ? 'activé' : 'désactivé'}`);
      await load();
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur');
    }
  }

  async function deleteAdmin(id, nom) {
    if (!window.confirm(`Supprimer définitivement le compte de "${nom}" ?`)) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      flash('✅ Administrateur supprimé');
      await load();
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur suppression');
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40 bg-white';

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-sand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-deep">Gestion des administrateurs</h1>
          <p className="text-gray-400 text-sm mt-0.5">{admins.length} compte(s) administrateur</p>
        </div>
        {isSuperAdmin && (
          <button type="button" onClick={() => setCreating(!creating)}
            className="bg-brown-deep text-ivory px-4 py-2 text-sm font-semibold rounded-xl hover:bg-sand hover:text-brown-deep transition-colors">
            {creating ? '✕ Annuler' : '+ Nouvel admin'}
          </button>
        )}
      </div>

      {/* Messages */}
      {msg && <div className="text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg text-sm">{msg}</div>}
      {err && <div className="text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm">{err}</div>}

      {/* Avertissement si pas super_admin */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          🔒 Seul un <strong>Super Administrateur</strong> peut créer ou modifier des comptes admin.
        </div>
      )}

      {/* Formulaire création */}
      {creating && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-semibold text-brown-deep mb-4">Créer un nouvel administrateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nom complet *</label>
              <input className={inputCls} placeholder="ex: Mohamed Ben Ali"
                value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
              <input type="email" className={inputCls} placeholder="admin@darcherait.tn"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mot de passe * (min. 8 caractères)</label>
              <input type="password" className={inputCls} placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Rôle *</label>
              <select className={inputCls} value={form.role}
                onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {ROLES.find(r => r.value === form.role)?.desc}
              </p>
            </div>
          </div>
          <button type="button" onClick={createAdmin} disabled={saving}
            className="bg-brown-deep text-ivory px-6 py-2 text-sm font-semibold rounded-xl hover:bg-sand hover:text-brown-deep transition-colors disabled:opacity-50">
            {saving ? '⏳ Création...' : '+ Créer le compte'}
          </button>
        </div>
      )}

      {/* Explication des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3 items-start">
            <span className="text-xl">{r.value === 'super_admin' ? '⭐' : '🔑'}</span>
            <div>
              <p className="text-sm font-semibold text-brown-deep">{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des admins */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-brown-deep">Comptes administrateurs</h2>
        </div>

        {admins.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">Aucun administrateur trouvé</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map(a => (
              <div key={a.id} className={`px-6 py-4 flex items-center gap-4 ${a.id === currentAdmin?.id ? 'bg-sand/5' : ''}`}>

                {/* Avatar initiales */}
                <div className="w-10 h-10 rounded-full bg-brown-deep text-ivory flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {a.nom?.charAt(0).toUpperCase()}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-brown-deep">{a.nom}</p>
                    {a.id === currentAdmin?.id && (
                      <span className="text-xs text-gray-400 italic">(vous)</span>
                    )}
                    <Badge role={a.role} />
                    <StatusBadge actif={a.actif} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{a.email}</p>
                  {a.created_at && (
                    <p className="text-xs text-gray-300 mt-0.5">
                      Créé le {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                {/* Actions — seulement pour super_admin et pas sur son propre compte */}
                {isSuperAdmin && a.id !== currentAdmin?.id && (
                  <div className="flex items-center gap-2 flex-shrink-0">

                    {/* Changer le rôle */}
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                          value={editRole} onChange={e => setEditRole(e.target.value)}>
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button type="button" onClick={() => updateRole(a.id)}
                          className="text-xs bg-brown-deep text-ivory px-2 py-1 rounded-lg hover:bg-sand hover:text-brown-deep transition-colors">
                          💾
                        </button>
                        <button type="button" onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
                      </div>
                    ) : (
                      <button type="button"
                        onClick={() => { setEditingId(a.id); setEditRole(a.role); }}
                        className="text-xs text-gray-500 hover:text-brown-deep border border-gray-200 px-2 py-1 rounded-lg hover:border-sand transition-colors">
                        ✏️ Rôle
                      </button>
                    )}

                    {/* Activer / Désactiver */}
                    <button type="button" onClick={() => toggleActif(a.id, a.actif)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                        a.actif
                          ? 'border-red-200 text-red-400 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                      {a.actif ? '🚫 Désactiver' : '✅ Activer'}
                    </button>

                    {/* Supprimer */}
                    <button type="button" onClick={() => deleteAdmin(a.id, a.nom)}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2 py-1 rounded-lg transition-colors">
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}