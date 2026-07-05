// src/hooks/useAdmin.js
import { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

/**
 * Hook personnalisé pour accéder facilement au contexte de l'administration
 */
export function useAdmin() {
  const context = useContext(AdminContext);
  
  if (!context) {
    throw new Error("useAdmin doit être utilisé à l'intérieur d'un AdminProvider");
  }
  
  return context;
}