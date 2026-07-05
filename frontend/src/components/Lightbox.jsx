// src/components/Lightbox.jsx
// Visionneuse plein écran pour une galerie de photos, avec navigation clavier/clic
import { useEffect, useCallback } from 'react';

export default function Lightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index];

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate((index + 1) % photos.length);
  }, [index, photos.length, onNavigate]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, onClose]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-night/95 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-ivory/80 hover:text-ivory text-3xl leading-none w-10 h-10 flex items-center justify-center"
        aria-label="Fermer"
      >
        ×
      </button>

      {/* Compteur */}
      <div className="absolute top-4 left-4 text-ivory/60 text-sm font-mono">
        {index + 1} / {photos.length}
      </div>

      {/* Précédent */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 md:left-6 text-ivory/70 hover:text-ivory text-4xl w-12 h-12 flex items-center justify-center"
          aria-label="Photo précédente"
        >
          ‹
        </button>
      )}

      {/* Image + légende */}
      <div className="max-w-5xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img
          src={photo.url}
          alt={photo.alt || ''}
          className="max-w-full max-h-[75vh] object-contain rounded shadow-2xl"
        />
        {photo.legende && (
          <p className="text-ivory/80 text-sm mt-4 text-center max-w-2xl font-heading italic">
            {photo.legende}
          </p>
        )}
      </div>

      {/* Suivant */}
      {photos.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 md:right-6 text-ivory/70 hover:text-ivory text-4xl w-12 h-12 flex items-center justify-center"
          aria-label="Photo suivante"
        >
          ›
        </button>
      )}

      {/* Vignettes en bas (si plusieurs photos) */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2"
          onClick={e => e.stopPropagation()}
        >
          {photos.map((p, i) => (
            <button
              key={p._id || i}
              onClick={() => onNavigate(i)}
              className={`w-12 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                i === index ? 'border-sand' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
