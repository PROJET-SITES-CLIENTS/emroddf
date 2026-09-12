// ══════════════════════════════════════════════════════════════════
// GET  /api/admin/settings — toutes les sections (base + défauts)
// PUT  /api/admin/settings — { key, value } : enregistre une section
// ══════════════════════════════════════════════════════════════════
import { requireAdmin } from '../_lib/auth';
import { getAllSettings, getSetting, setSetting } from '../_lib/db';
import defaults from '../../db/default-settings.json';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const stored = await getAllSettings();
      // Fusion base > défauts pour l'affichage complet dans l'éditeur
      const merged: Record<string, any> = { ...(defaults as Record<string, any>), ...stored };
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
      if (!key || typeof key !== 'string' || key.length > 100) {
        return res.status(400).json({ error: 'Clé invalide' });
      }
      if (value === undefined || value === null) {
        return res.status(400).json({ error: 'Valeur manquante' });
      }
      await setSetting(key, value);
      return res.status(200).json({ success: true, value: await getSetting(key) });
    } catch (err: any) {
      console.error('settings PUT error:', err);
      return res.status(500).json({ error: "Erreur d'enregistrement des paramètres" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
