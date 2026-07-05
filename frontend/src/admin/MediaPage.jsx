// src/admin/MediaPage.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function MediaPage() {
  const [medias, setMedias]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [altVal, setAltVal]   = useState('');
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const fileRef = useRef();
  const dropRef = useRef();

  async function load() {
    setLoading(true);
    const { data } = await api.get(`/media?page=${page}&limit=24`);
    setMedias(data.medias); setPages(data.pages);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  async function handleUpload(files) {
    if (!files?.length) return;

    const allFiles = Array.from(files);
    const images = allFiles.filter(f => f.type.startsWith('image/'));
    const rejected = allFiles.filter(f => !f.type.startsWith('image/'));

    if (rejected.length > 0) {
      alert(
        `⚠️ ${rejected.length} fichier(s) ignoré(s) : seules les images sont acceptées (JPG, PNG, WEBP, GIF, SVG).\n` +
        `Les vidéos ne sont pas encore supportées par la bibliothèque média.\n\n` +
        `Fichiers rejetés : ${rejected.map(f => f.name).join(', ')}`
      );
    }

    if (images.length === 0) { setUploading(false); return; }

    setUploading(true);
    const formData = new FormData();
    images.forEach(f => formData.append('images', f));
    try {
      await api.post('/media/upload', formData, { headers:{ 'Content-Type':'multipart/form-data' } });
      setPage(1); load();
    } catch (e) {
      const msg = e.response?.data?.message || 'Erreur upload';
      console.error('Réponse complète :', e.response?.data);
      alert(msg);
    }
    finally { setUploading(false); }
  }

  async function saveAlt() {
    await api.put(`/media/${editing._id}`, { alt:altVal });
    setEditing(null); load();
  }

  async function deleteMedia(m, force=false) {
    const url = force ? `/media/${m._id}/force` : `/media/${m._id}`;
    try {
      await api.delete(url); load();
    } catch (e) {
      if (e.response?.status === 409) {
        if (window.confirm('Ce fichier est utilisé. Forcer la suppression ?')) deleteMedia(m, true);
      } else { alert(e.response?.data?.message || 'Erreur'); }
    }
  }

  // Drag & drop
  function onDrop(e) {
    e.preventDefault();
    dropRef.current?.classList.remove('border-sand', 'bg-sand/10');
    handleUpload(e.dataTransfer.files);
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-brown-deep mb-6">Bibliothèque de médias</h1>

      {/* Zone upload */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add('border-sand','bg-sand/10'); }}
        onDragLeave={() => dropRef.current?.classList.remove('border-sand','bg-sand/10')}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center mb-6 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => handleUpload(e.target.files)} />
        {uploading
          ? <p className="text-sand font-medium">Envoi en cours...</p>
          : <>
              <p className="text-4xl mb-2">🖼️</p>
              <p className="text-gray-600 font-medium">Glissez vos images ici ou cliquez pour sélectionner</p>
              <p className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP, GIF, SVG — max 5 Mo par fichier</p>
            </>
        }
      </div>

      {/* Galerie */}
      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-gray-200 animate-pulse rounded"/>)}
        </div>
      ) : medias.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune image uploadée</div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {medias.map(m => (
            <div key={m._id} className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
              <img src={m.url} alt={m.alt || m.originalName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
              <div className="absolute inset-0 bg-night/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-white text-xs truncate mb-1">{m.originalName}</p>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(m); setAltVal(m.alt||''); }}
                    className="flex-1 bg-sand/80 text-brown-deep text-xs py-1 rounded">✏️</button>
                  <button onClick={() => { if(window.confirm('Supprimer ?')) deleteMedia(m); }}
                    className="bg-red-500/80 text-white text-xs px-2 py-1 rounded">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">←</button>
          <span className="px-3 py-1 text-sm">{page} / {pages}</span>
          <button disabled={page===pages} onClick={() => setPage(p=>p+1)} className="px-3 py-1 text-sm border rounded disabled:opacity-40">→</button>
        </div>
      )}

      {/* Modal édition alt */}
      {editing && (
        <div className="fixed inset-0 bg-night/70 z-50 flex items-center justify-center px-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-heading text-lg text-brown-deep mb-4">Modifier l'image</h3>
            <img src={editing.url} alt="" className="w-full h-32 object-cover rounded mb-4"/>
            <p className="text-xs text-gray-400 mb-1">Texte alternatif (SEO & accessibilité)</p>
            <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sand/40"
              value={altVal} onChange={e => setAltVal(e.target.value)} placeholder="Description de l'image..." />
            <div className="flex gap-2">
              <button onClick={saveAlt} className="flex-1 bg-brown-deep text-ivory py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">Enregistrer</button>
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
