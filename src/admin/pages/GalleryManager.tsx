// ══════════════════════════════════════════════════════════════════
// Galerie — gestion des images et vidéos publiques
// ══════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Upload, Loader2, Trash2, Eye, EyeOff, Link2, ChevronLeft, ChevronRight, Film, Plus, X,
} from 'lucide-react';
import { api } from '../../lib/adminApi';

interface Item {
  id: number; media_type: 'image' | 'video'; url: string;
  title: string; is_published: boolean; position: number;
}

export default function GalleryManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api.get<Item[]>('/api/admin/gallery')
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const url = await api.uploadFile(file, mediaType === 'video' ? 'galerie/videos' : 'galerie/images');
        await api.post('/api/admin/gallery', {
          mediaType,
          url,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }
      load();
    } catch (e: any) {
      setError(`Upload : ${e.message}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const addExternalLink = async () => {
    if (!linkUrl.trim()) return;
    try {
      await api.post('/api/admin/gallery', {
        mediaType: 'video',
        url: linkUrl.trim(),
        title: linkTitle.trim(),
      });
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkTitle('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const togglePublish = async (item: Item) => {
    await api.put(`/api/admin/gallery/${item.id}`, { isPublished: !item.is_published });
    load();
  };

  const remove = async (item: Item) => {
    await api.delete(`/api/admin/gallery/${item.id}`);
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = items[index + dir];
    if (!target) return;
    const ordered = [...items];
    [ordered[index], ordered[index + dir]] = [ordered[index + dir], ordered[index]];
    setItems(ordered);
    await api.put('/api/admin/gallery/reorder', { order: ordered.map((i) => i.id) });
  };

  const renameTitle = async (item: Item, title: string) => {
    await api.put(`/api/admin/gallery/${item.id}`, { title });
    load();
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Galerie</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {items.filter((i) => i.is_published).length} média(s) visible(s) sur {items.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-[#154c30] hover:text-[#154c30] transition"
          >
            <Link2 className="w-4 h-4" /> Lien vidéo externe
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-white rounded-sm transition hover:brightness-110 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Upload en cours...' : 'Ajouter des médias'}
          </button>
        </div>
      </div>

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6 flex items-center justify-between">
          {error}
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-white border border-neutral-200 rounded-sm animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div
          className="border-2 border-dashed border-neutral-300 rounded-sm py-20 text-center cursor-pointer hover:border-[#e85d04]/50 transition"
          onClick={() => fileInput.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500">Cliquez pour ajouter vos premières images ou vidéos</p>
          <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WebP, MP4 — plusieurs fichiers possibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <div key={item.id} className={`bg-white border rounded-sm overflow-hidden group ${item.is_published ? 'border-neutral-200' : 'border-amber-200 opacity-75'}`}>
              <div className="relative aspect-square bg-neutral-100">
                {item.media_type === 'video' ? (
                  /\.(mp4|webm|mov)(\?|$)/i.test(item.url) || item.url.includes('.blob.') ? (
                    <video src={item.url} muted className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
                      <Film className="w-8 h-8" />
                      <span className="text-[10px] px-2 text-center break-all">Vidéo externe</span>
                    </div>
                  )
                ) : (
                  <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                )}

                {/* Badge masqué */}
                {!item.is_published && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-sm">
                    Masqué
                  </span>
                )}
                {item.media_type === 'video' && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold uppercase bg-black/60 text-white px-2 py-1 rounded-sm">Vidéo</span>
                )}

                {/* Actions au survol */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30" title="Déplacer à gauche">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => togglePublish(item)}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04]" title={item.is_published ? 'Masquer' : 'Publier'}>
                    {item.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30" title="Déplacer à droite">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(item)}
                    className="p-2 bg-white/90 rounded-sm text-neutral-700 hover:text-red-500" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Titre éditable */}
              <input
                type="text" defaultValue={item.title}
                onBlur={(e) => e.target.value !== item.title && renameTitle(item, e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full px-3 py-2 text-xs border-t border-neutral-100 focus:outline-none focus:border-[#e85d04] bg-transparent"
              />
            </div>
          ))}
        </div>
      )}

      {/* Modale lien externe */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && setShowLinkModal(false)}>
          <div className="bg-white rounded-sm w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-heading text-xl text-[#154c30] mb-1">Ajouter une vidéo externe</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Collez l'URL d'embed d'une vidéo (YouTube, Google Drive « /preview », etc.)
            </p>
            <div className="space-y-3">
              <input
                type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/..." autoFocus
                className="w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04]"
              />
              <input
                type="text" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowLinkModal(false)} className="px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700">Annuler</button>
              <button
                onClick={addExternalLink} disabled={!linkUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
