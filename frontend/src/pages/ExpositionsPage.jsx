// src/pages/ExpositionsPage.jsx — Bleu Royal
import { useState, useEffect } from 'react';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

const CATEGORIES = [
  { value: '', label: 'Tout afficher' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'scenographie', label: 'Scénographie' },
  { value: 'univers', label: 'Univers' },
];

export default function ExpositionsPage() {
  const [espaces, setEspaces]     = useState([]);
  const [settings, setSettings]   = useState(null);
  const [activeId, setActiveId]   = useState(null);
  const [categorie, setCategorie] = useState('');
  const [gallerySalle, setGallerySalle] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([api.get('/content/espaces'), api.get('/content/settings')])
      .then(([e, s]) => {
        setEspaces(e.data.espaces || []);
        setSettings(s.data.settings);
        if (e.data.espaces?.length) setActiveId(e.data.espaces[0]._id);
      }).finally(() => setLoading(false));
  }, []);

  const espace = espaces.find(e => e._id === activeId);
  const salles = (espace?.salles || []).filter(s => !categorie || s.categorie === categorie);

  function couv(salle) { return salle.galerie?.find(p => p.isCouverture) || salle.galerie?.[0] || null; }
  function sortedGal(salle) { return [...(salle.galerie || [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)); }

  const fondContenu = settings?.fondsContenu?.expositions;

  return (
    <div className="relative min-h-screen">
      {fondContenu && (
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondContenu})`, backgroundAttachment: 'fixed' }} />
      )}
      <div className={`absolute inset-0 ${fondContenu ? 'bg-royal-deep/75' : 'bg-[#D6E4F5]'}`} />

      <div className="relative z-10">
        {settings?.heroImages?.expositions && (
          <section className="relative h-64 md:h-80 flex items-end overflow-hidden hero-gradient hero-pattern">
            <div className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.heroImages.expositions})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/80 to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-8 pb-10 w-full">
              <div className="section-tag mb-2">✦ Musée Dar Cheraït</div>
              <h1 className="font-display text-5xl text-white">Nos Expositions</h1>
            </div>
          </section>
        )}

        {!settings?.heroImages?.expositions && (
          <div className="max-w-7xl mx-auto px-8 pt-14 pb-2">
            <div className="section-tag mb-2">✦ Musée Dar Cheraït</div>
            <h1 className={`font-display text-5xl ${fondContenu ? 'text-white' : 'text-royal'}`}>Nos Expositions</h1>
          </div>
        )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-10">
          {espaces.map(e => (
            <button key={e._id} type="button" onClick={() => setActiveId(e._id)}
              className={`px-6 py-2.5 text-[10px] tracking-[2px] uppercase font-bold rounded-full border transition-all ${
                activeId === e._id ? 'bg-royal text-white border-royal shadow-royal' : 'bg-white text-text-sub border-azure hover:border-sky/40 hover:text-royal'
              }`}>
              {e.titre}
            </button>
          ))}
        </div>

        {espace && (
          <>
            <div className="bg-white rounded-xl shadow-card border border-azure p-7 mb-10 flex flex-col md:flex-row gap-7 items-start">
              {espace.imageUrl && (
                <div className="w-full md:w-56 h-44 rounded-lg overflow-hidden border border-azure flex-shrink-0">
                  <img src={espace.imageUrl} alt={espace.titre}
                    className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <div className="section-tag mb-2">✦ {espace.titre}</div>
                <h2 className="font-display text-3xl text-royal mb-3">{espace.titre}</h2>
                <div className="w-10 h-0.5 bg-gold mb-4" />
                <p className="text-text-sub text-sm leading-relaxed">{espace.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-7">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setCategorie(c.value)}
                  className={`text-[10px] tracking-[2px] uppercase px-4 py-2 rounded-full border font-bold transition-colors ${
                    categorie === c.value ? 'bg-gold text-royal border-gold' : 'bg-white border-azure text-text-sub hover:border-gold/50 hover:text-royal'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] bg-azure animate-pulse rounded-xl" />)}
              </div>
            ) : salles.length === 0 ? (
              <div className="text-center py-16 text-text-sub">Aucune salle dans cette catégorie</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {salles.map((s, i) => {
                  const c = couv(s);
                  return (
                    <button key={s._id ?? `s-${i}`} type="button"
                      onClick={() => s.galerie?.length && setGallerySalle(s)}
                      className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-royal border border-azure transition-shadow text-left">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {c ? (
                          <img src={c.url} alt={s.titre}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full hero-gradient flex items-center justify-center">
                            <span className="font-display text-3xl text-gold/20">✦</span>
                          </div>
                        )}
                        {/* Overlay dégradé au survol pour lisibilité et effet premium */}
                        <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {s.galerie?.length > 1 && (
                          <span className="absolute top-2.5 right-2.5 bg-royal-deep/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            📷 {s.galerie.length}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="text-[9px] tracking-[2px] uppercase text-gold font-bold mb-1">{s.categorie}</div>
                        <div className="font-heading text-sm text-royal font-semibold group-hover:text-sky transition-colors">{s.titre}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {gallerySalle && (
        <div className="fixed inset-0 z-50 bg-royal-deep/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setGallerySalle(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start p-6 border-b border-azure sticky top-0 bg-white rounded-t-2xl">
              <div>
                <div className="section-tag mb-1">✦ {espace?.titre}</div>
                <h3 className="font-display text-2xl text-royal">{gallerySalle.titre}</h3>
              </div>
              <button type="button" onClick={() => setGallerySalle(null)} className="text-text-sub hover:text-royal text-2xl">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {sortedGal(gallerySalle).map((photo, i) => (
                <button key={photo._id ?? i} type="button" onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-azure">
                  <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-royal-deep/0 group-hover:bg-royal-deep/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gallerySalle && lightboxIndex !== null && (
        <Lightbox photos={sortedGal(gallerySalle)} index={lightboxIndex}
          onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
      </div>
    </div>
  );
}