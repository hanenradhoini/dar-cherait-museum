// src/admin/UtilisateursPage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function UtilisateursPage() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit:20, ...(search ? {search} : {}) });
    const { data } = await api.get(`/admin/users?${params}`);
    setUsers(data.users); setTotal(data.total); setPages(data.pages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActif(u) {
    await api.put(`/admin/users/${u.id}`, { actif:!u.actif });
    setUsers(us => us.map(x => x.id===u.id ? {...x, actif:!x.actif} : x));
    setMsg(u.actif ? '✅ Compte désactivé' : '✅ Compte activé');
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-deep">Visiteurs inscrits</h1>
          <p className="text-gray-500 text-sm">{total} compte(s)</p>
        </div>
      </div>

      {msg && <p className="text-green-600 text-sm bg-green-50 border border-green-200 px-4 py-2 rounded mb-4 inline-block">{msg}</p>}

      <div className="mb-4">
        <input placeholder="🔍 Rechercher par nom ou email..."
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-sand/40"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun utilisateur trouvé</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nom','Email','Téléphone','Nationalité','Inscrit le','Statut','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.prenom} {u.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.telephone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.nationalite || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActif(u)}
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        u.actif
                          ? 'border-red-300 text-red-500 hover:bg-red-50'
                          : 'border-green-300 text-green-600 hover:bg-green-50'
                      }`}>
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">←</button>
          <span className="px-3 py-1 text-sm">{page} / {pages}</span>
          <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
