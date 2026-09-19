// ══════════════════════════════════════════════════════════════════
// GET /api/public/settings
// Tous les paramètres du site, fusionnés sur les valeurs par défaut.
// ⚠️ Les clés sensibles (smtp, adminPassword) ne sont JAMAIS exposées.
// ══════════════════════════════════════════════════════════════════
import { getAllSettings } from '../../lib/db';
import defaults from '../../../db/default-settings.json';

const SENSITIVE_KEYS = ['smtp', 'adminPassword'];

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');

  try {
    let stored: Record<string, any> = {};
    try {
      stored = await getAllSettings();
    } catch {
      // Base indisponible → on sert les défauts pour que le site reste en ligne
    }

    // Fusion profonde simple : les valeurs en base écrasent les défauts
    const merged: Record<string, any> = { ...defaults };
    for (const key of Object.keys(defaults as Record<string, any>)) {
      if (SENSITIVE_KEYS.includes(key)) continue;
      if (stored[key] !== undefined && stored[key] !== null) {
        const dv = (defaults as Record<string, any>)[key];
        merged[key] =
          dv && typeof dv === 'object' && !Array.isArray(dv) && stored[key] && typeof stored[key] === 'object' && !Array.isArray(stored[key])
            ? { ...dv, ...stored[key] }
            : stored[key];
      }
    }
    // Sections custom ajoutées par l'admin (hors défauts) — sauf sensibles
    for (const key of Object.keys(stored)) {
      if (!(key in merged) && !SENSITIVE_KEYS.includes(key)) merged[key] = stored[key];
    }

    return res.status(200).json(merged);
  } catch (err: any) {
    console.error('settings error:', err);
    return res.status(500).json({ error: 'Erreur de chargement des paramètres' });
  }
}
