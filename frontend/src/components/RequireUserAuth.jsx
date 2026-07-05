// src/components/RequireUserAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireUserAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>;
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />;
  return children;
}
