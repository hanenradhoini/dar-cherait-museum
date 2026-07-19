// src/pages/HomePage.jsx — Bleu Royal + Or + Diaporama en card + Annonces extensibles
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
      }, { threshold: 0.12 });
      obs.observe(el);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ref;
}

function Reveal({ children, delay = 0, left = false, className = '' }) {
  const ref = useReveal(delay);
  return <div ref={ref} className={`${left ? 'reveal-left' : 'reveal'} ${className}`}>{children}</div>;
}

/* ─────────────────────────────────────────────
   useCountUp — anime un nombre de 0 vers sa valeur finale
   quand l'élément entre dans le viewport (déclenché une seule fois)
───────────────────────────────────────────── */
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = null;
        function step(ts) {
          if (start === null) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setValue(Number((target * progress).toFixed(1)));
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return [ref, value];
}

/* ─────────────────────────────────────────────
   useTypewriter — révèle un texte caractère par caractère,
   avec un délai de démarrage. Retourne le nombre de caractères
   actuellement visibles.
───────────────────────────────────────────── */
function useTypewriter(text, speed = 35, startDelay = 500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let i = 0;
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return count;
}

/* ─────────────────────────────────────────────
   TarifCard — carte tarif avec compteur animé + léger effet 3D au survol
───────────────────────────────────────────── */
function TarifCard({ t, isLast }) {
  const [countRef, value] = useCountUp(t?.prix ?? 0);

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
  }
  function handleMouseLeave(e) {
    e.currentTarget.style.transform = '';
  }

  return (
    <div
      ref={countRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out' }}
      className={`rounded-xl p-7 text-center border text-white ${
        isLast
          ? 'bg-royal border-royal shadow-royal'
          : 'bg-sky border-sky shadow-card'
      }`}
    >
      <div className="text-[9px] tracking-[3px] uppercase mb-3 font-bold text-gold">
        {t?.label || '—'}
      </div>
      <div className="font-display text-4xl tabular-nums text-gold">
        {value}
      </div>
      <div className="text-[10px] mt-2 tracking-wide text-white/70">
        DT / personne
      </div>
      {isLast && (
        <div className="text-[9px] tracking-[2px] uppercase text-white/50 mt-2">Tout inclus</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Effet de fragmentation (shatter) — chaque photo est découpée
   en tuiles qui s'assemblent/se dispersent avec rotation aléatoire
───────────────────────────────────────────── */
const SHATTER_COLS = 6;
const SHATTER_ROWS = 4;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function ShatterTile({ src, row, col, isActive, tileIndex, slideIndex }) {
  const seedBase = slideIndex * 97 + tileIndex * 3.7;
  const rx = (seededRandom(seedBase + 1) - 0.5) * 220;
  const ry = (seededRandom(seedBase + 2) - 0.5) * 220;
  const rot = (seededRandom(seedBase + 3) - 0.5) * 150;
  const delay = tileIndex * 9;

  return (
    <div
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${SHATTER_COLS * 100}% ${SHATTER_ROWS * 100}%`,
        backgroundPosition: `${(col / (SHATTER_COLS - 1)) * 100}% ${(row / (SHATTER_ROWS - 1)) * 100}%`,
        transform: isActive
          ? 'translate(0, 0) rotate(0deg) scale(1)'
          : `translate(${rx}px, ${ry}px) rotate(${rot}deg) scale(0.4)`,
        opacity: isActive ? 1 : 0,
        transition: `transform 850ms cubic-bezier(0.22, 0.8, 0.3, 1) ${delay}ms, opacity 600ms ease ${delay}ms`,
        willChange: 'transform, opacity',
      }}
    />
  );
}

function ShatterSlide({ src, isActive, slideIndex }) {
  const tiles = [];
  for (let r = 0; r < SHATTER_ROWS; r++) {
    for (let c = 0; c < SHATTER_COLS; c++) {
      const idx = r * SHATTER_COLS + c;
      tiles.push(
        <ShatterTile key={idx} src={src} row={r} col={c}
          isActive={isActive} tileIndex={idx} slideIndex={slideIndex} />
      );
    }
  }
  return (
    <div
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${SHATTER_COLS}, 1fr)`,
        gridTemplateRows: `repeat(${SHATTER_ROWS}, 1fr)`,
        zIndex: isActive ? 1 : 0,
        pointerEvents: 'none',
      }}
      aria-hidden={!isActive}
    >
      {tiles}
    </div>
  );
}

/* Diaporama hero — taille agrandie (plus haut + plus large grâce à sa colonne
   qui occupe désormais 3/5 de la largeur au lieu de 1/2, voir grille plus bas) */
function HeroCardSlider({ images = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = images.length;

  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % total), 5000);
    return () => clearInterval(timer);
  }, [total, paused]);

  if (total === 0) return (
    <div className="w-full h-[460px] md:h-[560px] lg:h-[620px] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
      <span className="font-display text-5xl text-gold/30">✦</span>
    </div>
  );

  return (
    <div
      className="relative w-full h-[460px] md:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((url, i) => (
        <ShatterSlide key={`${url}-${i}`} src={url} isActive={i === index} slideIndex={i} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/40 via-transparent to-transparent pointer-events-none z-[2]" />

      {total > 1 && (
        <>
          <button type="button" onClick={() => setIndex(i => (i - 1 + total) % total)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl">
            ‹
          </button>
          <button type="button" onClick={() => setIndex(i => (i + 1) % total)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl">
            ›
          </button>
          <div className="absolute bottom-4 right-5 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-gold' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AnnonceCard — carte cliquable qui s'étend en plein largeur
   (photo à gauche, texte à droite) puis se referme au 2e clic
───────────────────────────────────────────── */
function AnnonceCard({ annonce: a, expanded, onToggle }) {
  if (expanded) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <div className="bg-white rounded-2xl shadow-card border border-azure overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-64 md:h-full min-h-[280px]">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.titre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-royal-deep flex items-center justify-center">
                  <span className="font-display text-4xl text-gold/40">✦</span>
                </div>
              )}
              <span className="absolute top-3 left-3 text-[9px] tracking-[2px] uppercase bg-gold text-royal px-2.5 py-1 font-bold rounded-sm">
                Actualité
              </span>
            </div>
            <div className="p-8 flex flex-col">
              <button type="button" onClick={onToggle}
                className="self-end text-royal/50 hover:text-royal text-xs font-semibold tracking-wide mb-4 transition-colors">
                ✕ Fermer
              </button>
              <h3 className="font-heading text-2xl text-royal font-semibold leading-snug mb-4">
                {a.titre}
              </h3>
              <p className="text-sm text-text-sub leading-relaxed whitespace-pre-line">
                {a.contenu}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onToggle}
      className="h-full w-full flex flex-col text-left bg-white rounded-2xl shadow-card border border-azure overflow-hidden hover-lift group cursor-pointer">
      {a.imageUrl ? (
        <div className="relative h-48 flex-shrink-0 overflow-hidden">
          <img src={a.imageUrl} alt={a.titre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-royal/40 to-transparent" />
          <span className="absolute top-3 left-3 text-[9px] tracking-[2px] uppercase bg-gold text-royal px-2.5 py-1 font-bold rounded-sm">
            Actualité
          </span>
        </div>
      ) : (
        <div className="h-2 flex-shrink-0 bg-gradient-to-r from-royal to-sky" />
      )}
      <div className="p-6 flex flex-col flex-1">
        {!a.imageUrl && (
          <span className="text-[9px] tracking-[2px] uppercase text-gold font-bold block mb-2">Actualité</span>
        )}
        <h3 className="font-heading text-lg text-royal font-semibold leading-snug mb-3">{a.titre}</h3>
        <p className="text-sm text-text-sub leading-relaxed line-clamp-3">{a.contenu}</p>
      </div>
    </button>
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState(null);
  const [espaces, setEspaces]   = useState([]);
  const [annonces, setAnnonces] = useState([]);
  const [expandedAnnonceId, setExpandedAnnonceId] = useState(null);

  useEffect(() => {
    api.get('/content/settings').then(r => setSettings(r.data.settings)).catch(()=>{});
    api.get('/content/espaces').then(r => setEspaces(r.data.espaces||[])).catch(()=>{});
    api.get('/content/annonces').then(r => setAnnonces(r.data.annonces||[])).catch(()=>{});
  }, []);

  const hero      = settings?.heroImages?.accueil;
  const heroImages = Array.isArray(settings?.heroImagesSlider)
    ? settings.heroImagesSlider.filter(Boolean)
    : hero ? [hero] : [];
  const tarifs    = settings?.tarifs || [];
  const annEp     = annonces.find(a => a.epinglee);
  const autresAnn = annonces.filter(a => !a.epinglee).slice(0, 3);

  function toggleAnnonce(id) {
    setExpandedAnnonceId(current => (current === id ? null : id));
  }

  /* ── Titre hero en effet Typewriter ── */
  const titreLigne1 = "Découvrez la splendeur de la ";
  const titreLigne2 = "civilisation tunisienne";
  const titreComplet = titreLigne1 + titreLigne2;
  const typedCount = useTypewriter(titreComplet, 32, 550);
  const typingEnCours = typedCount < titreComplet.length;
  const ligne1Visible = titreLigne1.slice(0, Math.min(typedCount, titreLigne1.length));
  const ligne2Visible = titreLigne2.slice(0, Math.max(0, typedCount - titreLigne1.length));

  return (
    <div className="bg-[#D6E4F5]">

      {/* ── Bandeau annonce épinglée ── */}
      {annEp && (
        <div className="bg-royal text-white px-6 py-2.5 flex items-center justify-center gap-4 text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0 animate-pulse" />
          <p className="text-xs tracking-wide">{annEp.titre}</p>
          <span className="text-[9px] tracking-[2px] uppercase bg-gold text-royal-deep px-2.5 py-1 font-bold flex-shrink-0">
            Actualité
          </span>
        </div>
      )}

      {/* ── HERO ── fond bleu royal garanti + image hero visible en arrière-plan */}
      <section className="relative overflow-hidden bg-royal-deep">
        {/* Image hero en fond, bien visible (opacité relevée) */}
        {hero && (
          <div className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: `url(${hero})` }} />
        )}
        {/* Voile bleu allégé : fort côté texte (gauche), léger côté photo (droite) */}
        <div className="absolute inset-0 bg-gradient-to-r from-royal-deep/70 via-royal-deep/40 to-royal-deep/10" />
        {/* Cercle décoratif */}
        <div className="absolute top-1/3 left-[5%] w-64 h-64 rounded-full bg-gold/5 animate-float hidden lg:block" />

        <div className="max-w-7xl mx-auto px-8 md:px-16 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            {/* ── Texte gauche (2/5 de la largeur) ── */}
            <div className="lg:col-span-2 text-left">
              <div className="section-tag mb-5 animate-slide-right opacity-0"
                style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                ✦ &nbsp; Musée d'art & traditions · Tozeur, Tunisie
              </div>

              {/* Titre : effet Typewriter + fade up */}
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-white leading-[1.25] mb-5 min-h-[3.6em] md:min-h-[3.3em] lg:min-h-[3.45em] animate-fade-up opacity-0 [text-shadow:_0_2px_16px_rgba(10,20,50,0.85)]"
                style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
                {ligne1Visible}
                <span className="text-gold">{ligne2Visible}</span>
                {typingEnCours && (
                  <span className="inline-block w-[3px] md:w-[4px] h-[0.85em] bg-gold ml-1 align-middle animate-pulse" />
                )}
              </h1>

              <div className="w-12 h-0.5 bg-gold mb-6 animate-fade-in opacity-0"
                style={{ animationDelay: '600ms', animationFillMode: 'forwards' }} />
              <p className="text-white/85 text-sm md:text-base leading-relaxed mb-10 max-w-lg animate-fade-in opacity-0 [text-shadow:_0_1px_8px_rgba(10,20,50,0.7)]"
                style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
                Trois espaces d'exception pour un voyage unique à travers l'histoire,
                l'art et les traditions de la Tunisie. Une expérience culturelle inoubliable au cœur du désert.
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-up opacity-0"
                style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
                <Link to="/expositions" className="btn-gold">Explorer le musée</Link>
                <Link to="/contact" className="btn-outline-white">Réserver ma visite</Link>
              </div>
              <div className="flex flex-wrap gap-10 mt-14 pt-8 border-t border-white/20 animate-fade-in opacity-0"
                style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}>
                {[['3','Espaces'],['500+','Pièces'],['30+',"Ans d'histoire"]].map(([n,l]) => (
                  <div key={l}>
                    <div className="font-display text-3xl text-gold">{n}</div>
                    <div className="text-[10px] tracking-[2px] uppercase text-white/60 mt-1">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Diaporama card droite (3/5 de la largeur, agrandi) ── */}
            <div className="lg:col-span-3 animate-fade-in opacity-0"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <HeroCardSlider images={heroImages} />
            </div>

          </div>
        </div>

      </section>

      {/* ── Annonces ── */}
      {autresAnn.length > 0 && (
        <section className="bg-[#D6E4F5] py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="section-tag text-center mb-2">✦ &nbsp; Actualités</div>
            <h2 className="font-display text-3xl text-royal text-center mb-8">Nos dernières nouvelles</h2>
            <div className={`grid gap-6 ${
              expandedAnnonceId
                ? 'grid-cols-1'
                : autresAnn.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto'
                : autresAnn.length === 2 ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {autresAnn
                .filter(a => !expandedAnnonceId || (a._id ?? a.titre) === expandedAnnonceId)
                .map((a, i) => (
                  <Reveal key={a._id ?? `a-${i}`} delay={expandedAnnonceId ? 0 : i * 120} className="h-full">
                    <AnnonceCard
                      annonce={a}
                      expanded={(a._id ?? a.titre) === expandedAnnonceId}
                      onToggle={() => toggleAnnonce(a._id ?? a.titre)}
                    />
                  </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Espaces ── */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Reveal>
          <div className="text-center mb-12">
            <div className="section-tag mb-3">✦ &nbsp; Nos espaces</div>
            <h2 className="font-display text-4xl text-royal mb-3">Explorez le musée</h2>
            <div className="w-12 h-0.5 bg-gold mx-auto mb-3" />
            <p className="text-text-sub text-sm max-w-md mx-auto">Trois univers immersifs pour un voyage au cœur de la civilisation tunisienne</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(espaces.length > 0 ? espaces.slice(0,3) : [
            { titre: 'Arts & Traditions', description: 'Artisanat, costumes et savoir-faire ancestraux de la Tunisie profonde.' },
            { titre: 'Médina 1001 Nuits', description: "Reconstitution d'une médina tunisienne du XIXe siècle.", featured: true },
            { titre: 'Dar Zamen', description: 'Vie quotidienne tunisienne à travers les siècles.' },
          ]).map((e, i) => {
            const imageUrl = e.imageUrl
              || e.salles?.flatMap(s=>s.galerie||[]).find(p=>p.isCouverture)?.url
              || e.salles?.flatMap(s=>s.galerie||[])[0]?.url;
            return (
              <Reveal key={e._id ?? `e-${i}`} delay={i * 150}>
                <Link to="/expositions"
                  className={`group block bg-white rounded-xl overflow-hidden shadow-card hover-lift border border-azure ${i===1 ? 'border-t-4 border-t-gold' : ''}`}>
                  <div className="relative h-52 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={e.titre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-royal-deep flex items-center justify-center">
                        <span className="font-display text-4xl text-gold/40">✦</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {i===1 && (
                      <div className="absolute top-3 right-3 bg-gold text-royal-deep text-[9px] tracking-[2px] uppercase px-2.5 py-1 font-bold">
                        ★ Phare
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-lg text-royal font-semibold mb-2 group-hover:text-sky transition-colors">{e.titre}</h3>
                    <p className="text-xs text-text-sub leading-relaxed line-clamp-2">{e.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-royal text-xs font-bold tracking-wide group-hover:gap-3 transition-all">
                      Découvrir <span className="text-gold">→</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={500}>
          <div className="text-center mt-10">
            <Link to="/expositions" className="btn-gold">Voir toutes les expositions</Link>
          </div>
        </Reveal>
      </section>

      {/* ── Tarifs ── */}
      {tarifs.length > 0 && (
        <section className="bg-[#D6E4F5] pt-14 pb-10 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-royal/5 animate-float hidden lg:block" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <Reveal>
              <div className="text-center mb-12">
                <div className="section-tag mb-3">✦ &nbsp; Tarifs & Horaires</div>
                <h2 className="font-display text-4xl text-royal mb-3">Planifiez votre visite</h2>
                <div className="w-12 h-0.5 bg-gold mx-auto" />
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tarifs.map((t, i) => (
                <Reveal key={t?.espace ?? `t-${i}`} delay={i * 80}>
                  <TarifCard t={t} isLast={i === tarifs.length - 1} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA final + Horaires ── */}
      <section className="bg-[#D6E4F5] pt-10 pb-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 15% 30%, rgba(27,58,122,0.05) 0%, transparent 45%), radial-gradient(circle at 85% 70%, rgba(201,168,76,0.08) 0%, transparent 40%)'
        }} />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Texte + boutons réservation */}
            <Reveal className="text-center lg:text-left">
              <div className="section-tag mb-4">✦ &nbsp; Réservez dès maintenant</div>
              <h2 className="font-display text-4xl text-royal mb-4">Vivez l'expérience Dar Cheraït</h2>
              <p className="text-text-sub text-sm leading-relaxed mb-8 max-w-md lg:max-w-none mx-auto lg:mx-0">
                Individuel, en famille ou en groupe scolaire — notre équipe vous accueille tous les jours à Tozeur.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link to="/contact" className="btn-gold hover:scale-105 transition-transform">Réserver maintenant</Link>
                <Link to="/informations" className="btn-outline hover:scale-105 transition-transform">Nous contacter</Link>
              </div>
            </Reveal>

            {/* Card Horaires animée */}
            {settings?.horaires?.length > 0 && (
              <Reveal delay={150}>
                <div className="bg-royal rounded-2xl shadow-royal border border-royal p-7">
                  <div className="text-[10px] tracking-[4px] uppercase text-gold font-bold mb-1">✦ Horaires d'ouverture</div>
                  <div className="w-10 h-0.5 bg-gold mb-4" />
                  <ul className="space-y-2">
                    {settings.horaires.map((h, i) => (
                      <Reveal key={h.jour} delay={200 + i * 60}>
                        <li className="flex justify-between items-center text-sm py-1.5 border-b border-white/10 last:border-0">
                          <span className="capitalize text-white font-medium">{h.jour}</span>
                          <span className={`font-semibold ${h.ferme ? 'text-red-300' : 'text-gold'}`}>
                            {h.ferme ? 'Fermé' : `${h.ouvertureJournee} – ${h.fermetureJournee}`}
                          </span>
                        </li>
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}