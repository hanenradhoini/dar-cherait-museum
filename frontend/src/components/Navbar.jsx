// src/components/Navbar.jsx — Bleu Royal + Or
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/',             label: 'Accueil' },
  { to: '/expositions',  label: 'Expositions' },
  { to: '/oeuvres',      label: 'Œuvres' },
  { to: '/visite',       label: 'Visite guidée' },
  { to: '/informations', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() { logout(); navigate('/'); }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-royal-deep border-b border-white/10 shadow-royal">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="font-display text-lg tracking-widest uppercase text-gold">
            Dar Cheraït
          </Link>

          {/* Nav desktop */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) =>
                  `text-[10px] tracking-[2px] uppercase font-sans font-bold transition-colors ${
                    isActive ? 'text-gold' : 'text-white/80 hover:text-gold'
                  }`
                }>{label}</NavLink>
            ))}
            {user ? (
              <>
                <Link to="/mon-compte" className="text-[10px] tracking-[2px] uppercase font-bold text-white/80 hover:text-gold transition-colors">
                  Mon compte
                </Link>
                <button type="button" onClick={handleLogout}
                  className="text-[10px] tracking-[2px] uppercase font-bold text-white/60 hover:text-white transition-colors">
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/connexion" className="text-[10px] tracking-[2px] uppercase font-bold text-white/80 hover:text-gold transition-colors">
                Connexion
              </Link>
            )}
          </div>

          {/* CTA Réserver */}
          <Link to="/contact" className="hidden md:block btn-gold text-[10px] !py-2.5 !px-5">
            Réserver
          </Link>

          {/* Burger */}
          <button type="button" className="md:hidden flex flex-col gap-1.5" onClick={() => setOpen(!open)}>
            <span className="block h-0.5 w-6 bg-gold" />
            <span className="block h-0.5 w-4 ml-auto bg-gold" />
            <span className="block h-0.5 w-6 bg-gold" />
          </button>
        </div>

        {/* Menu mobile */}
        {open && (
          <div className="md:hidden bg-royal border-t border-white/10">
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-3 text-[11px] tracking-[2px] uppercase font-bold border-b border-white/10 ${isActive ? 'text-gold' : 'text-white/80 hover:text-gold'}`
                  }>{label}</NavLink>
              ))}
              {user && (
                <>
                  <Link to="/mon-compte" onClick={() => setOpen(false)}
                    className="block py-3 text-[11px] tracking-[2px] uppercase font-bold text-white/80 border-b border-white/10">
                    Mon compte
                  </Link>
                  <button type="button" onClick={() => { handleLogout(); setOpen(false); }}
                    className="block py-3 text-[11px] tracking-[2px] uppercase font-bold text-red-300 w-full text-left">
                    Déconnexion
                  </button>
                </>
              )}
              <div className="pt-3">
                <Link to="/contact" onClick={() => setOpen(false)} className="btn-gold block text-center">Réserver</Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
}
