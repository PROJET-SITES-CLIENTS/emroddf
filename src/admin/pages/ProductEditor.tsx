// ══════════════════════════════════════════════════════════════════
// Éditeur de produit — informations + gestion des images
// ══════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, Upload, Trash2, Star, ChevronLeft, ChevronRight, Plus, Film,
} from 'lucide-react';
import { api, formatGNF } from '../../lib/adminApi';

interface Cat { id: number; name: string; parent_id: number | null }
interface Img { id: number; url: string; media_type: 'image' | 'video'; is_main: boolean; position: number }

function isVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('.blob.');
}

function previewDeposit(mode: string, value: number, price: number): string {
  if (mode === 'none') return 'Paiement en ligne désactivé — commande directe';
  if (mode === 'fixed') return `Acompte fixe : ${formatGNF(value)}`;
  if (!price) return 'Définissez un prix pour calculer l\'acompte';
  return `Acompte (${value}%) : ${formatGNF(Math.round(price * value / 100))}`;
}

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nouveau';
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [productId, setProductId] = useState<number | null>(isNew ? null : Number(id));

  const [form, setForm] = useState({
    name: '', categoryId: '', price: '', description: '',
    dimensions: '', finition: '', essence: '', isPublished: true,
    depositMode: 'percent', depositValue: '60',
  });
  const [images, setImages] = useState<Img[]>([]);

  /* ── Chargement ─────────────────────────────────────────────── */
  useEffect(() => {
    api.get<Cat[]>('/api/admin/categories').then(setCategories).catch(() => {});
    if (!isNew) {
      api.get<any>(`/api/admin/products/${id}`)
        .then((p) => {
          setForm({
            name: p.name,
            categoryId: p.category_id ? String(p.category_id) : '',
            price: String(p.price || ''),
            description: p.description || '',
            dimensions: p.dimensions || '',
            finition: p.finition || '',
            essence: p.essence || '',
            isPublished: p.is_published,
            depositMode: p.deposit_mode || 'percent',
            depositValue: String(p.deposit_value ?? 60),
          });
          setImages(p.images || []);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  /* ── Enregistrement ─────────────────────────────────────────── */
  const save = async () => {
    if (!form.name.trim()) { setError('Le nom du produit est requis.'); return; }
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        price: Number(form.price.replace(/[^\d]/g, '')) || 0,
        description: form.description,
        dimensions: form.dimensions,
        finition: form.finition,
        essence: form.essence,
        isPublished: form.isPublished,
        depositMode: form.depositMode,
        depositValue: Number(form.depositValue.replace(/[^\d]/g, '')) || 0,
      };
      if (isNew) {
        const created = await api.post<{ id: number }>('/api/admin/products', payload);
        setProductId(created.id);
        navigate(`/admin/catalogue/produit/${created.id}`, { replace: true });
      } else {
        await api.put(`/api/admin/products/${productId}`, payload);
      }
      setSavedMsg('Produit enregistré ✅');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Images ─────────────────────────────────────────────────── */
  const refreshImages = async () => {
    if (!productId) return;
    const updated = await api.get<any>(`/api/admin/products/${productId}`);
    setImages(updated.images || []);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !productId) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const url = await api.uploadFile(file, mediaType === 'video' ? 'produits/videos' : 'produits');
        await api.post(`/api/admin/products/${productId}/images`, { url, mediaType });
      }
      await refreshImages();
    } catch (e: any) {
      setError(`Upload : ${e.message}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const deleteImage = async (imgId: number) => {
    await api.delete(`/api/admin/images/${imgId}`);
    refreshImages();
  };

  const setMain = async (imgId: number) => {
    await api.put(`/api/admin/products/${productId}/images`, { mainImageId: imgId });
    refreshImages();
  };

  const moveImage = async (index: number, dir: -1 | 1) => {
    const ordered = [...images];
    const target = ordered[index + dir];
    if (!target) return;
    [ordered[index], ordered[index + dir]] = [ordered[index + dir], ordered[index]];
    setImages(ordered);
    await api.put(`/api/admin/products/${productId}/images`, { order: ordered.map((i) => i.id) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#e85d04] animate-spin" />
      </div>
    );
  }

  const inputCls = 'w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/10 transition';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5';

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin/catalogue" className="p-2.5 border border-neutral-200 rounded-sm text-neutral-500 hover:text-[#154c30] hover:border-[#154c30]/40 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">
              {isNew ? 'Nouveau produit' : form.name}
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {isNew ? 'Créez un modèle pour le catalogue' : 'Modifiez les informations et les images'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-emerald-600 font-medium">{savedMsg}</span>}
          <button
            onClick={save} disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-sm transition hover:brightness-110 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Créer le produit' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Colonne gauche : informations ─────────────────────── */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6 space-y-5">
          <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider border-b border-neutral-100 pb-3">
            Informations
          </h2>

          <div>
            <label className={labelCls}>Nom du produit *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Table basse Milano" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                <option value="">— Sans catégorie —</option>
                {(() => {
                  const sections = categories.filter((c) => c.parent_id === null);
                  const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);
                  const free = sections.filter((s) => childrenOf(s.id).length === 0);
                  const withSubs = sections.filter((s) => childrenOf(s.id).length > 0);
                  return (
                    <>
                      {free.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      {withSubs.map((s) => (
                        <optgroup key={s.id} label={s.name}>
                          <option value={s.id}>{s.name} (général)</option>
                          {childrenOf(s.id).map((sub) => <option key={sub.id} value={sub.id}>↳ {sub.name}</option>)}
                        </optgroup>
                      ))}
                    </>
                  );
                })()}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prix total (GNF)</label>
              <input type="text" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d]/g, '') })}
                placeholder="Ex : 1500000 (0 = sur devis)" className={inputCls} />
              <p className="text-[11px] text-neutral-400 mt-1">
                0 = « Prix sur demande » (paiement en ligne bloqué)
              </p>
            </div>
          </div>

          {/* Acompte — règle propre à ce produit */}
          <div className="border border-neutral-200 rounded-sm p-4 bg-neutral-50/50 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">Acompte à la commande</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: 'percent', label: 'Pourcentage', hint: 'du prix' },
                { mode: 'fixed', label: 'Montant fixe', hint: 'en GNF' },
                { mode: 'none', label: 'Désactivé', hint: 'sans paiement' },
              ].map((opt) => (
                <button key={opt.mode} type="button"
                  onClick={() => setForm({ ...form, depositMode: opt.mode, depositValue: opt.mode === 'percent' && !form.depositValue ? '60' : form.depositValue })}
                  className={`p-3 rounded-sm border text-center transition ${form.depositMode === opt.mode ? 'border-[#e85d04] bg-[#e85d04]/5' : 'border-neutral-200 bg-white hover:border-[#e85d04]/40'}`}>
                  <div className={`text-xs font-semibold ${form.depositMode === opt.mode ? 'text-[#e85d04]' : 'text-neutral-700'}`}>{opt.label}</div>
                  <div className="text-[10px] text-neutral-400">{opt.hint}</div>
                </button>
              ))}
            </div>
            {form.depositMode !== 'none' && (
              <div className="flex items-center gap-3">
                <input type="text" value={form.depositValue}
                  onChange={(e) => setForm({ ...form, depositValue: e.target.value.replace(/[^\d]/g, '') })}
                  className={`${inputCls} max-w-[140px]`}
                  placeholder={form.depositMode === 'percent' ? '60' : '500000'} />
                <span className="text-sm text-neutral-500 font-medium">{form.depositMode === 'percent' ? '%' : 'GNF'}</span>
                <span className="text-xs text-neutral-400 ml-auto text-right">
                  {previewDeposit(form.depositMode, Number(form.depositValue) || 0, Number(form.price.replace(/[^\d]/g, '')) || 0)}
                </span>
              </div>
            )}
            {form.depositMode === 'none' && (
              <p className="text-[11px] text-neutral-500">
                Le client commandera sans paiement en ligne : sa commande sera enregistrée et il confirmera sur WhatsApp.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4} placeholder="Décrivez le modèle, ses atouts, son style..." className={`${inputCls} resize-y`} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Dimensions</label>
              <input type="text" value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="Ex : 120×60cm" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Finition</label>
              <input type="text" value={form.finition} onChange={(e) => setForm({ ...form, finition: e.target.value })}
                placeholder="Ex : Vernis mat" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Essence</label>
              <input type="text" value={form.essence} onChange={(e) => setForm({ ...form, essence: e.target.value })}
                placeholder="Ex : Iroko massif" className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none pt-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
              className={`relative w-11 h-6 rounded-full transition ${form.isPublished ? 'bg-emerald-500' : 'bg-neutral-300'}`}
              aria-label="Publier"
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isPublished ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-neutral-700">
              {form.isPublished ? 'Visible sur le site' : 'Masqué du site'}
            </span>
          </label>
        </div>

        {/* ── Colonne droite : images ───────────────────────────── */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-5">
            <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">
              Médias ({images.filter((i) => i.media_type === 'image').length} image(s) · {images.filter((i) => i.media_type === 'video').length} vidéo(s))
            </h2>
            {productId && (
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-sm disabled:opacity-60 transition hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Upload en cours...' : 'Ajouter des médias'}
              </button>
            )}
          </div>

          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />

          {!productId && (
            <div className="border-2 border-dashed border-neutral-200 rounded-sm py-12 text-center">
              <Plus className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-400">
                Créez d'abord le produit pour pouvoir ajouter des médias.
              </p>
            </div>
          )}

          {productId && images.length === 0 && !uploading && (
            <div className="border-2 border-dashed border-neutral-200 rounded-sm py-12 text-center cursor-pointer hover:border-[#e85d04]/50 transition"
                 onClick={() => fileInput.current?.click()}>
              <Upload className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-400">Cliquez pour choisir des images ou vidéos<br />(JPG, PNG, WebP, MP4 — plusieurs fichiers possibles)</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={img.id} className={`relative group rounded-sm overflow-hidden border-2 ${img.is_main ? 'border-[#e85d04]' : 'border-neutral-200'}`}>
                {img.media_type === 'video' ? (
                  isVideoFileUrl(img.url) ? (
                    <video src={img.url} muted playsInline preload="metadata" className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 bg-secondary/60 text-neutral-500">
                      <Film className="w-8 h-8" />
                      <span className="text-[9px] px-2 text-center break-all">Vidéo externe</span>
                    </div>
                  )
                ) : (
                  <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                )}
                {img.is_main && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-1 rounded-sm"
                        style={{ background: '#e85d04' }}>
                    Principale
                  </span>
                )}
                {img.media_type === 'video' && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/70 text-white px-1.5 py-1 rounded-sm">VID</span>
                )}
                {/* Actions au survol */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30" title="Déplacer à gauche">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {img.media_type === 'image' && !img.is_main && (
                    <button onClick={() => setMain(img.id)}
                      className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04]" title="Définir comme image principale">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30" title="Déplacer à droite">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteImage(img.id)}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-red-500" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {images.length > 0 && (
            <p className="text-[11px] text-neutral-400 mt-4">
              L'image « Principale » apparaît dans la grille du catalogue (la première image ajoutée la devient par défaut — jamais une vidéo). Les vidéos sont lisibles en plein écran sur la fiche du produit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
