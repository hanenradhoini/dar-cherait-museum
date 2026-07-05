// src/pages/InformationsPage.jsx — Bleu Royal
import { useState, useEffect } from 'react';
import api from '../services/api';

const ICON_MAP = { facebook:'📘', instagram:'📸', twitter:'🐦', tiktok:'🎵', youtube:'▶️', whatsapp:'💬' };

function iconFor(r) {
  if (r.icone) return r.icone;
  return ICON_MAP[(r.plateforme||'').toLowerCase()] || '🔗';
}

export default function InformationsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/content/settings').then(r => setSettings(r.data.settings)).finally(() => setLoading(false));
  }, []);

  const contact = settings?.contact || {};
  const reseaux = [...(settings?.reseauxSociaux||[])].sort((a,b)=>(a.ordre??0)-(b.ordre??0));
  const mapsUrl = contact.latitude && contact.longitude
    ? `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}&z=15&output=embed`
    : null;
  const mapsLink = contact.googleMapsUrl
    || (contact.latitude && contact.longitude ? `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}` : null);

  const fondContenu = settings?.fondsContenu?.informations;
  const hasHero = !!settings?.heroImages?.informations;

  return (
    <div className="relative min-h-screen">
      {fondContenu && (
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${fondContenu})`, backgroundAttachment: 'fixed' }} />
      )}
      <div className={`absolute inset-0 ${fondContenu ? 'bg-royal-deep/75' : 'bg-ivory'}`} />

      <div className="relative z-10">
        {/* Hero (uniquement si une bannière est définie) */}
        {hasHero && (
          <section className="relative h-56 md:h-72 flex items-end overflow-hidden hero-gradient hero-pattern">
            <div className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage:`url(${settings.heroImages.informations})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-deep/80 to-transparent" />
            <div className="relative z-10 max-w-7xl mx-auto px-8 pb-10 w-full">
              <div className="section-tag mb-2">✦ Musée Dar Cheraït</div>
              <h1 className="font-display text-5xl text-white">Contact & Informations</h1>
            </div>
          </section>
        )}

        {!hasHero && (
          <div className="max-w-7xl mx-auto px-8 pt-14 pb-2">
            <div className="section-tag mb-2">✦ Musée Dar Cheraït</div>
            <h1 className={`font-display text-5xl ${fondContenu ? 'text-white' : 'text-royal'}`}>
              Contact & Informations
            </h1>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-royal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Colonne infos */}
            <div className="space-y-6">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-card border border-white/40 p-7">
                <div className="section-tag mb-3">✦ Nous trouver</div>
                <h2 className="font-display text-2xl text-royal mb-4">Coordonnées</h2>
                <div className="w-8 h-0.5 bg-gold mb-5" />
                <div className="space-y-4">
                  {contact.adresse && (
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-azure flex items-center justify-center text-royal flex-shrink-0">📍</div>
                      <div>
                        <p className="text-[10px] tracking-[2px] uppercase text-gold font-bold mb-1">Adresse</p>
                        <p className="text-sm text-text-sub">{contact.adresse}</p>
                      </div>
                    </div>
                  )}
                  {contact.telephone && (
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-azure flex items-center justify-center text-royal flex-shrink-0">☎️</div>
                      <div>
                        <p className="text-[10px] tracking-[2px] uppercase text-gold font-bold mb-1">Téléphone</p>
                        <a href={`tel:${contact.telephone}`} className="text-sm text-royal hover:text-sky transition-colors">{contact.telephone}</a>
                      </div>
                    </div>
                  )}
                  {contact.telephoneMobile && (
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-azure flex items-center justify-center text-royal flex-shrink-0">📱</div>
                      <div>
                        <p className="text-[10px] tracking-[2px] uppercase text-gold font-bold mb-1">Mobile</p>
                        <a href={`tel:${contact.telephoneMobile}`} className="text-sm text-royal hover:text-sky transition-colors">{contact.telephoneMobile}</a>
                      </div>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-azure flex items-center justify-center text-royal flex-shrink-0">✉️</div>
                      <div>
                        <p className="text-[10px] tracking-[2px] uppercase text-gold font-bold mb-1">Email</p>
                        <a href={`mailto:${contact.email}`} className="text-sm text-royal hover:text-sky transition-colors">{contact.email}</a>
                      </div>
                    </div>
                  )}
                </div>
                {mapsLink && (
                  <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                    className="btn-royal block text-center mt-6 text-[10px]">
                    🗺️ Ouvrir dans Google Maps
                  </a>
                )}
              </div>

              {reseaux.length > 0 && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-card border border-white/40 p-7">
                  <div className="section-tag mb-3">✦ Suivez-nous</div>
                  <h2 className="font-display text-2xl text-royal mb-4">Réseaux sociaux</h2>
                  <div className="w-8 h-0.5 bg-gold mb-5" />
                  <div className="flex flex-wrap gap-3">
                    {reseaux.map(r => (
                      <a key={r._id} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-azure hover:bg-royal hover:text-white border border-azure hover:border-royal px-4 py-2.5 rounded-full text-sm text-royal transition-all">
                        <span className="text-lg">{iconFor(r)}</span>
                        <span className="font-bold text-xs tracking-wide">{r.label||r.plateforme}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {settings?.horaires?.length > 0 && (
                <div className="bg-royal/95 backdrop-blur-md rounded-2xl p-7 text-white">
                  <div className="section-tag mb-3 !text-gold">✦ Horaires</div>
                  <h2 className="font-display text-2xl text-white mb-4">Ouverture</h2>
                  <div className="w-8 h-0.5 bg-gold mb-5" />
                  <div className="space-y-2">
                    {settings.horaires.map(h => (
                      <div key={h.jour} className="flex justify-between text-sm">
                        <span className="capitalize text-white/70">{h.jour}</span>
                        <span className={h.ferme ? 'text-red-300' : 'text-gold'}>
                          {h.ferme ? 'Fermé' : `${h.ouvertureJournee} – ${h.fermetureJournee}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Carte */}
            <div>
              {mapsUrl ? (
                <div className="rounded-2xl overflow-hidden shadow-card border border-white/40 h-full min-h-[420px]">
                  <iframe
                    title="Localisation du musée" src={mapsUrl}
                    width="100%" height="100%"
                    style={{ border: 0, minHeight: '420px' }}
                    allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl h-full min-h-[420px] flex flex-col items-center justify-center p-10 border border-white/40 text-center">
                  <div className="text-5xl mb-4">🗺️</div>
                  <p className="text-text-sub text-sm">La carte Google Maps s'affichera ici une fois les coordonnées GPS renseignées par l'administrateur.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}