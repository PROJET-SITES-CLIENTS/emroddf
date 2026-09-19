// ══════════════════════════════════════════════════════════════════
// Paramètres du site — édition de tous les contenus éditoriaux
// (contact, accueil, témoignages, partenaires, FAQ, à propos, PDF, SEO)
// ══════════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react';
import {
  Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Upload, X, FileText, Send,
} from 'lucide-react';
import { api } from '../../lib/adminApi';

/* ── Petits composants réutilisables ─────────────────────────────── */
const inputCls = 'w-full px-3.5 py-2.5 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04] transition';
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/* Liste de chaînes simples */
function StringList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const update = (i: number, val: string) => { const c = [...items]; c[i] = val; onChange(c); };
  const move = (i: number, dir: -1 | 1) => {
    const c = [...items]; const t = c[i + dir]; if (!t) return;
    [c[i], c[i + dir]] = [c[i + dir], c[i]]; onChange(c);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input type="text" value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} className={inputCls} />
          <div className="flex flex-col">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-neutral-400 hover:text-[#e85d04] disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1 text-neutral-400 hover:text-[#e85d04] disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className="flex items-center gap-1.5 text-xs font-semibold text-[#e85d04] hover:underline pt-1">
        <Plus className="w-3.5 h-3.5" /> Ajouter
      </button>
    </div>
  );
}

/* Liste d'objets avec champs définis */
function ObjectList<T extends Record<string, any>>({
  items, fields, onChange, addLabel,
}: {
  items: T[];
  fields: { key: keyof T; label: string; textarea?: boolean; type?: string }[];
  onChange: (v: T[]) => void;
  addLabel: string;
}) {
  const update = (i: number, key: keyof T, val: any) => {
    const c = [...items]; c[i] = { ...c[i], [key]: val }; onChange(c);
  };
  const move = (i: number, dir: -1 | 1) => {
    const c = [...items]; const t = c[i + dir]; if (!t) return;
    [c[i], c[i + dir]] = [c[i + dir], c[i]]; onChange(c);
  };
  const emptyItem = () => {
    const obj: any = {}; fields.forEach((f) => (obj[f.key] = f.type === 'number' ? 0 : '')); return obj as T;
  };
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-neutral-200 rounded-sm p-4 bg-neutral-50/50 relative">
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-neutral-400 hover:text-[#e85d04] disabled:opacity-20"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1 text-neutral-400 hover:text-[#e85d04] disabled:opacity-20"><ChevronDown className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-16">
            {fields.map((f) => (
              <div key={String(f.key)} className={f.textarea ? 'md:col-span-2' : ''}>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">{f.label}</label>
                {f.textarea ? (
                  <textarea value={item[f.key] ?? ''} onChange={(e) => update(i, f.key, e.target.value)} rows={3} className={`${inputCls} resize-y`} />
                ) : (
                  <input type={f.type || 'text'} value={item[f.key] ?? ''} onChange={(e) => update(i, f.key, f.type === 'number' ? Number(e.target.value) || 0 : e.target.value)} className={inputCls} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, emptyItem()])} className="flex items-center gap-1.5 text-xs font-semibold text-[#e85d04] hover:underline">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/* Liste d'images avec upload */
function ImageList({ items, onChange, folder }: { items: string[]; onChange: (v: string[]) => void; folder: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = [...items];
      for (const file of Array.from(files)) {
        urls.push(await api.uploadFile(file, folder));
      }
      onChange(urls);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {items.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-sm overflow-hidden border border-neutral-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
              <button type="button" onClick={() => { const c = [...items]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; onChange(c); }} disabled={i === 0}
                className="p-1.5 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="p-1.5 bg-white/90 rounded-sm text-neutral-700 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => { const c = [...items]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; onChange(c); }} disabled={i === items.length - 1}
                className="p-1.5 bg-white/90 rounded-sm text-neutral-700 hover:text-[#e85d04] disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-sm disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? 'Upload...' : 'Ajouter des images'}
      </button>
    </div>
  );
}

/* ── Page principale ─────────────────────────────────────────────── */
const TABS = [
  { key: 'contact', label: 'Contact' },
  { key: 'home', label: 'Accueil' },
  { key: 'testimonials', label: 'Témoignages' },
  { key: 'partners', label: 'Partenaires' },
  { key: 'faq', label: 'FAQ Chatbot' },
  { key: 'faqContact', label: 'FAQ Contact' },
  { key: 'about', label: 'À propos' },
  { key: 'catalogPdf', label: 'PDF Catalogue' },
  { key: 'smtp', label: 'Notifications' },
  { key: 'seo', label: 'SEO' },
];

export default function SettingsManager() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [tab, setTab] = useState('contact');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api.get<Record<string, any>>('/api/admin/settings')
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setSection = (key: string, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveSection = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      await api.put('/api/admin/settings', { key: tab, value: settings[tab] });
      setSavedMsg('Enregistré ✅');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#e85d04] animate-spin" />
      </div>
    );
  }

  const s = settings || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Paramètres du site</h1>
          <p className="text-sm text-neutral-500 mt-1">Modifiez les contenus visibles par vos visiteurs</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-emerald-600 font-medium">{savedMsg}</span>}
          <button onClick={saveSection} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-sm transition hover:brightness-110 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm mb-6 flex justify-between items-center">
          {error}<button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-neutral-200 mb-6 pb-px">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
              tab === t.key ? 'border-[#e85d04] text-[#e85d04]' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm p-6 max-w-4xl">
        {/* ── CONTACT ─────────────────────────────────────────── */}
        {tab === 'contact' && (
          <div className="space-y-5">
            <Field label="Adresse (une ligne par ligne d'affichage)">
              <textarea value={s.contact?.address || ''} rows={4}
                onChange={(e) => setSection('contact', { ...s.contact, address: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Téléphones"><StringList items={s.contact?.phones || []} placeholder="+224 ..." onChange={(v) => setSection('contact', { ...s.contact, phones: v })} /></Field>
              <Field label="Emails"><StringList items={s.contact?.emails || []} placeholder="contact@..." onChange={(v) => setSection('contact', { ...s.contact, emails: v })} /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Numéro WhatsApp (format international, sans +)">
                <input type="text" value={s.contact?.whatsapp || ''} onChange={(e) => setSection('contact', { ...s.contact, whatsapp: e.target.value })} className={inputCls} placeholder="224623885959" />
              </Field>
              <Field label="Horaires (affichage complet)">
                <input type="text" value={s.contact?.hours || ''} onChange={(e) => setSection('contact', { ...s.contact, hours: e.target.value })} className={inputCls} placeholder="Lundi - Samedi: 8h - 18h" />
              </Field>
            </div>
            <Field label="Horaires (format court, pied de page)">
              <input type="text" value={s.contact?.hoursShort || ''} onChange={(e) => setSection('contact', { ...s.contact, hoursShort: e.target.value })} className={inputCls} placeholder="Lun–Sam · 8h–18h" />
            </Field>
          </div>
        )}

        {/* ── ACCUEIL ──────────────────────────────────────────── */}
        {tab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Badge (petit texte au-dessus du titre)">
                <input type="text" value={s.home?.badge || ''} onChange={(e) => setSection('home', { ...s.home, badge: e.target.value })} className={inputCls} />
              </Field>
              <div />
              <Field label="Titre — ligne 1">
                <input type="text" value={s.home?.title1 || ''} onChange={(e) => setSection('home', { ...s.home, title1: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Titre — ligne 2 (accent orange)">
                <input type="text" value={s.home?.title2 || ''} onChange={(e) => setSection('home', { ...s.home, title2: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Sous-titre">
              <textarea value={s.home?.subtitle || ''} rows={2} onChange={(e) => setSection('home', { ...s.home, subtitle: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Bouton 1 (catalogue)"><input type="text" value={s.home?.cta1Label || ''} onChange={(e) => setSection('home', { ...s.home, cta1Label: e.target.value })} className={inputCls} /></Field>
              <Field label="Bouton 2 (sur-mesure)"><input type="text" value={s.home?.cta2Label || ''} onChange={(e) => setSection('home', { ...s.home, cta2Label: e.target.value })} className={inputCls} /></Field>
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Images du carrousel d'accueil</p>
              <ImageList items={s.home?.heroImages || []} folder="accueil/hero" onChange={(v) => setSection('home', { ...s.home, heroImages: v })} />
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Mots défilants (bandeau)</p>
              <StringList items={s.home?.marquee || []} placeholder="Ex : Savoir-Faire" onChange={(v) => setSection('home', { ...s.home, marquee: v })} />
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Chiffres clés</p>
              <ObjectList items={s.home?.stats || []}
                fields={[{ key: 'value', label: 'Valeur', type: 'number' }, { key: 'suffix', label: 'Suffixe (+, %, h...)' }, { key: 'label', label: 'Libellé' }]}
                onChange={(v) => setSection('home', { ...s.home, stats: v })} addLabel="Ajouter un chiffre" />
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Cartes de valeurs (3 max. conseillé)</p>
              <ObjectList items={s.home?.values || []}
                fields={[{ key: 'title', label: 'Titre' }, { key: 'text', label: 'Texte', textarea: true }]}
                onChange={(v) => setSection('home', { ...s.home, values: v })} addLabel="Ajouter une valeur" />
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Paragraphes « La Signature EMROD »</p>
              <ObjectList items={(s.home?.signatureParagraphs || []).map((p: string) => ({ text: p }))}
                fields={[{ key: 'text', label: 'Paragraphe', textarea: true }]}
                onChange={(v: any[]) => setSection('home', { ...s.home, signatureParagraphs: v.map((x) => x.text) })}
                addLabel="Ajouter un paragraphe" />
            </div>

            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Images « Nos plus belles réalisations »</p>
              <ImageList items={s.home?.realisations || []} folder="accueil/realisations" onChange={(v) => setSection('home', { ...s.home, realisations: v })} />
            </div>
          </div>
        )}

        {/* ── TÉMOIGNAGES ──────────────────────────────────────── */}
        {tab === 'testimonials' && (
          <ObjectList items={s.testimonials || []}
            fields={[{ key: 'text', label: 'Témoignage', textarea: true }, { key: 'author', label: 'Auteur' }, { key: 'role', label: 'Rôle' }]}
            onChange={(v) => setSection('testimonials', v)} addLabel="Ajouter un témoignage" />
        )}

        {/* ── PARTENAIRES ──────────────────────────────────────── */}
        {tab === 'partners' && (
          <StringList items={s.partners || []} placeholder="Nom du partenaire" onChange={(v) => setSection('partners', v)} />
        )}

        {/* ── FAQ ──────────────────────────────────────────────── */}
        {(tab === 'faq' || tab === 'faqContact') && (
          <ObjectList items={s[tab] || []}
            fields={[{ key: 'q', label: 'Question' }, { key: 'a', label: 'Réponse', textarea: true }]}
            onChange={(v) => setSection(tab, v)} addLabel="Ajouter une question" />
        )}

        {/* ── À PROPOS ─────────────────────────────────────────── */}
        {tab === 'about' && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-5">
              <p className={labelCls}>Paragraphes d'introduction</p>
              <ObjectList items={(s.about?.paragraphs || []).map((p: string) => ({ text: p }))}
                fields={[{ key: 'text', label: 'Paragraphe', textarea: true }]}
                onChange={(v: any[]) => setSection('about', { ...s.about, paragraphs: v.map((x) => x.text) })}
                addLabel="Ajouter un paragraphe" />
            </div>
            <Field label="Citation (encadrée) : elle s'affiche entre guillemets">
              <textarea value={s.about?.quote || ''} rows={2} onChange={(e) => setSection('about', { ...s.about, quote: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
            <div className="border-t border-neutral-100 pt-5">
              <p className={labelCls}>Étapes du processus (4 conseillé)</p>
              <ObjectList items={s.about?.steps || []}
                fields={[{ key: 'title', label: 'Titre' }, { key: 'desc', label: 'Description', textarea: true }]}
                onChange={(v) => setSection('about', { ...s.about, steps: v })} addLabel="Ajouter une étape" />
            </div>
          </div>
        )}

        {/* ── PDF CATALOGUE ────────────────────────────────────── */}
        {tab === 'catalogPdf' && <CatalogPdfSection url={s.catalogPdf?.url || ''} onChange={(url) => setSection('catalogPdf', { url })} />}

        {/* ── NOTIFICATIONS (SMTP) ──────────────────────────────── */}
        {tab === 'smtp' && <SmtpSection smtp={s.smtp || {}} onChange={(v) => setSection('smtp', v)} />}

        {/* ── SEO ──────────────────────────────────────────────── */}
        {tab === 'seo' && (
          <div className="space-y-5">
            <Field label="Titre du site (onglet navigateur)">
              <input type="text" value={s.seo?.title || ''} onChange={(e) => setSection('seo', { ...s.seo, title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Description (moteurs de recherche)">
              <textarea value={s.seo?.description || ''} rows={3} onChange={(e) => setSection('seo', { ...s.seo, description: e.target.value })} className={`${inputCls} resize-y`} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section Notifications (SMTP) ────────────────────────────────── */
function SmtpSection({ smtp, onChange }: { smtp: any; onChange: (v: any) => void }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.post<any>('/api/admin/test-email');
      setTestResult({ ok: true, msg: 'Email de test envoyé ✅ Vérifiez votre boîte de réception (et les spams).' });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message || "Échec de l'envoi de test" });
    } finally {
      setTesting(false);
    }
  };

  const set = (k: string, v: any) => onChange({ ...smtp, [k]: v });

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Recevez un email à chaque <strong>nouveau prospect</strong>, <strong>commande sans acompte</strong>,{' '}
        <strong>paiement reçu</strong> et <strong>alerte fraude</strong>. Configuration SMTP
        (Gmail, Brevo, OVH, etc.) — laissez vide pour désactiver les notifications.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Serveur SMTP (hôte)">
          <input type="text" value={smtp.host || ''} placeholder="Ex : smtp.gmail.com"
            onChange={(e) => set('host', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Port">
            <input type="text" value={smtp.port || ''} placeholder="587"
              onChange={(e) => set('port', e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
          </Field>
          <Field label="Sécurité">
            <select
              value={smtp.secure === true || (smtp.secure !== false && String(smtp.port || '587') === '465') ? '465' : '587'}
              onChange={(e) => set('secure', e.target.value === '465')} className={inputCls}>
              <option value="587">587 — TLS</option>
              <option value="465">465 — SSL</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Utilisateur (email du compte SMTP)">
          <input type="text" value={smtp.user || ''} placeholder="Ex : moncompte@gmail.com"
            onChange={(e) => set('user', e.target.value)} className={inputCls} />
        </Field>
        <Field label={smtp.hasPass ? 'Mot de passe SMTP (déjà configuré ✓ — laisser vide pour conserver)' : 'Mot de passe SMTP (ou « mot de passe d\'application »)'}>
          <input type="password" value={smtp.pass || ''} placeholder={smtp.hasPass ? '•••••••• (inchangé)' : 'Mot de passe d\'application'}
            onChange={(e) => set('pass', e.target.value)} className={inputCls} autoComplete="new-password" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Expéditeur affiché (optionnel — défaut : utilisateur)">
          <input type="text" value={smtp.from || ''} placeholder="Ex : notifications@emroddf.com"
            onChange={(e) => set('from', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Destinataire des notifications (optionnel — défaut : utilisateur)">
          <input type="text" value={smtp.to || ''} placeholder="Ex : direction@emroddf.com"
            onChange={(e) => set('to', e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-sm p-4 text-[13px] text-blue-900/80 leading-relaxed">
        <strong>💡 Exemple avec Gmail :</strong> hôte <code>smtp.gmail.com</code>, port <code>587</code>, utilisateur = votre
        adresse Gmail, mot de passe = un <strong>mot de passe d'application</strong> (à créer sur
        myaccount.google.com → Sécurité → Validation en deux étapes → Mots de passe d'application).
        Pour Brevo : <code>smtp-relay.brevo.com</code>, port 587.
      </div>

      {testResult && (
        <div className={`text-sm px-4 py-3 rounded-sm border ${testResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {testResult.msg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" onClick={sendTest} disabled={testing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm border border-neutral-200 rounded-sm hover:border-[#154c30] hover:text-[#154c30] transition disabled:opacity-50">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer un email de test
        </button>
        <span className="text-xs text-neutral-400">
          Pensez à « Enregistrer » la configuration avant le test.
        </span>
      </div>
    </div>
  );
}

/* ── Section PDF catalogue ───────────────────────────────────────── */
function CatalogPdfSection({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Le fichier doit être un PDF.'); return; }
    setUploading(true);
    setError('');
    try {
      const blobUrl = await api.uploadFile(file, 'catalogue');
      onChange(blobUrl);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Ce fichier est téléchargé par le bouton « Découvrir le catalogue » de la page d'accueil.
      </p>
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-sm disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #e85d04, #b84600)' }}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Upload en cours...' : 'Téléverser un nouveau PDF'}
      </button>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">{error}</div>}
      {url && (
        <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-sm p-4">
          <FileText className="w-8 h-8 text-[#e85d04] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Catalogue actuel</p>
            <a href={url} target="_blank" rel="noreferrer" className="text-sm text-[#154c30] hover:text-[#e85d04] truncate block">{url}</a>
          </div>
        </div>
      )}
    </div>
  );
}
