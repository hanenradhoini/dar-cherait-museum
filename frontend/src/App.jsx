// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

// Layout & Guards
import Layout           from './components/Layout';
import ScrollToTop      from './components/ScrollToTop';
import RequireUserAuth  from './components/RequireUserAuth';
import RequireAdminAuth from './components/RequireAdminAuth';

// Pages publiques
import HomePage         from './pages/HomePage';
import ExpositionsPage  from './pages/ExpositionsPage';
import OeuvresPage      from './pages/OeuvresPage';
import VisiteGuideePage from './pages/VisiteGuideePage';
import ContactPage      from './pages/ContactPage';
import InformationsPage from './pages/InformationsPage';
import MonComptePage    from './pages/MonComptePage';
import LoginPage        from './pages/auth/LoginPage';
import RegisterPage     from './pages/auth/RegisterPage';

// Pages admin
import AdminLoginPage   from './admin/AdminLoginPage';
import AdminLayout      from './admin/AdminLayout';
import DashboardPage    from './admin/DashboardPage';
import ReservationsPage from './admin/ReservationsPage';
import MediaPage        from './admin/MediaPage';
import ContenuPage      from './admin/ContenuPage';
import AnnoncesPage     from './admin/AnnoncesPage';
import UtilisateursPage from './admin/UtilisateursPage';
import AdminsPage       from './admin/AdminsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AdminProvider>
          <Routes>
            {/* ── Site public ── */}
            <Route path="/" element={<Layout />}>
              <Route index               element={<HomePage />} />
              <Route path="expositions"  element={<ExpositionsPage />} />
              <Route path="oeuvres"      element={<OeuvresPage />} />
              <Route path="visite"       element={<VisiteGuideePage />} />
              <Route path="contact"      element={<ContactPage />} />
              <Route path="informations" element={<InformationsPage />} />
              <Route path="connexion"    element={<LoginPage />} />
              <Route path="inscription"  element={<RegisterPage />} />
              <Route path="mon-compte"   element={
                <RequireUserAuth><MonComptePage /></RequireUserAuth>
              } />
            </Route>

            {/* ── Panel Admin ── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <RequireAdminAuth><AdminLayout /></RequireAdminAuth>
            }>
              <Route index               element={<DashboardPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="media"        element={<MediaPage />} />
              <Route path="contenu"      element={<ContenuPage />} />
              <Route path="annonces"     element={<AnnoncesPage />} />
              <Route path="utilisateurs" element={<UtilisateursPage />} />
              <Route path="admins"       element={<AdminsPage />} />
            </Route>
          </Routes>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}