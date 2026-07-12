// src/components/HeroSlider.jsx
// Diaporama automatique pour le hero de l'accueil
// Les images sont contrôlées par l'admin via Contenu → Accueil → Images Hero
// Transition : les photos se fragmentent en tuiles qui s'envolent pour révéler la suivante
import { useState, useEffect, useCallback } from 'react';

const COLS = 6;
const ROWS = 4;

// Générateur pseudo-aléatoire déterministe (même résultat à chaque rendu, pas de flash au montage)
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function Tile({ src, row, col, isActive, tileIndex, slideIndex }) {
  const seedBase = slideIndex * 97 + tileIndex * 3.7;
  const rx = (seededRandom(seedBase + 1) - 0.5) * 260;
  const ry = (seededRandom(seedBase + 2) - 0.5) * 260;
  const rot = (seededRandom(seedBase + 3) - 0.5) * 160;
  const delay = tileIndex * 9;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
        transform: isActive
          ? 'translate(0, 0) rotate(0deg) scale(1)'
          : `translate(${rx}px, ${ry}px) rotate(${rot}deg) scale(0.4)`,
        opacity: isActive ? 1 : 0,
        transition: `transform 900ms cubic-bezier(0.22, 0.8, 0.3, 1) ${delay}ms, opacity 650ms ease ${delay}ms`,
        willChange: 'transform, opacity',
      }}
    />
  );
}

function SlideTiles({ src, isActive, slideIndex }) {
  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      tiles.push(
        <Tile
          key={idx}
          src={src}
          row={r}
          col={c}
          isActive={isActive}
          tileIndex={idx}
          slideIndex={slideIndex}
        />
      );
    }
  }
  return (
    <div
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        zIndex: isActive ? 1 : 0,
        pointerEvents: 'none',
      }}
      aria-hidden={!isActive}
    >
      {tiles}
    </div>
  );
}

export default function HeroSlider({ images = [], interval = 5000, children, fallbackGradient = true }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = images.filter(Boolean);

  const goTo = useCallback((index) => {
    setCurrent(((index % slides.length) + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Rotation automatique (pause au survol)
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, interval);
    return () => clearInterval(timer);
  }, [slides.length, interval, paused]);

  return (
    <div
      className="relative min-h-[88vh] flex items-center overflow-hidden hero-gradient hero-pattern"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* Photos en transition fragmentée (shatter) */}
      {slides.length > 0 ? (
        <>
          {slides.map((src, i) => (
            <SlideTiles key={src} src={src} isActive={i === current} slideIndex={i} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-royal-deep/90 via-royal-deep/70 to-royal-deep/40 z-[2]" />
        </>
      ) : fallbackGradient ? (
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

      {/* Flèches navigation */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/30 text-white/70 bg-black/10 backdrop-blur-sm hover:text-gold hover:border-gold/50 hover:bg-black/20 transition-all duration-300 flex items-center justify-center text-xl"
            aria-label="Image précédente"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/30 text-white/70 bg-black/10 backdrop-blur-sm hover:text-gold hover:border-gold/50 hover:bg-black/20 transition-all duration-300 flex items-center justify-center text-xl"
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