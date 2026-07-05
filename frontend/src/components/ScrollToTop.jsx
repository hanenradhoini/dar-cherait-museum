// src/components/ScrollToTop.jsx
// Remonte la page en haut à chaque changement de route (React Router ne le fait pas automatiquement)
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}