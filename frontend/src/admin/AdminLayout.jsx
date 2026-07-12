// src/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const NAV = [
  { to: '/admin',              label: 'Dashboard',        icon: '📊' },
  { to: '/admin/reservations', label: 'Réservations',     icon: '📅' },
  { to: '/admin/contenu',      label: 'Contenu',          icon: '📝' },
  { to: '/admin/annonces',     label: 'Annonces',         icon: '📢' },
  { to: '/admin/media',        label: 'Médias',           icon: '🖼️' },
  { to: '/admin/abonnements',  label: 'Abonnements',      icon: '💳' },   // ← AJOUTE CETTE LIGN
  { to: '/admin/utilisateurs', label: 'Utilisateurs',     icon: '👥' },
  { to: '/admin/admins',       label: 'Administrateurs',  icon: '👤' },
];

export default function AdminLayout() {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen]     = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() { logout(); navigate('/admin/login'); }
  function handleNavClick() { setMobileOpen(false); }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-ivory-dark overflow-hidden">

      {/* Barre mobile */}
      <header className="md:hidden flex items-center justify-between bg-brown-deep text-ivory px-4 h-14 flex-shrink-0">
        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="text-xl">
          {mobileOpen ? '✕' : '☰'}
        </button>
        <span className="font-display text-sand text-sm tracking-wider">Dar Cheraït — Admin</span>
        <div className="w-6" />
      </header>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-night/60 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
          bg-brown-deep text-ivory flex flex-col transition-all duration-200 flex-shrink-0
          fixed md:static inset-y-0 left-0 z-40
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${sideOpen ? 'w-64 md:w-56' : 'w-64 md:w-16'}
        `}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
          {(sideOpen || mobileOpen) && (
            <span className="font-display text-sand text-sm tracking-wider">Dar Cheraït</span>
          )}
          <button type="button" onClick={() => setSideOpen(!sideOpen)}
            className="hidden md:block text-ivory/60 hover:text-ivory">
            {sideOpen ? '◀' : '▶'}
          </button>
          <button type="button" onClick={() => setMobileOpen(false)}
            className="md:hidden text-ivory/60 hover:text-ivory text-xl">✕</button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => {
            // Entrée Administrateurs visible seulement pour super_admin
            if (to === '/admin/admins' && admin?.role !== 'super_admin') return null;
            return (
              <NavLink key={to} to={to} end={to === '/admin'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-sand/20 text-sand border-r-2 border-sand'
                      : 'text-ivory/70 hover:text-ivory hover:bg-white/5'
                  }`
                }>
                <span className="text-base flex-shrink-0">{icon}</span>
                {(sideOpen || mobileOpen) && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
          {(sideOpen || mobileOpen) && (
            <p className="text-xs text-ivory/50 mb-2">
              {admin?.nom}<br/>
              <span className="text-sand/60">{admin?.role}</span>
            </p>
          )}
          <button type="button" onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-ivory/50 hover:text-red-400 transition-colors">
            <span>🚪</span>{(sideOpen || mobileOpen) && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="hidden md:flex bg-ivory border-b border-sand-light h-14 items-center px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-gray-700">Panel d'administration</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}