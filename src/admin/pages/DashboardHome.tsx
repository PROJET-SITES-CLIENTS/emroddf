// ══════════════════════════════════════════════════════════════════
// Accueil du tableau de bord — statistiques + dernières activités
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, CheckCircle2, Sofa, ArrowRight, RefreshCw } from 'lucide-react';
import { api, formatGNF, formatDate } from '../../lib/adminApi';

interface Stats {
  leads_total: number;
  leads_new: number;
  leads_today: number;
  orders_total: number;
  orders_paid: number;
  orders_pending: number;
  revenue: number;
  products_total: number;
  products_published: number;
  gallery_published: number;
  recentLeads: any[];
  recentOrders: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', paid: 'Payée', cancelled: 'Annulée', failed: 'Échouée', refunded: 'Remboursée',
};

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.get<Stats>('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cards = stats ? [
    { label: 'Nouveaux prospects', value: String(stats.leads_new), sub: `${stats.leads_total} au total · ${stats.leads_today} aujourd'hui`, icon: Users, color: '#e85d04', to: '/admin/prospects' },
    { label: 'Commandes payées', value: String(stats.orders_paid), sub: `${stats.orders_pending} en attente · ${stats.orders_total} au total`, icon: ShoppingBag, color: '#154c30', to: '/admin/commandes' },
    { label: 'Montant encaissé', value: formatGNF(stats.revenue), sub: 'Acomptes reçus via Djomy', icon: CheckCircle2, color: '#e85d04', to: '/admin/commandes' },
    { label: 'Produits en ligne', value: `${stats.products_published}/${stats.products_total}`, sub: `${stats.gallery_published} médias en galerie`, icon: Sofa, color: '#154c30', to: '/admin/catalogue' },
  ] : [];

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Tableau de bord</h1>
          <p className="text-sm text-neutral-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-[#e85d04] hover:text-[#e85d04] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">
          {error}
        </div>
      )}

      {/* Cartes statistiques */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-sm p-6 animate-pulse">
              <div className="h-4 w-24 bg-neutral-100 rounded mb-4" />
              <div className="h-8 w-20 bg-neutral-100 rounded mb-2" />
              <div className="h-3 w-32 bg-neutral-50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {cards.map((c, i) => (
            <Link
              key={i}
              to={c.to}
              className="bg-white border border-neutral-200 rounded-sm p-6 hover:border-[#e85d04]/40 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{c.label}</span>
                <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: `${c.color}12` }}>
                  <c.icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold text-neutral-800 mb-1">{c.value}</div>
              <div className="text-xs text-neutral-400">{c.sub}</div>
            </Link>
          ))}
        </div>
      )}

      {/* Dernières activités */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Derniers prospects */}
          <div className="bg-white border border-neutral-200 rounded-sm">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">Derniers prospects</h2>
              <Link to="/admin/prospects" className="text-xs text-[#e85d04] hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {stats.recentLeads.length === 0 && (
                <p className="px-6 py-8 text-sm text-neutral-400 text-center">Aucun prospect pour le moment.</p>
              )}
              {stats.recentLeads.map((l: any) => (
                <div key={l.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-800 truncate">
                      {l.first_name} {l.last_name}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">{l.phone || l.email || l.service_type}</div>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm shrink-0 ${
                    l.status === 'new' ? 'bg-[#e85d04]/10 text-[#e85d04]' :
                    l.status === 'contacted' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-neutral-100 text-neutral-400'
                  }`}>
                    {l.status === 'new' ? 'Nouveau' : l.status === 'contacted' ? 'Contacté' : 'Archivé'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières commandes */}
          <div className="bg-white border border-neutral-200 rounded-sm">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">Dernières commandes</h2>
              <Link to="/admin/commandes" className="text-xs text-[#e85d04] hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {stats.recentOrders.length === 0 && (
                <p className="px-6 py-8 text-sm text-neutral-400 text-center">Aucune commande pour le moment.</p>
              )}
              {stats.recentOrders.map((o: any) => (
                <div key={o.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-800 truncate">{o.product_name}</div>
                    <div className="text-xs text-neutral-400 truncate">
                      {o.customer_name} · {formatDate(o.created_at)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-neutral-700">{formatGNF(o.deposit_amount)}</div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                      o.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                      o.payment_status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {STATUS_LABELS[o.payment_status] || o.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
