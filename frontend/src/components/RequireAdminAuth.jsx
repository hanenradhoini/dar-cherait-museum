// src/components/RequireAdminAuth.jsx
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function RequireAdminAuth({ children }) {
  const { admin, loading } = useAdmin();
  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-sand border-t-transparent rounded-full animate-spin"/></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}
