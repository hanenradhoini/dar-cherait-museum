// src/admin/AnnoncesPage.jsx — avec upload photo
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const EMPTY = { titre: '', contenu: '', epinglee: false, imageUrl: '' };

export default function AnnoncesPage() {
  const [annonces, setAnnonces] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  function flash(m) { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 3000); }
  function flashErr(m) { setErr(m); setMsg(''); setTimeout(() => setErr(''), 4000); }

  async function load() {
    const r = await api.get('/content/annonces');
    setAnnonces(r.data.annonces || []);
  }

  useEffect(() => { load(); }, []);

  // Upload photo pour l'annonce
  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const { data } = await api.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, imageUrl: data.medias[0].url }));
      flash('✅ Photo uploadée');
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.titre || !form.contenu) { flashErr('Titre et contenu requis'); return; }
    try {
      if (editing) {
        await api.put(`/content/annonces/${editing}`, form);
        setEditing(null);
      } else {
        await api.post('/content/annonces', form);
      }
      setForm(EMPTY);
      load();
      flash(editing ? '✅ Annonce modifiée' : '✅ Annonce publiée');
    } catch (e) {
      const data = e.response?.data;
      console.error('Erreur annonce :', data);
      flashErr(data?.message || 'Erreur');
    }
  }

  async function del(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    await api.delete(`/content/annonces/${id}`);
    load();
    flash('✅ Annonce supprimée');
  }

  function edit(a) {
    setEditing(a._id);
    setForm({ titre: a.titre, contenu: a.contenu, epinglee: a.epinglee, imageUrl: a.imageUrl || '' });
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 bg-white';

  return (
    <div>
      <h1 className="text-2xl font-semibold text-royal mb-2">Annonces</h1>
      <p className="text-text-sub text-sm mb-6">Publiez des actualités visibles sur la page d'accueil</p>

      {msg && <div className="text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg mb-4 text-sm inline-block">{msg}</div>}
      {err && <div className="text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg mb-4 text-sm inline-block">{err}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-card border border-azure p-6 sticky top-6">
            <h2 className="font-semibold text-royal mb-5">{editing ? '✏️ Modifier l\'annonce' : '+ Nouvelle annonce'}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-sub uppercase tracking-wide mb-1 block">Titre *</label>
                <input className={inputCls} value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Titre de l'annonce" />
              </div>

              <div>
                <label className="text-xs text-text-sub uppercase tracking-wide mb-1 block">Contenu *</label>
                <textarea rows={4} className={`${inputCls} resize-none`} value={form.contenu}
                  onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                  placeholder="Description de l'annonce..." />
              </div>

              {/* Upload photo */}
              <div>
                <label className="text-xs text-text-sub uppercase tracking-wide mb-2 block">Photo (optionnel)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    uploading ? 'border-royal/40 bg-azure' : 'border-gray-200 hover:border-royal/40 hover:bg-azure/50'
                  }`}
                >
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => uploadPhoto(e.target.files[0])} />
                  {uploading ? (
                    <p className="text-sm text-royal">⏳ Upload en cours...</p>
                  ) : form.imageUrl ? (
                    <div className="relative group">
                      <img src={form.imageUrl} alt="" className="h-24 w-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Changer la photo</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl mb-1">📸</div>
                      <p className="text-xs text-text-sub">Cliquez pour ajouter une photo</p>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP — max 5 Mo</p>
                    </>
                  )}
                </div>
                {form.imageUrl && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    className="text-xs text-red-400 hover:text-red-600 mt-1">
                    Retirer la photo
                  </button>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${form.epinglee ? 'bg-royal' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.epinglee ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-text-sub">Épingler en bandeau d'accueil</span>
                <input type="checkbox" className="hidden" checked={form.epinglee}
                  onChange={e => setForm(f => ({ ...f, epinglee: e.target.checked }))} />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={save}
                className="flex-1 btn-royal text-[11px]">
                {editing ? 'Modifier' : 'Publier'}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-text-sub">
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste annonces */}
        <div className="lg:col-span-3 space-y-4">
          {annonces.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-card border border-azure text-text-sub">
              Aucune annonce publiée
            </div>
          ) : (
            annonces.map(a => (
              <div key={a._id} className={`bg-white rounded-xl shadow-card border p-5 flex gap-4 ${a.epinglee ? 'border-gold/40' : 'border-azure'}`}>
                {a.imageUrl && (
                  <img src={a.imageUrl} alt={a.titre}
                    className="w-20 h-20 object-cover rounded-lg border border-azure flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {a.epinglee && <span className="text-[9px] tracking-[2px] uppercase bg-gold text-royal px-2 py-0.5 rounded font-bold">★ Épinglée</span>}
                    <p className="font-semibold text-royal truncate">{a.titre}</p>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed line-clamp-2">{a.contenu}</p>
                  <div className="flex gap-3 mt-3">
                    <button type="button" onClick={() => edit(a)}
                      className="text-xs text-royal hover:text-sky font-semibold">✏️ Modifier</button>
                    <button type="button" onClick={() => del(a._id)}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold">🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
