// src/admin/GalleryManager.jsx
// Composant réutilisable pour gérer une galerie multi-photos
// (utilisé pour les salles d'espaces ET les pièces de collections)
import { useState, useRef } from 'react';
import api from '../services/api';

/**
 * Props :
 * - galerie: tableau de photos [{ _id, url, alt, legende, isCouverture, ordre }]
 * - uploadUrl: endpoint POST pour ajouter des photos en lot (ex: /content/espaces/:id/salles/:salleId/galerie)
 * - photoBaseUrl: endpoint de base pour PUT/PATCH/DELETE d'une photo (même chemin sans /galerie à la fin)
 * - onChange: callback(nouvelleEntiteParent) appelé après chaque opération réussie
 */
export default function GalleryManager({ galerie = [], uploadUrl, baseUrl, onChange, flash, flashErr }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [editForm, setEditForm]   = useState({ legende: '', alt: '' });
  const [dragIndex, setDragIndex] = useState(null);
  const fileRef = useRef();

  const sorted = [...galerie].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  // ── Upload en lot ──────────────────────────────────────────
  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setUploading(true);
    try {
      // 1. Upload physique de tous les fichiers vers /media/upload (lot unique)
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data: uploadData } = await api.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2. Ajouter les URLs résultantes à la galerie de l'entité (salle ou pièce)
      const photos = uploadData.medias.map(m => ({ url: m.url, alt: '', legende: '' }));
      const { data } = await api.post(uploadUrl, { photos });
      onChange(data);
      flash(`✅ ${files.length} photo(s) ajoutée(s)`);
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ── Définir comme couverture ───────────────────────────────
  async function setCouverture(photoId) {
    try {
      const { data } = await api.patch(`${baseUrl}/${photoId}/couverture`);
      onChange(data);
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur');
    }
  }

  // ── Supprimer une photo ────────────────────────────────────
  async function deletePhoto(photoId) {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      const { data } = await api.delete(`${baseUrl}/${photoId}`);
      onChange(data);
      flash('✅ Photo supprimée');
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur');
    }
  }

  // ── Modifier légende/alt ───────────────────────────────────
  function openEdit(photo) {
    setEditPhoto(photo._id);
    setEditForm({ legende: photo.legende || '', alt: photo.alt || '' });
  }

  async function saveEdit() {
    try {
      const { data } = await api.put(`${baseUrl}/${editPhoto}`, editForm);
      onChange(data);
      setEditPhoto(null);
      flash('✅ Photo modifiée');
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur');
    }
  }

  // ── Réorganiser par glisser-déposer (entre vignettes) ──────
  async function persistOrder(newSorted) {
    try {
      const { data } = await api.put(`${baseUrl.replace(/\/galerie$/, '')}-ordre`, {
        ordre: newSorted.map(p => p._id),
      });
      onChange(data);
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur de réorganisation');
    }
  }

  function onThumbDragStart(i) { setDragIndex(i); }
  function onThumbDragOver(e) { e.preventDefault(); }
  function onThumbDrop(i) {
    if (dragIndex === null || dragIndex === i) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(i, 0, moved);
    setDragIndex(null);
    persistOrder(reordered);
  }

  return (
    <div>
      {/* Zone de drop multi-fichiers */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors mb-4 ${
          dragOver ? 'border-sand bg-sand/10' : 'border-gray-300 hover:border-sand/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-sand text-sm font-medium">⏳ Envoi en cours...</p>
        ) : (
          <>
            <p className="text-2xl mb-1">📸</p>
            <p className="text-sm text-gray-600 font-medium">
              Glissez plusieurs photos ici, ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — plusieurs fichiers à la fois</p>
          </>
        )}
      </div>

      {/* Grille de la galerie */}
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Aucune photo dans cette galerie</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {sorted.map((photo, i) => (
            <div
              key={photo._id}
              draggable
              onDragStart={() => onThumbDragStart(i)}
              onDragOver={onThumbDragOver}
              onDrop={() => onThumbDrop(i)}
              className={`group relative rounded-lg overflow-hidden border-2 cursor-move bg-gray-50 ${
                photo.isCouverture ? 'border-sand' : 'border-transparent'
              }`}
            >
              <img src={photo.url} alt={photo.alt || ''} className="w-full h-24 object-cover" />

              {photo.isCouverture && (
                <span className="absolute top-1 left-1 bg-sand text-brown-deep text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ★ Couverture
                </span>
              )}

              <div className="absolute inset-0 bg-night/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                {!photo.isCouverture && (
                  <button
                    onClick={() => setCouverture(photo._id)}
                    className="text-[10px] bg-sand text-brown-deep px-2 py-0.5 rounded font-semibold hover:bg-gold w-full"
                  >
                    ★ Couverture
                  </button>
                )}
                <button
                  onClick={() => openEdit(photo)}
                  className="text-[10px] bg-white text-brown-deep px-2 py-0.5 rounded font-semibold hover:bg-gray-100 w-full"
                >
                  ✏️ Légende
                </button>
                <button
                  onClick={() => deletePhoto(photo._id)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-semibold hover:bg-red-600 w-full"
                >
                  🗑️ Supprimer
                </button>
              </div>

              {photo.legende && (
                <p className="text-[10px] text-gray-500 px-1 py-0.5 truncate bg-white">{photo.legende}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal édition légende/alt */}
      {editPhoto && (
        <div
          className="fixed inset-0 z-50 bg-night/70 flex items-center justify-center px-4"
          onClick={() => setEditPhoto(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-heading font-semibold text-brown-deep mb-4">Légende de la photo</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase mb-1 block">Légende affichée</label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40"
                  value={editForm.legende}
                  onChange={e => setEditForm(f => ({ ...f, legende: e.target.value }))}
                  placeholder="Ex: Vue de la salle principale"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase mb-1 block">
                  Texte alternatif (accessibilité/SEO)
                </label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sand/40"
                  value={editForm.alt}
                  onChange={e => setEditForm(f => ({ ...f, alt: e.target.value }))}
                  placeholder="Ex: Photo de la salle des bijoux anciens"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={saveEdit}
                className="flex-1 bg-brown-deep text-ivory py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors"
              >
                💾 Enregistrer
              </button>
              <button
                onClick={() => setEditPhoto(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
