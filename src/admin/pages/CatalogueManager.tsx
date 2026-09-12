// ══════════════════════════════════════════════════════════════════
// Catalogue — gestion des catégories et des produits
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, FolderPlus,
  RefreshCw, ChevronUp, ChevronDown, AlertTriangle, X,
} from 'lucide-react';
import { api, formatGNF } from '../../lib/adminApi';

interface AdminCategory { id: number; name: string; slug: string; position: number; product_count: number; created_at: string }
interface AdminProduct {
  id: number; name: string; slug: string; description: string; price: number;
  dimensions: string; finition: string; essence: string;
  is_published: boolean; position: number; created_at: string;
  category_id: number | null; category_name: string | null;
  main_image_url: string | null; image_count: number;
}

export default function CatalogueManager() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<AdminCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'cat' | 'prod'; id: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<AdminCategory[]>('/api/admin/categories'),
      api.get<AdminProduct[]>('/api/admin/products'),
    ])
      .then(([cats, prods]) => { setCategories(cats); setProducts(prods); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /* ── Catégories ─────────────────────────────────────────────── */
  const saveCategory = async () => {
    if (!newCatName.trim()) return;
    setBusy(true);
    try {
      if (editingCat) {
        await api.put(`/api/admin/categories/${editingCat.id}`, { name: newCatName.trim() });
      } else {
        await api.post('/api/admin/categories', { name: newCatName.trim() });
      }
      setShowCatModal(false);
      setNewCatName('');
      setEditingCat(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const moveCategory = async (cat: AdminCategory, dir: -1 | 1) => {
    // Réindexation complète : on échange dans la liste triée puis on
    // réécrit toutes les positions (garantit un ordre strict même si
    // plusieurs catégories partagent la même position initiale)
    const sorted = [...categories].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const target = sorted[idx + dir];
    if (!target) return;
    [sorted[idx], sorted[idx + dir]] = [sorted[idx + dir], sorted[idx]];
    for (let pos = 0; pos < sorted.length; pos++) {
      if (sorted[pos].position !== pos) {
        await api.put(`/api/admin/categories/${sorted[pos].id}`, { position: pos });
      }
    }
    load();
  };

  const deleteCategory = async (id: number) => {
    await api.delete(`/api/admin/categories/${id}`);
    setConfirmDelete(null);
    load();
  };

  /* ── Produits ───────────────────────────────────────────────── */
  const togglePublish = async (p: AdminProduct) => {
    await api.put(`/api/admin/products/${p.id}`, { isPublished: !p.is_published });
    load();
  };

  const moveProduct = async (p: AdminProduct, dir: -1 | 1) => {
    // Même logique de réindexation complète que les catégories
    const sorted = [...products].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    const idx = sorted.findIndex((x) => x.id === p.id);
    const target = sorted[idx + dir];
    if (!target) return;
    [sorted[idx], sorted[idx + dir]] = [sorted[idx + dir], sorted[idx]];
    for (let pos = 0; pos < sorted.length; pos++) {
      if (sorted[pos].position !== pos) {
        await api.put(`/api/admin/products/${sorted[pos].id}`, { position: pos });
      }
    }
    load();
  };

  const deleteProduct = async (id: number) => {
    await api.delete(`/api/admin/products/${id}`);
    setConfirmDelete(null);
    load();
  };

  const filtered = products
    .filter((p) => (filterCat === 'all' ? true : String(p.category_id) === filterCat))
    .filter((p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category_name || '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Catalogue</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''} · {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingCat(null); setNewCatName(''); setShowCatModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-[#154c30] hover:text-[#154c30] transition"
          >
            <FolderPlus className="w-4 h-4" /> Catégorie
          </button>
          <Link
            to="/admin/catalogue/produit/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-white rounded-sm transition hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}
          >
            <Plus className="w-4 h-4" /> Nouveau produit
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Bandeau catégories (chips) */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCat('all')}
          className={`px-4 py-2 text-xs font-medium rounded-sm border transition ${
            filterCat === 'all' ? 'bg-[#154c30] text-white border-[#154c30]' : 'bg-white border-neutral-200 text-neutral-600 hover:border-[#154c30]'
          }`}
        >
          Toutes ({products.length})
        </button>
        {categories.map((c) => (
          <div key={c.id} className="flex items-center rounded-sm border border-neutral-200 bg-white overflow-hidden">
            <button
              onClick={() => setFilterCat(String(c.id))}
              className={`px-4 py-2 text-xs font-medium transition ${
                filterCat === String(c.id) ? 'bg-[#154c30] text-white' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {c.name} ({c.product_count})
            </button>
            <div className="flex flex-col border-l border-neutral-200">
              <button onClick={() => moveCategory(c, -1)} className="px-1.5 py-0.5 text-neutral-400 hover:text-[#e85d04]" title="Monter"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => moveCategory(c, 1)} className="px-1.5 py-0.5 text-neutral-400 hover:text-[#e85d04]" title="Descendre"><ChevronDown className="w-3 h-3" /></button>
            </div>
            <button onClick={() => { setEditingCat(c); setNewCatName(c.name); setShowCatModal(true); }} className="px-2 py-2 text-neutral-400 hover:text-[#154c30] border-l border-neutral-200" title="Renommer">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-sm bg-white focus:outline-none focus:border-[#e85d04]"
        />
      </div>

      {/* Liste produits */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white border border-neutral-200 rounded-sm h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-sm py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🪑</div>
          <p className="text-neutral-500 mb-4">Aucun produit {search ? 'ne correspond à la recherche' : 'dans cette catégorie'}.</p>
          <Link to="/admin/catalogue/produit/nouveau" className="text-sm text-[#e85d04] font-semibold hover:underline">
            + Créer un produit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white border border-neutral-200 rounded-sm p-4 flex items-center gap-4 hover:border-[#e85d04]/30 hover:shadow-sm transition group">
              {/* Miniature */}
              <div className="w-20 h-20 rounded-sm overflow-hidden bg-neutral-100 shrink-0">
                {p.main_image_url ? (
                  <img src={p.main_image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🪑</div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-neutral-800 truncate">{p.name}</span>
                  {!p.is_published && (
                    <span className="text-[10px] font-semibold uppercase bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-sm">Masqué</span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {p.category_name || 'Sans catégorie'} · {p.image_count} image{p.image_count > 1 ? 's' : ''} · /catalogue/{p.category_id ? '…/' : ''}{p.slug}
                </div>
                <div className="text-sm font-semibold text-[#e85d04] mt-1">{p.price > 0 ? formatGNF(p.price) : 'Sur devis'}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="hidden md:flex flex-col border border-neutral-200 rounded-sm overflow-hidden mr-1">
                  <button onClick={() => moveProduct(p, -1)} className="px-1.5 py-1 text-neutral-400 hover:text-[#e85d04]" title="Monter"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveProduct(p, 1)} className="px-1.5 py-1 text-neutral-400 hover:text-[#e85d04] border-t border-neutral-200" title="Descendre"><ChevronDown className="w-3.5 h-3.5" /></button>
                </div>
                <button
                  onClick={() => togglePublish(p)}
                  className={`p-2.5 rounded-sm border transition ${p.is_published ? 'border-neutral-200 text-neutral-500 hover:text-[#e85d04] hover:border-[#e85d04]/40' : 'border-amber-200 text-amber-500 hover:bg-amber-50'}`}
                  title={p.is_published ? 'Masquer du site' : 'Publier'}
                >
                  {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Link
                  to={`/admin/catalogue/produit/${p.id}`}
                  className="p-2.5 rounded-sm border border-neutral-200 text-neutral-500 hover:text-[#154c30] hover:border-[#154c30]/40 transition"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setConfirmDelete({ type: 'prod', id: p.id, name: p.name })}
                  className="p-2.5 rounded-sm border border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200 transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale catégorie ─────────────────────────────────────── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && setShowCatModal(false)}>
          <div className="bg-white rounded-sm w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-heading text-xl text-[#154c30] mb-4">
              {editingCat ? 'Renommer la catégorie' : 'Nouvelle catégorie'}
            </h3>
            <input
              type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex : Tables basses" autoFocus
              className="w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04]"
              onKeyDown={(e) => e.key === 'Enter' && saveCategory()}
            />
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700">Annuler</button>
              <button
                onClick={saveCategory} disabled={busy || !newCatName.trim()}
                className="px-5 py-2.5 text-sm text-white rounded-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}
              >
                {busy ? '...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ─────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-sm w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-sm bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800 mb-1">Confirmer la suppression</h3>
                <p className="text-sm text-neutral-500">
                  {confirmDelete.type === 'prod'
                    ? <>Supprimer le produit <strong>{confirmDelete.name}</strong> ? Ses images seront également supprimées. Cette action est irréversible.</>
                    : <>Supprimer la catégorie <strong>{confirmDelete.name}</strong> ? Ses produits seront conservés mais deviendront « sans catégorie ».</>}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700">Annuler</button>
              <button
                onClick={() => confirmDelete.type === 'prod' ? deleteProduct(confirmDelete.id) : deleteCategory(confirmDelete.id)}
                className="px-5 py-2.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
