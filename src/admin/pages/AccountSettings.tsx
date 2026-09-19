// ══════════════════════════════════════════════════════════════════
// Mon compte — changement du mot de passe administrateur
// ══════════════════════════════════════════════════════════════════
import { useState } from 'react';
import { KeyRound, ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/adminApi';

export default function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const strongEnough = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (!strongEnough) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!hasUpper) {
      setError('Ajoutez au moins un chiffre, une majuscule ou un symbole pour renforcer le mot de passe.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/admin/password', { currentPassword, newPassword });
      setSuccess('Mot de passe modifié ✅ Utilisez-le dès votre prochaine connexion.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 border border-neutral-200 rounded-sm text-sm focus:outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/10 transition';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading text-[#154c30]">Mon compte</h1>
        <p className="text-sm text-neutral-500 mt-1">Sécurité de l'accès au tableau de bord</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Changement de mot de passe */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-4 mb-5">
            <div className="w-10 h-10 rounded-sm bg-[#e85d04]/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#e85d04]" />
            </div>
            <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider">Changer le mot de passe</h2>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={labelCls}>Mot de passe actuel</label>
              <input
                type="password" value={currentPassword} required
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputCls} placeholder="••••••••"
              />
            </div>
            <div>
              <label className={labelCls}>Nouveau mot de passe</label>
              <input
                type="password" value={newPassword} required
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={inputCls} placeholder="Au moins 8 caractères"
              />
              {newPassword && (
                <div className="flex gap-1 mt-2">
                  <span className={`h-1 flex-1 rounded-sm ${newPassword.length >= 8 ? 'bg-emerald-400' : 'bg-neutral-200'}`} />
                  <span className={`h-1 flex-1 rounded-sm ${strongEnough && hasUpper ? 'bg-emerald-400' : strongEnough ? 'bg-amber-300' : 'bg-neutral-200'}`} />
                  <span className={`h-1 flex-1 rounded-sm ${strongEnough && hasUpper && newPassword.length >= 12 ? 'bg-emerald-400' : 'bg-neutral-200'}`} />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Confirmer le nouveau mot de passe</label>
              <input
                type="password" value={confirmPassword} required
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : ''}`}
                placeholder="••••••••"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> {success}
              </div>
            )}

            <button
              type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-5 py-3 text-sm text-white rounded-sm transition hover:brightness-110 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #11522f, #154c30)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Modifier le mot de passe
            </button>
          </form>
        </div>

        {/* Informations */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6 h-fit">
          <h2 className="font-semibold text-neutral-800 text-sm uppercase tracking-wider border-b border-neutral-100 pb-4 mb-5">
            Bonnes pratiques
          </h2>
          <ul className="space-y-4 text-sm text-neutral-600">
            <li className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-[#154c30] shrink-0 mt-0.5" />
              <span>Le mot de passe est stocké <strong>haché</strong> (scrypt + sel aléatoire) : il est impossible de le lire, même avec accès à la base.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-[#154c30] shrink-0 mt-0.5" />
              <span>Au moins <strong>8 caractères</strong>, idéalement 12+, avec chiffres, majuscules ou symboles.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-[#154c30] shrink-0 mt-0.5" />
              <span>Votre session expire automatiquement après <strong>12 heures</strong>.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-[#154c30] shrink-0 mt-0.5" />
              <span>Le mot de passe initial (variable Vercel <code className="bg-neutral-100 px-1 rounded">ADMIN_PASSWORD</code>) cesse de fonctionner dès qu'un mot de passe est défini ici.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
