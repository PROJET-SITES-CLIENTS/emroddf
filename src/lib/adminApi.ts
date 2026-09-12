// ══════════════════════════════════════════════════════════════════
// Client API pour le tableau de bord administrateur.
// Toutes les requêtes /api/admin/* : si session expirée (401),
// redirection automatique vers la page de connexion.
// ══════════════════════════════════════════════════════════════════
import { upload as blobUpload } from '@vercel/blob/client';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !url.includes('/admin/login')) {
    window.location.href = '/admin/login';
    throw new ApiError('Session expirée', 401);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new ApiError(err.error || `Erreur ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  // Upload direct navigateur → Vercel Blob (passe par /api/vercel/blob/upload
  // qui vérifie la session admin). Retourne l'URL publique du fichier.
  uploadFile: async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]+/g, '-')
      .slice(-60);
    const newBlob = await blobUpload(`${folder}/${Date.now()}-${safeName || `fichier.${ext}`}`, file, {
      access: 'public',
      handleUploadUrl: '/api/vercel/blob/upload',
    });
    return newBlob.url;
  },
};

// ── Formats ────────────────────────────────────────────────────────
export function formatGNF(n: number | string | null | undefined): string {
  const num = Number(n) || 0;
  if (!num) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(num)} GNF`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
