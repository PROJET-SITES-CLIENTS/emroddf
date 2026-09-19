// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/settings — toutes les sections (base + défauts)
//        ⚠️ 'adminPassword' n'est jamais renvoyé ; 'smtp' est renvoyé
//        sans son mot de passe (+ indicateur hasPass)
// PUT  /api/admin/settings — { key, value } : enregistre une section
//        Pour 'smtp' : un mot de passe vide conserve l'existant
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../../_lib/auth';
import { getAllSettings, getSetting, setSetting } from '../../_lib/db';
import defaults from '../../../db/default-settings.json';

const INTERNAL_KEYS = ['adminPassword']; // jamais exposés, même à l'admin

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const stored = await getAllSettings();
      // Fusion base > défauts pour l'affichage complet dans l'éditeur
      const merged: Record<string, any> = { ...(defaults as Record<string, any>), ...stored };
      for (const k of INTERNAL_KEYS) delete merged[k];
      // Masquage du mot de passe SMTP (jamais renvoyé au navigateur)
      if (merged.smtp) {
        merged.smtp = { ...merged.smtp, pass: '', hasPass: Boolean(stored.smtp?.pass) };
      }
      return res.status(200).json(merged);
    } catch (err: any) {
      console.error('settings GET error:', err);
      return res.status(500).json({ error: 'Erreur de lecture des paramètres' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { key, value } = body;
      if (!key || typeof key !== 'string' || key.length > 100 || INTERNAL_KEYS.includes(key)) {
        return res.status(400).json({ error: 'Clé invalide' });
      }
      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Valeur manquante' });
      }

      // SMTP : un mot de passe vide → conserver l'existant
      if (key === 'smtp' && value && typeof value === 'object' && !value.pass) {
        const existing = await getSetting('smtp');
        if (existing?.pass) value.pass = existing.pass;
      }

      await setSetting(key, value);

      // Réponse sans secrets
      const saved = await getSetting(key);
      if (key === 'smtp' && saved) {
        return res.status(200).json({ success: true, value: { ...saved, pass: '', hasPass: Boolean(saved.pass) } });
      }
      return res.status(200).json({ success: true, value: saved });
    } catch (err: any) {
      console.error('settings PUT error:', err);
      return res.status(500).json({ error: "Erreur d'enregistrement des paramètres" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
