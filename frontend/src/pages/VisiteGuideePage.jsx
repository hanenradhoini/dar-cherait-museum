// src/pages/VisiteGuideePage.jsx
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
      }, { threshold: 0.15 });
      obs.observe(el);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ref;
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useReveal(delay);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function VisiteGuideePage() {
  const [visite, setVisite]     = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/content/visite').then(r => setVisite(r.data.visite)).catch(console.error);
    api.get('/content/settings').then(r => setSettings(r.data.settings)).catch(console.error);
  }, []);

  const etapes = [...(visite?.etapes || [])].sort((a, b) => a.ordre - b.ordre);
  const dureeTotale = etapes.reduce((sum, e) => sum + (e.dureeMinutes || 0), 0);
  const fondContenu = settings?.fondsContenu?.visite;

  return (
    <div>
      {/* ── Bannière hero (uniquement si une image est définie) ── */}
      {settings?.heroImages?.visite && (
        <section className="h-64 md:h-80 flex items-end relative overflow-hidden hero-gradient hero-pattern">
          <div className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.heroImages.visite})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/85 to-transparent" />
          <div className="relative z-10 max-w-7xl mx-auto px-8 pb-10 w-full">
            <div className="section-tag mb-2">✦ Expérience guidée</div>
            <h1 className="font-display text-4xl md:text-5xl text-white">Visite Guidée</h1>
          </div>
        </section>
      )}

      {/* ── Fond de contenu (photo distincte, plein écran, fixe) ── */}
      <div className="relative min-h-screen">
        {fondContenu && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${fondContenu})`, backgroundAttachment: 'fixed' }}
          />
        )}
        {/* Overlay pour lisibilité, garde la photo visible en fond */}
        <div className={`absolute inset-0 ${fondContenu ? 'bg-royal-deep/75' : 'bg-[#D6E4F5]'}`} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

          {/* Titre de secours si aucune bannière hero définie */}
          {!settings?.heroImages?.visite && (
            <Reveal className="text-center mb-12">
              <div className="section-tag mb-2">✦ Expérience guidée</div>
              <h1 className={`font-display text-4xl md:text-5xl ${fondContenu ? 'text-white' : 'text-royal'}`}>
                Visite Guidée
              </h1>
            </Reveal>
          )}

          {/* Introduction */}
          {visite?.introduction && (
            <Reveal>
              <p className={`text-center text-lg max-w-2xl mx-auto mb-16 font-heading italic ${
                fondContenu ? 'text-white/90' : 'text-royal'
              }`}>
                "{visite.introduction}"
              </p>
            </Reveal>
          )}

          {/* Timeline déroulement */}
          {etapes.length > 0 && (
            <section className="mb-20">
              <Reveal>
                <div className="text-center mb-3">
                  <div className="section-tag mb-2">✦ &nbsp; Circuit de visite</div>
                  <h2 className={`font-display text-3xl mb-2 ${fondContenu ? 'text-white' : 'text-royal'}`}>
                    Déroulement de la visite
                  </h2>
                  {dureeTotale > 0 && (
                    <p className={`text-xs tracking-wide ${fondContenu ? 'text-white/70' : 'text-text-sub'}`}>
                      Durée totale estimée : environ {Math.round(dureeTotale)} minutes
                    </p>
                  )}
                </div>
              </Reveal>

              <div className="relative mt-12 max-w-2xl mx-auto">
                {/* Ligne verticale continue */}
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gold/40" />

                <div className="space-y-6">
                  {etapes.map((e, i) => (
                    <Reveal key={i} delay={i * 100}>
                      <div className="relative pl-16">
                        {/* Pastille numérotée */}
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gold text-royal-deep font-bold text-sm flex items-center justify-center shadow-gold z-10">
                          {e.ordre}
                        </div>

                        {/* Card glassmorphism */}
                        <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-card border border-white/40 flex gap-4 items-start">
                          {e.imageUrl && (
                            <img src={e.imageUrl} alt={e.titre}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[9px] tracking-[2px] uppercase text-gold font-bold mb-1">
                              Étape {e.ordre}
                            </p>
                            <h3 className="font-heading text-lg text-royal font-semibold">{e.titre}</h3>
                            {e.description && (
                              <p className="text-text-sub text-sm mt-1">{e.description}</p>
                            )}
                            {e.dureeMinutes > 0 && (
                              <p className="text-royal/60 text-xs mt-2 font-medium">⏱ {e.dureeMinutes} min</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Formules */}
          
          {/* Horaires & Langues */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {visite?.horairesDepart?.length > 0 && (
              <Reveal>
                <div className="bg-royal/95 backdrop-blur-md text-white rounded-xl p-8 shadow-royal h-full">
                  <h3 className="font-display text-2xl text-gold mb-4">Horaires de départ</h3>
                  <div className="flex flex-wrap gap-3">
                    {visite.horairesDepart.map(h => (
                      <span key={h} className="bg-white/10 border border-gold/30 px-4 py-2 text-sm font-mono rounded">{h}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
            {visite?.languesDisponibles?.length > 0 && (
              <Reveal delay={100}>
                <div className="bg-white/95 backdrop-blur-md border border-white/40 rounded-xl p-8 shadow-card h-full">
                  <h3 className="font-display text-2xl text-royal mb-4">Langues disponibles</h3>
                  <div className="flex flex-wrap gap-3">
                    {visite.languesDisponibles.map(l => (
                      <span key={l} className="bg-royal text-white px-4 py-2 text-sm rounded">{l}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </section>

          {/* Guides */}
          {visite?.guides?.length > 0 && (
            <section>
              <Reveal>
                <h2 className={`font-display text-3xl text-center mb-10 ${fondContenu ? 'text-white' : 'text-royal'}`}>
                  Nos Guides
                </h2>
              </Reveal>
              <div className="flex flex-wrap justify-center gap-6">
                {visite.guides.map((g, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <div className="text-center w-44 bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-card border border-white/40">
                      {g.photo
                        ? <img src={g.photo} alt={g.nom} className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-gold"/>
                        : <div className="w-24 h-24 rounded-full bg-azure mx-auto mb-3 flex items-center justify-center text-3xl">👤</div>
                      }
                      <p className="font-heading text-royal font-semibold">{g.nom}</p>
                      <p className="text-xs text-text-sub mt-1">{g.langues?.join(', ')}</p>
                      {g.bio && <p className="text-xs text-text-sub mt-2">{g.bio}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}