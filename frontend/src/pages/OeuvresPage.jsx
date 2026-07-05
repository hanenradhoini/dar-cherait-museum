// src/pages/OeuvresPage.jsx — Bleu Royal
import { useState, useEffect } from 'react';
import api from '../services/api';
import Lightbox from '../components/Lightbox';

export default function OeuvresPage() {
  const [collections, setCollections] = useState([]);
  const [settings, setSettings]       = useState(null);
  const [activeId, setActiveId]       = useState(null);
  const [modal, setModal]             = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([api.get('/content/collections'), api.get('/content/settings')])
      .then(([c, s]) => {
        setCollections(c.data.collections||[]);
        setSettings(s.data.settings);
        if (c.data.collections?.length) setActiveId(c.data.collections[0]._id);
      }).finally(() => setLoading(false));
  }, []);

  const collection = collections.find(c => c._id === activeId);
  function couv(p) { return p.galerie?.find(g=>g.isCouverture)||p.galerie?.[0]||null; }
  function sorted(p) { return [...(p.galerie||[])].sort((a,b)=>(a.ordre??0)-(b.ordre??0)); }

  const fondContenu = settings?.fondsContenu?.oeuvres;

  return (
    <div className="relative min-h-screen">
      {fondContenu && (
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondContenu})`, backgroundAttachment: 'fixed' }} />
      )}
      <div className={`absolute inset-0 ${fondContenu ? 'bg-royal-deep/75' : 'bg-[#D6E4F5]'}`} />

      <div className="relative z-10">
        {settings?.heroImages?.oeuvres && (
          <section className="relative h-64 md:h-80 flex items-end overflow-hidden hero-gradient hero-pattern">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${settings.heroImages.oeuvres})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/80 to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-8 pb-10 w-full">
              <div className="section-tag mb-2">✦ Collections</div>
              <h1 className="font-display text-5xl text-white">Nos Œuvres</h1>
            </div>
          </section>
        )}

        {!settings?.heroImages?.oeuvres && (
          <div className="max-w-7xl mx-auto px-8 pt-14 pb-2">
            <div className="section-tag mb-2">✦ Collections</div>
            <h1 className={`font-display text-5xl ${fondContenu ? 'text-white' : 'text-royal'}`}>Nos Œuvres</h1>
          </div>
        )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-10">
          {collections.map(c => (
            <button key={c._id} type="button" onClick={() => setActiveId(c._id)}
              className={`px-6 py-2.5 text-[10px] tracking-[2px] uppercase font-bold rounded-full border transition-all ${
                activeId===c._id ? 'bg-royal text-white border-royal shadow-royal' : 'bg-white text-text-sub border-azure hover:border-sky/40 hover:text-royal'
              }`}>{c.titre}</button>
          ))}
        </div>

        {collection && (
          <>
            <div className="mb-10 pb-10 border-b border-azure">
              <div className="section-tag mb-2">✦ Collection</div>
              <h2 className="font-display text-3xl text-royal mb-3">{collection.titre}</h2>
              <div className="w-10 h-0.5 bg-gold mb-3" />
              <p className="text-text-sub text-sm">{collection.description}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[4/3] bg-azure animate-pulse rounded-xl" />)}
              </div>
            ) : collection.pieces.length === 0 ? (
              <div className="text-center py-16 text-text-sub">Aucune pièce dans cette collection</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {collection.pieces.map((p, i) => {
                  const c = couv(p);
                  return (
                    <button key={p._id??`p-${i}`} type="button" onClick={() => setModal(p)}
                      className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-royal border border-azure transition-shadow text-left">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {c ? <img src={c.url} alt={p.titre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          : <div className="w-full h-full hero-gradient flex items-center justify-center text-gold/20 font-display text-3xl">✦</div>}
                        {/* Overlay dégradé au survol pour un effet premium */}
                        <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {p.galerie?.length > 1 && (
                          <span className="absolute top-2.5 right-2.5 bg-royal-deep/70 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                            📷 {p.galerie.length}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-heading text-sm text-royal font-semibold group-hover:text-sky transition-colors line-clamp-1">{p.titre}</p>
                        {p.periode && <p className="text-[10px] text-text-sub mt-1">{p.periode}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-royal-deep/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setModal(null); setLightboxIndex(null); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {(() => { const c=couv(modal); return c ?
              <button type="button" onClick={() => setLightboxIndex(sorted(modal).findIndex(g=>g._id===c._id))} className="w-full block relative aspect-[16/9] overflow-hidden rounded-t-2xl">
                <img src={c.url} alt={modal.titre} className="w-full h-full object-cover" />
              </button>
              : <div className="w-full aspect-[16/9] hero-gradient rounded-t-2xl flex items-center justify-center text-gold/20 font-display text-5xl">✦</div>;
            })()}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="section-tag mb-1">✦ {collection?.titre}</div>
                  <h3 className="font-display text-2xl text-royal">{modal.titre}</h3>
                </div>
                <button type="button" onClick={() => { setModal(null); setLightboxIndex(null); }} className="text-text-sub hover:text-royal text-2xl">×</button>
              </div>
              <div className="w-8 h-0.5 bg-gold mb-4" />
              <div className="space-y-1.5 text-xs text-text-sub mb-4">
                {modal.periode   && <p><span className="text-royal/60 uppercase tracking-wider font-bold">Période : </span>{modal.periode}</p>}
                {modal.origine   && <p><span className="text-royal/60 uppercase tracking-wider font-bold">Origine : </span>{modal.origine}</p>}
                {modal.materiaux && <p><span className="text-royal/60 uppercase tracking-wider font-bold">Matériaux : </span>{modal.materiaux}</p>}
              </div>
              {modal.description && <p className="text-sm text-text-sub leading-relaxed mb-5">{modal.description}</p>}
              {modal.galerie?.length > 1 && (
                <div>
                  <div className="section-tag mb-3">Galerie ({modal.galerie.length} photos)</div>
                  <div className="grid grid-cols-4 gap-2">
                    {sorted(modal).map((photo, i) => (
                      <button key={photo._id??i} type="button" onClick={() => setLightboxIndex(i)}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-azure">
                        <img src={photo.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-royal-deep/0 group-hover:bg-royal-deep/30 transition-colors flex items-center justify-center">
                          <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {modal && lightboxIndex !== null && (
        <Lightbox photos={sorted(modal)} index={lightboxIndex}
          onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
      </div>
    </div>
  );
}