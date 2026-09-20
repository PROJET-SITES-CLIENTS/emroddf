// ══════════════════════════════════════════════════════════════════
// Commandes — suivi des commandes et paiements Djomy + export CSV
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Download, X, MapPin, Phone, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { api, formatGNF, formatDate } from '../../lib/adminApi';

interface Order {
  id: number; reference: string; product_id: number | null; product_name: string;
  price_total: number; deposit_amount: number; paid_amount: number;
  customer_name: string; customer_phone: string; customer_address: string;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'refunded';
  djomy_transaction_id: string; created_at: string; paid_at: string | null;
  product_details?: {
    nom?: string; description?: string; dimensions?: string; finition?: string;
    essence?: string; imageUrl?: string | null; acompteMode?: string;
    acompteValeur?: number; prixTotal?: number;
  } | null;
  metadata?: any;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-amber-50 text-amber-600' },
  paid: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'Annulée', cls: 'bg-neutral-100 text-neutral-500' },
  failed: { label: 'Échouée', cls: 'bg-red-50 text-red-500' },
  refunded: { label: 'Remboursée', cls: 'bg-blue-50 text-blue-500' },
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    api.get<Order[]>(`/api/admin/orders${params}`)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const setStatus = async (order: Order, paymentStatus: Order['payment_status']) => {
    await api.put(`/api/admin/orders/${order.id}`, { paymentStatus });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: paymentStatus } : o)));
    if (selected?.id === order.id) setSelected({ ...selected, payment_status: paymentStatus });
  };

  const exportCsv = () => {
    const header = ['Référence', 'Produit', 'Prix total', 'Acompte attendu', 'Montant payé', 'Client', 'Téléphone', 'Adresse', 'Statut', 'Date'];
    const rows = orders.map((o) => [
      o.reference, o.product_name, o.price_total, o.deposit_amount, o.paid_amount,
      o.customer_name, o.customer_phone, (o.customer_address || '').replace(/[\r\n";]+/g, ' '),
      STATUS_CONFIG[o.payment_status]?.label || o.payment_status, formatDate(o.created_at),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c ?? '')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `emrod-commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Commandes</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {orders.length} commande(s) · paiement d'acompte en ligne Djomy
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 border border-neutral-200 rounded-sm text-neutral-500 hover:text-[#e85d04] hover:border-[#e85d04]/40 transition" title="Actualiser">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-[#154c30] hover:text-[#154c30] transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">{error}</div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ v: '', l: 'Toutes' }, ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label }))].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2.5 text-xs font-medium rounded-sm border transition ${
              filter === f.v ? 'bg-[#154c30] text-white border-[#154c30]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-[#154c30]'
            }`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading && orders.length === 0 ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-white border border-neutral-200 rounded-sm h-20 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-sm py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🧾</div>
          <p className="text-neutral-500">Aucune commande pour ces critères.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm divide-y divide-neutral-50">
          {orders.map((o) => (
            <div key={o.id} className="p-4 flex flex-wrap items-center gap-3 hover:bg-neutral-50/60 transition cursor-pointer"
                 onClick={() => setSelected(o)}>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] text-neutral-400">{o.reference}</span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${STATUS_CONFIG[o.payment_status]?.cls}`}>
                    {STATUS_CONFIG[o.payment_status]?.label}
                  </span>
                </div>
                <div className="font-medium text-neutral-800 text-sm mt-0.5">{o.product_name}</div>
                <div className="text-xs text-neutral-400">
                  {o.customer_name} · {formatDate(o.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-neutral-700">{formatGNF(o.paid_amount > 0 ? o.paid_amount : o.deposit_amount)}</div>
                <div className="text-[11px] text-neutral-400">acompte / {formatGNF(o.price_total)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fiche détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white rounded-sm w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-heading text-xl text-[#154c30]">Commande {selected.reference}</h3>
                <p className="text-xs text-neutral-400 mt-1">Créée le {formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5" /></button>
            </div>

            {/* Alerte fraude éventuelle */}
            {selected.payment_status === 'failed' && selected.paid_amount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Montant payé ({formatGNF(selected.paid_amount)}) inférieur à l'acompte attendu ({formatGNF(selected.deposit_amount)}). Paiement partiel ou tentative de fraude.
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm mb-5">
              {[
                ['Produit', selected.product_name],
                ['Prix total', formatGNF(selected.price_total)],
                [
                  selected.product_details?.acompteMode === 'none'
                    ? 'Acompte'
                    : selected.product_details?.acompteMode === 'fixed'
                      ? `Acompte (fixe : ${formatGNF(selected.product_details.acompteValeur || 0)})`
                      : `Acompte (${selected.product_details?.acompteValeur ?? 60}%)`,
                  selected.product_details?.acompteMode === 'none' ? 'Sans acompte en ligne' : formatGNF(selected.deposit_amount),
                ],
                ['Montant encaissé', formatGNF(selected.paid_amount)],
                ['Transaction Djomy', selected.djomy_transaction_id || '—'],
                ['Payée le', selected.paid_at ? formatDate(selected.paid_at) : '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4 py-2 border-b border-neutral-50">
                  <span className="text-neutral-400 text-xs uppercase tracking-wider">{label}</span>
                  <span className="text-neutral-800 text-right font-medium">{val}</span>
                </div>
              ))}
            </div>

            {/* Détails du produit sélectionné par le client (snapshot au moment de la commande) */}
            {selected.product_details && (
              <div className="bg-white border border-neutral-200 rounded-sm p-4 mb-5">
                <div className="text-xs uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> Détails du produit commandé
                </div>
                <div className="flex gap-4">
                  {selected.product_details.imageUrl && (
                    <div className="w-24 h-24 rounded-sm overflow-hidden bg-neutral-100 shrink-0">
                      <img src={selected.product_details.imageUrl} alt={selected.product_details.nom || ''} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-lg text-[#154c30] mb-1">{selected.product_details.nom || selected.product_name}</div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        ['Dimensions', selected.product_details.dimensions],
                        ['Finition', selected.product_details.finition],
                        ['Essence', selected.product_details.essence],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-neutral-50 rounded-sm px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-neutral-400">{label}</div>
                          <div className="text-xs font-medium text-neutral-700 truncate" title={String(val || '')}>{val || '—'}</div>
                        </div>
                      ))}
                    </div>
                    {selected.product_details.description && (
                      <p className="text-xs text-neutral-500 leading-relaxed line-clamp-4">{selected.product_details.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Client */}
            <div className="bg-neutral-50 rounded-sm p-4 mb-5 space-y-2 text-sm">
              <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Client</div>
              <div className="font-medium text-neutral-800">{selected.customer_name}</div>
              {selected.customer_phone && (
                <a href={`tel:${selected.customer_phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-neutral-600 hover:text-[#e85d04]">
                  <Phone className="w-3.5 h-3.5" /> {selected.customer_phone}
                </a>
              )}
              {selected.customer_address && (
                <div className="flex items-start gap-2 text-neutral-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span className="whitespace-pre-wrap">{selected.customer_address}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider self-center mr-1">Statut :</span>
              {(Object.keys(STATUS_CONFIG) as Array<Order['payment_status']>).map((s) => (
                <button key={s} onClick={() => setStatus(selected, s)}
                  className={`px-3 py-2 text-xs font-semibold rounded-sm border transition ${
                    selected.payment_status === s ? 'bg-[#154c30] text-white border-[#154c30]' : 'border-neutral-200 text-neutral-500 hover:border-[#154c30] hover:text-[#154c30]'
                  }`}>
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
