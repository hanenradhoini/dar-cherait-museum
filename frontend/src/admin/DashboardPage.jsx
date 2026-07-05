// src/admin/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function StatCard({ label, value, icon, color, link, subtitle }) {
  const content = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200 group relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color} bg-opacity-10`}>
          <span>{icon}</span>
        </div>
        {link && (
          <span className="text-xs text-gray-400 group-hover:text-brown-deep transition-colors">→</span>
        )}
      </div>
      <p className="text-3xl font-bold text-brown-deep tracking-tight">{value ?? <span className="text-gray-300">—</span>}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
}

function BarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-300">
        <span className="text-4xl mb-2">📅</span>
        <p className="text-sm text-gray-400">Aucune réservation cette semaine</p>
      </div>
    );
  }

  const max = Math.max(...data.map(d => parseInt(d.total)), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(row => {
        const d = new Date(row.jour);
        const pct = Math.round((parseInt(row.total) / max) * 100);
        return (
          <div key={row.jour} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-brown-deep">{row.total}</span>
            <div className="w-full bg-sand/20 rounded-t-md relative" style={{ height: '80px' }}>
              <div
                className="absolute bottom-0 w-full bg-sand rounded-t-md transition-all duration-500"
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{JOURS_FR[d.getDay()]}</span>
            <span className="text-xs text-gray-300">{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Impossible de charger le tableau de bord.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-sand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-4xl mb-3">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  const r = data?.reservations;

  const STAT_CARDS = [
    {
      label: 'En attente',
      value: r?.en_attente,
      icon: '⏳',
      color: 'bg-amber-400',
      link: '/admin/reservations?statut=en_attente',
      subtitle: 'À traiter',
    },
    {
      label: 'Confirmées',
      value: r?.confirmees,
      icon: '✅',
      color: 'bg-emerald-500',
      link: '/admin/reservations?statut=confirmee',
      subtitle: 'Validées',
    },
    {
      label: "Aujourd'hui",
      value: r?.aujourd_hui,
      icon: '📅',
      color: 'bg-blue-500',
      link: '/admin/reservations',
      subtitle: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
    },
    {
      label: 'Terminées',
      value: r?.terminees,
      icon: '🏁',
      color: 'bg-gray-400',
      link: '/admin/reservations?statut=terminee',
      subtitle: 'Visites passées',
    },
    {
      label: 'Annulées',
      value: r?.annulees,
      icon: '❌',
      color: 'bg-red-400',
      link: '/admin/reservations?statut=annulee',
      subtitle: 'Ce mois-ci',
    },
    {
      label: 'Total',
      value: r?.total,
      icon: '📊',
      color: 'bg-brown-deep',
      link: '/admin/reservations',
      subtitle: 'Toutes réservations',
    },
  ];

  const QUICK_LINKS = [
    { to: '/admin/reservations', icon: '📅', label: 'Réservations', desc: 'Gérer les visites' },
    { to: '/admin/contenu',      icon: '📝', label: 'Contenu',       desc: 'Modifier les pages' },
    { to: '/admin/annonces',     icon: '📢', label: 'Annonces',      desc: 'Publier un message' },
    { to: '/admin/media',        icon: '🖼️', label: 'Médias',        desc: 'Gérer les photos' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brown-deep">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link to="/admin/reservations?statut=en_attente"
          className="flex items-center gap-2 bg-sand text-brown-deep text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gold transition-colors">
          ⏳ {r?.en_attente ?? 0} en attente
        </Link>
      </div>

      {/* Cartes stats réservations */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Réservations</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
        </div>
      </section>

      {/* Visiteurs + Graphe */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Visiteurs inscrits */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Visiteurs inscrits</p>
            <p className="text-6xl font-bold text-brown-deep tracking-tight">
              {data?.visiteurs_inscrits ?? 0}
            </p>
            <p className="text-sm text-gray-400 mt-2">comptes actifs</p>
          </div>
          <Link to="/admin/utilisateurs"
            className="mt-6 text-center text-sm font-semibold text-sand hover:text-gold transition-colors border border-sand/30 rounded-xl py-2 hover:border-gold">
            Gérer les utilisateurs →
          </Link>
        </div>

        {/* Graphe 7 jours */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Réservations — 7 derniers jours</p>
            <Link to="/admin/reservations" className="text-xs text-sand hover:underline">Voir tout →</Link>
          </div>
          <BarChart data={data?.reservations_semaine} />
        </div>
      </div>

      {/* Accès rapides */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Accès rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ to, icon, label, desc }) => (
            <Link key={to} to={to}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-sand hover:shadow-md transition-all duration-200 group">
              <span className="text-2xl mb-3 block">{icon}</span>
              <p className="font-semibold text-brown-deep text-sm group-hover:text-sand transition-colors">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
