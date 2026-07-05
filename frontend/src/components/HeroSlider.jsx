// src/components/HeroSlider.jsx
// Diaporama automatique pour le hero de l'accueil
// Les images sont contrôlées par l'admin via Contenu → Accueil → Images Hero
import { useState, useEffect, useCallback } from 'react';

export default function HeroSlider({ images = [], interval = 5000, children, fallbackGradient = true }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  // Filtrer les images vides
  const slides = images.filter(Boolean);

  const goTo = useCallback((index) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 600); // durée du fondu
  }, []);

  // Rotation automatique
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [current, slides.length, interval, goTo]);

  return (
    <div className="relative min-h-[88vh] flex items-center overflow-hidden hero-gradient hero-pattern">

      {/* Images en fondu */}
      {slides.length > 0 ? (
        <>
          {slides.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{
                backgroundImage: `url(${src})`,
                opacity: i === current ? (fading ? 0 : 1) : 0,
              }}
            />
          ))}
          {/* Overlay toujours présent pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-r from-royal-deep/90 via-royal-deep/70 to-royal-deep/40" />
        </>
      ) : fallbackGradient ? (
        // Pas d'image : gradient seul
        <div className="absolute inset-0" />
      ) : null}

      {/* Cercles décoratifs animés */}
      <div className="absolute top-1/4 right-10 w-64 h-64 rounded-full bg-gold/5 animate-float hidden lg:block" />
      <div className="absolute bottom-1/4 right-32 w-32 h-32 rounded-full bg-sky/10 animate-float hidden lg:block"
        style={{ animationDelay: '1.5s' }} />

      {/* Contenu du hero (slot) */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Indicateurs de slide (points) */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-gold'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Flèches navigation (si plusieurs slides) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo((current - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-white/30 text-white/70 hover:text-gold hover:border-gold/50 transition-colors flex items-center justify-center text-xl"
            aria-label="Image précédente"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo((current + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 border border-white/30 text-white/70 hover:text-gold hover:border-gold/50 transition-colors flex items-center justify-center text-xl"
            aria-label="Image suivante"
          >
            ›
          </button>
        </>
      )}

      {/* Vague de transition bas */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L1440 60L1440 20C1200 55 900 5 720 20C540 35 240 0 0 20L0 60Z" fill="#FAFBFF"/>
        </svg>
      </div>
    </div>
  );
}
