// ══════════════════════════════════════════════════════════════════
// POST /api/vercel/blob/upload — autorisation d'upload direct
// navigateur → Vercel Blob (protégée par la session admin).
// Le front utilise upload() de @vercel/blob/client qui appelle
// automatiquement cette route.
// ══════════════════════════════════════════════════════════════════
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAdmin } from '../../_lib/auth';

export default async function handler(req: any, res: any) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'application/pdf',
        ],
        maximumSizeInBytes: 200 * 1024 * 1024, // 200 Mo (vidéos)
        tokenPayload: JSON.stringify({ role: 'admin' }),
      }),
      onUploadCompleted: async () => {
        // Pas de traitement supplémentaire nécessaire (le front enregistre l'URL en base)
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err: any) {
    console.error('blob upload error:', err);
    return res.status(500).json({ error: "Erreur d'autorisation d'upload" });
  }
}
