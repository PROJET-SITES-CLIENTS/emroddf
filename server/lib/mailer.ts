// ══════════════════════════════════════════════════════════════════
// Envoi d'emails de notification via SMTP (Nodemailer).
//
// Configuration (priorité décroissante) :
//   1. Section « smtp » des paramètres (éditable dans le tableau de
//      bord → Paramètres → Notifications) — stockée en base
//   2. Variables d'environnement SMTP_HOST / SMTP_PORT / SMTP_SECURE /
//      SMTP_USER / SMTP_PASS / NOTIFY_EMAIL
//
// Si aucune configuration n'existe, les notifications sont ignorées
// silencieusement (journalisées) — le site fonctionne normalement.
// ══════════════════════════════════════════════════════════════════
import nodemailer from 'nodemailer';
import { getSetting } from './db';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string; // adresse expéditeur (défaut : user)
  to?: string;   // destinataire (défaut : user)
}

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;
let cachedKey = '';

async function resolveConfig(): Promise<SmtpConfig | null> {
  // 1. Configuration en base (tableau de bord)
  let stored: any = null;
  try {
    stored = await getSetting('smtp');
  } catch { /* base indisponible → repli env */ }

  if (stored && stored.host && stored.user && stored.pass) {
    return {
      host: String(stored.host),
      port: Number(stored.port) || 587,
      secure: Boolean(stored.secure ?? Number(stored.port) === 465),
      user: String(stored.user),
      pass: String(stored.pass),
      from: stored.from || undefined,
      to: stored.to || undefined,
    };
  }

  // 2. Variables d'environnement
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      to: process.env.NOTIFY_EMAIL || undefined,
    };
  }

  return null;
}

async function getTransport(): Promise<{ transport: any; from: string; to: string } | null> {
  const cfg = await resolveConfig();
  if (!cfg) return null;

  // Le cache inclut le mot de passe : un changement de config en base
  // reconstruit automatiquement le transport
  const key = JSON.stringify([cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass, cfg.from, cfg.to]);
  if (!cachedTransport || cachedKey !== key) {
    cachedTransport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    cachedKey = key;
  }
  return { transport: cachedTransport, from: cfg.from || cfg.user, to: cfg.to || cfg.user };
}

// ── Gabarit email EMROD ────────────────────────────────────────────
export function emailShell(title: string, rows: [string, string][], cta?: { label: string; url: string }): string {
  const cells = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 16px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:8px 16px;color:#111827;font-size:13px;font-weight:600;">${v}</td>
      </tr>`
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0d3320,#11522f);padding:20px 24px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:2px;">EMROD SARL</span>
      <span style="color:#e85d04;font-size:11px;margin-left:10px;letter-spacing:2px;">ADMINISTRATION</span>
    </div>
    <div style="padding:8px 0 16px;">
      <h2 style="margin:16px 24px 4px;color:#0d3320;font-size:18px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">${cells}</table>
      ${
        cta
          ? `<div style="padding:16px 24px 0;">
               <a href="${cta.url}" style="display:inline-block;background:#e85d04;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:bold;">${cta.label}</a>
             </div>`
          : ''
      }
      <p style="margin:20px 24px 0;color:#9ca3af;font-size:11px;">Message automatique envoyé par le site EMROD — aucune réponse n'est nécessaire.</p>
    </div>
  </div>
</body></html>`;
}

function textVersion(rows: [string, string][]): string {
  return rows.map(([k, v]) => `${k} : ${v}`).join('\n');
}

/**
 * Envoie une notification email. Ne lève JAMAIS d'exception :
 * une défaillance SMTP ne doit pas interrompre le flux principal.
 * @returns true si envoyé, false sinon.
 */
export async function sendNotification(subject: string, rows: [string, string][], cta?: { label: string; url: string }): Promise<boolean> {
  const t = await getTransport();
  if (!t) {
    console.log(`📧 SMTP non configuré — notification ignorée : ${subject}`);
    return false;
  }
  try {
    await t.transport.sendMail({
      from: `"Site EMROD" <${t.from}>`,
      to: t.to,
      subject,
      text: `${subject}\n\n${textVersion(rows)}`,
      html: emailShell(subject, rows, cta),
    });
    return true;
  } catch (e: any) {
    console.error(`Erreur envoi email "${subject}" :`, e.message);
    return false;
  }
}

/** Indique si un SMTP est configuré (base ou env) — utilisé par l'UI */
export async function isSmtpConfigured(): Promise<boolean> {
  return (await resolveConfig()) !== null;
}
