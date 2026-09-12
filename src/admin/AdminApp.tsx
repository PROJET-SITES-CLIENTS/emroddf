// ══════════════════════════════════════════════════════════════════
// Tableau de bord EMROD — routeur /admin/*
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/adminApi';
import AdminLayout from './AdminLayout';
import DashboardHome from './pages/DashboardHome';
import CatalogueManager from './pages/CatalogueManager';
import ProductEditor from './pages/ProductEditor';
import GalleryManager from './pages/GalleryManager';
import LeadsManager from './pages/LeadsManager';
import OrdersManager from './pages/OrdersManager';
import SettingsManager from './pages/SettingsManager';

/* ── Écran de connexion ──────────────────────────────────────────── */
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/admin/login', { email, password });
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #0d3320 0%, #154c30 60%, #1a5535 100%)' }}>
      {/* Décor */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] opacity-[0.05] blur-[120px]" style={{ background: '#e85d04' }} />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] opacity-[0.04] blur-[100px]" style={{ background: '#e85d04' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden relative z-10"
      >
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #154c30, #e85d04, #154c30)' }} />
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-sm flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}>
              <span className="text-white font-heading text-2xl font-bold">E</span>
            </div>
            <h1 className="font-heading text-2xl text-[#154c30]">EMROD · Administration</h1>
            <p className="text-sm text-neutral-500 mt-1">Tableau de bord du site</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/15 transition"
                placeholder="admin@emroddf.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">Mot de passe</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/15 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">{error}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 text-white text-sm font-semibold uppercase tracking-widest rounded-sm transition disabled:opacity-60 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <a href="/" className="block text-center mt-6 text-xs text-neutral-400 hover:text-[#e85d04] transition">
            ← Retour au site
          </a>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Garde d'authentification ────────────────────────────────────── */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok'>('checking');
  const location = useLocation();

  useEffect(() => {
    api.get('/api/admin/session')
      .then(() => setStatus('ok'))
      .catch(() => {
        window.location.href = `/admin/login?from=${encodeURIComponent(location.pathname)}`;
      });
  }, [location.pathname]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 rounded-sm border-2 border-[#e85d04] border-t-transparent animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

/* ── Routeur admin ───────────────────────────────────────────────── */
export default function AdminApp() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname.startsWith('/admin/login') ? 'login' : 'admin'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="catalogue" element={<CatalogueManager />} />
            <Route path="catalogue/produit/nouveau" element={<ProductEditor />} />
            <Route path="catalogue/produit/:id" element={<ProductEditor />} />
            <Route path="galerie" element={<GalleryManager />} />
            <Route path="prospects" element={<LeadsManager />} />
            <Route path="commandes" element={<OrdersManager />} />
            <Route path="parametres" element={<SettingsManager />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
