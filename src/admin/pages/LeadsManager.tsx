// ══════════════════════════════════════════════════════════════════
// Prospects — suivi des demandes de contact avec statuts + export CSV
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Search, Download, X, Mail, Phone, MessageSquare, RefreshCw } from 'lucide-react';
import { api, formatDate } from '../../lib/adminApi';

interface Lead {
  id: number; first_name: string; last_name: string; phone: string; email: string;
  service_type: string; message: string; source: string;
  status: 'new' | 'contacted' | 'archived'; created_at: string;
}

const STATUS_CONFIG = {
  new: { label: 'Nouveau', cls: 'bg-[#e85d04]/10 text-[#e85d04]' },
  contacted: { label: 'Contacté', cls: 'bg-emerald-50 text-emerald-600' },
  archived: { label: 'Archivé', cls: 'bg-neutral-100 text-neutral-400' },
};

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search) params.set('q', search);
    api.get<Lead[]>(`/api/admin/leads?${params}`)
      .then(setLeads)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const setStatus = async (lead: Lead, status: Lead['status']) => {
    await api.put(`/api/admin/leads/${lead.id}`, { status });
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    if (selected?.id === lead.id) setSelected({ ...selected, status });
  };

  const removeLead = async (id: number) => {
    await api.delete(`/api/admin/leads/${id}`);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelected(null);
  };

  const exportCsv = () => {
    const header = ['Nom', 'Prénom', 'Téléphone', 'Email', 'Service', 'Message', 'Source', 'Statut', 'Date'];
    const rows = leads.map((l) => [
      l.last_name, l.first_name, l.phone, l.email, l.service_type,
      (l.message || '').replace(/[\r\n";]+/g, ' '), l.source,
      STATUS_CONFIG[l.status]?.label || l.status, formatDate(l.created_at),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `emrod-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Prospects</h1>
          <p className="text-sm text-neutral-500 mt-1">{leads.length} demande(s) · formulaires contact et popup</p>
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

      {/* Filtres + recherche */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {[{ v: '', l: 'Tous' }, { v: 'new', l: 'Nouveaux' }, { v: 'contacted', l: 'Contactés' }, { v: 'archived', l: 'Archivés' }].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2.5 text-xs font-medium rounded-sm border transition ${
                filter === f.v ? 'bg-[#154c30] text-white border-[#154c30]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-[#154c30]'
              }`}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm md:ml-auto">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, téléphone, email)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-[#e85d04]" />
        </div>
      </div>

      {/* Liste */}
      {loading && leads.length === 0 ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-neutral-200 rounded-sm h-16 animate-pulse" />)}</div>
      ) : leads.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-sm py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">📭</div>
          <p className="text-neutral-500">Aucun prospect pour ces critères.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm divide-y divide-neutral-50">
          {leads.map((l) => (
            <div key={l.id} className="p-4 flex flex-wrap items-center gap-3 hover:bg-neutral-50/60 transition cursor-pointer"
                 onClick={() => setSelected(l)}>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-800 text-sm">
                    {l.first_name} {l.last_name}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${STATUS_CONFIG[l.status]?.cls}`}>
                    {STATUS_CONFIG[l.status]?.label}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {l.phone || '—'} · {l.service_type || '—'} · {formatDate(l.created_at)}
                </div>
              </div>
              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                {l.phone && (
                  <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="p-2 border border-neutral-200 rounded-sm text-neutral-500 hover:text-[#e85d04] hover:border-[#e85d04]/40" title="Appeler">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                {l.email && (
                  <a href={`mailto:${l.email}`} className="p-2 border border-neutral-200 rounded-sm text-neutral-500 hover:text-[#e85d04] hover:border-[#e85d04]/40" title="Envoyer un email">
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
                {(['new', 'contacted', 'archived'] as const)
                  .filter((s) => s !== l.status)
                  .map((s) => (
                    <button key={s} onClick={() => setStatus(l, s)}
                      className="px-2.5 py-1.5 text-[10px] font-semibold uppercase border border-neutral-200 rounded-sm text-neutral-500 hover:border-[#154c30] hover:text-[#154c30] transition">
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
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
                <h3 className="font-heading text-xl text-[#154c30]">
                  {selected.first_name} {selected.last_name}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Reçu le {formatDate(selected.created_at)} · Source : {selected.source || '—'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Téléphone', selected.phone], ['Email', selected.email], ['Service souhaité', selected.service_type],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4 py-2 border-b border-neutral-50">
                  <span className="text-neutral-400 text-xs uppercase tracking-wider">{label}</span>
                  <span className="text-neutral-800 text-right">{val || '—'}</span>
                </div>
              ))}
              {selected.message && (
                <div className="bg-neutral-50 rounded-sm p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-400 mb-2">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </div>
                  <p className="text-neutral-700 whitespace-pre-wrap">{selected.message}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => removeLead(selected.id)}
                className="text-xs text-red-400 hover:text-red-600 uppercase tracking-wider font-semibold"
              >
                Supprimer
              </button>
              <div className="flex gap-2">
                {(['new', 'contacted', 'archived'] as const).map((s) => (
                  <button key={s} onClick={() => setStatus(selected, s)}
                    className={`px-3 py-2 text-xs font-semibold rounded-sm border transition ${
                      selected.status === s ? 'bg-[#154c30] text-white border-[#154c30]' : 'border-neutral-200 text-neutral-500 hover:border-[#154c30] hover:text-[#154c30]'
                    }`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
