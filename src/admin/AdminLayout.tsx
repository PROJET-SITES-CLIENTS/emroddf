// ══════════════════════════════════════════════════════════════════
// Layout du tableau de bord — barre latérale + contenu
// ══════════════════════════════════════════════════════════════════
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Sofa, Images, Users, ShoppingBag, Settings,
  LogOut, Menu, X, ExternalLink,
} from 'lucide-react';
import { api } from '../lib/adminApi';

const NAV = [
  { to: '/admin', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/admin/catalogue', label: 'Catalogue', icon: Sofa, end: false },
  { to: '/admin/galerie', label: 'Galerie', icon: Images, end: false },
  { to: '/admin/prospects', label: 'Prospects', icon: Users, end: false },
  { to: '/admin/commandes', label: 'Commandes', icon: ShoppingBag, end: false },
  { to: '/admin/parametres', label: 'Paramètres du site', icon: Settings, end: false },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    try { await api.post('/api/admin/logout'); } catch { /* ignore */ }
    window.location.href = '/admin/login';
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
               style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}>
            <span className="text-white font-heading text-lg font-bold">E</span>
          </div>
          <div>
            <div className="text-white font-heading text-lg leading-none">EMROD</div>
            <div className="text-white/40 text-[10px] uppercase tracking-[0.25em] mt-1">Administration</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white font-medium border-l-2'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => (isActive ? { borderColor: '#e85d04' } : undefined)}
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Pied : lien site public + déconnexion */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-sm text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
        >
          <ExternalLink className="w-[18px] h-[18px]" />
          Voir le site
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar desktop */}
      <aside
        className="hidden lg:flex lg:flex-col w-64 shrink-0 fixed inset-y-0 left-0 z-30"
        style={{ background: 'linear-gradient(180deg, #0d3320 0%, #11522f 100%)' }}
      >
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative flex flex-col w-72 max-w-[80vw] h-full"
            style={{ background: 'linear-gradient(180deg, #0d3320 0%, #11522f 100%)' }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Barre mobile */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-neutral-700" aria-label="Ouvrir le menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading text-[#154c30]">EMROD · Admin</span>
          <div className="w-8" />
        </div>

        <main className="p-4 md:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
