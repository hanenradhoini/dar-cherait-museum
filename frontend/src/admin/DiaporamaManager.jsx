// src/admin/DiaporamaManager.jsx
import { useState, useRef } from 'react';
import api from '../services/api';

export default function DiaporamaManager({ images = [], onChange, onSave, flash, flashErr }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  async function uploadImages(fileList) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('images', f));
      const { data } = await api.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrls = data.medias.map(m => m.url);
      onChange([...images, ...newUrls]);
      flash(`✅ ${files.length} image(s) ajoutée(s) au diaporama`);
    } catch (e) {
      flashErr(e.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(from, to) {
    const arr = [...images];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
  }

  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-brown-deep mb-1">
        🎞️ Diaporama de l'accueil
      </h2>
      <p className="text-gray-400 text-xs mb-4">
        Ces images défilent automatiquement (5 sec.) dans le hero de la page d'accueil.
        Ajoutez plusieurs photos pour créer un diaporama attractif.
      </p>

      {/* Zone d'upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-sand/50 rounded-xl p-5 text-center cursor-pointer transition-colors mb-4 bg-white"
      >
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { uploadImages(e.target.files); e.target.value = ''; }} />
        {uploading ? (
          <p className="text-sand text-sm font-medium">⏳ Upload en cours...</p>
        ) : (
          <>
            <p className="text-2xl mb-1">🖼️</p>
            <p className="text-sm text-gray-600 font-medium">
              Glissez plusieurs photos ici ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — plusieurs fichiers à la fois</p>
          </>
        )}
      </div>

      {/* Grille des slides */}
      {images.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          Aucune image dans le diaporama.
        </p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {images.map((url, i) => (
            <div key={`${url}-${i}`}
              className={`group relative rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-sand' : 'border-transparent'}`}>
              <img src={url} alt="" className="w-full h-20 object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-sand text-brown-deep text-[9px] font-bold px-1.5 py-0.5 rounded">
                  1ère
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                {i > 0 && (
                  <button type="button" onClick={() => moveImage(i, i - 1)}
                    className="text-[10px] bg-white text-gray-700 px-2 py-0.5 rounded w-full hover:bg-gray-100">
                    ← Avant
                  </button>
                )}
                {i < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(i, i + 1)}
                    className="text-[10px] bg-white text-gray-700 px-2 py-0.5 rounded w-full hover:bg-gray-100">
                    Après →
                  </button>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded w-full hover:bg-red-600">
                  🗑️ Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => onSave({ heroImagesSlider: images })}
        className="bg-brown-deep text-ivory px-6 py-2 text-sm rounded hover:bg-sand hover:text-brown-deep transition-colors">
        💾 Sauvegarder le diaporama ({images.length} image{images.length > 1 ? 's' : ''})
      </button>
    </section>
  );
}