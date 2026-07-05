// src/components/Footer.jsx — Bleu Royal + Or — version compacte
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ICON_MAP = { facebook:'f', instagram:'◈', twitter:'✕', tiktok:'♪', youtube:'▶', whatsapp:'✆' };

const NAV_LINKS = [
  ['/', 'Accueil'],
  ['/expositions', 'Expositions'],
  ['/oeuvres', 'Œuvres'],
  ['/visite', 'Visite guidée'],
  ['/informations', 'Contact'],
  ['/contact', 'Réserver'],
];

export default function Footer() {
  const [settings, setSettings] = useState(null);
  useEffect(() => { api.get('/content/settings').then(r => setSettings(r.data.settings)).catch(()=>{}); }, []);

  const contact = settings?.contact || {};
  const reseaux = [...(settings?.reseauxSociaux || [])].sort((a,b)=>(a.ordre??0)-(b.ordre??0));

  return (
    <footer className="bg-royal-deep text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-7 flex flex-col gap-5">

        {/* Ligne principale : marque + navigation + contact/social */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          {/* Marque */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="font-display text-gold text-lg tracking-widest uppercase">Dar Cheraït</span>
            <span className="hidden sm:inline text-white/25">•</span>
            <span className="hidden sm:inline text-white/50 text-xs">{contact.adresse || 'Tozeur, Tunisie'}</span>
          </div>

          {/* Navigation inline */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
            {NAV_LINKS.map(([to, label]) => (
              <Link key={to} to={to} className="text-white/60 hover:text-gold transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Contact + réseaux sociaux */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-wrap gap-3 text-xs text-white/60">
              {contact.telephone && (
                <a href={`tel:${contact.telephone}`} className="hover:text-gold transition-colors">☎ {contact.telephone}</a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="hover:text-gold transition-colors">✉ {contact.email}</a>
              )}
            </div>
            {reseaux.length > 0 && (
              <div className="flex gap-1.5">
                {reseaux.map(r => (
                  <a key={r._id} href={r.url} target="_blank" rel="noopener noreferrer"
                    title={r.label||r.plateforme}
                    className="w-7 h-7 border border-white/20 flex items-center justify-center text-white/50 hover:text-gold hover:border-gold/50 transition-colors text-[11px] rounded-sm">
                    {r.icone || ICON_MAP[(r.plateforme||'').toLowerCase()] || '✦'}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre du bas */}
      <div className="border-t border-white/10 py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-1">
        <p className="text-[10px] text-white/30 tracking-widest uppercase">
          © {new Date().getFullYear()} Musée Dar Cheraït — Tous droits réservés
        </p>
        <Link to="/admin/login" className="text-[10px] text-white/20 hover:text-gold/40 transition-colors tracking-widest uppercase">
          Administration
        </Link>
      </div>
    </footer>
  );
}