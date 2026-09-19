# EMROD SARL — Site vitrine + boutique avec tableau de bord

Site de présentation et de commande en ligne pour **EMROD SARL**, entreprise de mobilier sur mesure fabriqué par des femmes, à Conakry (Guinée).

## Architecture

- **Frontend** : React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Motion
- **Site public** (`/`) : accueil, à propos, catalogue, galerie, contact
- **Tableau de bord** (`/admin`) : gestion complète du site en français
- **Backend** : fonctions serverless Vercel (`api/`)
- **Base de données** : PostgreSQL (Neon) — catalogue, commandes, prospects, paramètres
- **Stockage médias** : Vercel Blob (images produits, galerie, PDF catalogue)
- **Paiement** : Djomy (Mobile Money Guinée) — acompte 60 %, webhook signé HMAC
- **Hébergement** : Vercel

## Sécurité

- Le prix des produits est **toujours lu en base côté serveur** lors du paiement (aucune confiance aux données du navigateur).
- Webhook Djomy validé par signature HMAC-SHA256 sur le corps brut + contrôle anti-fraude (acompte payé vs attendu).
- Accès tableau de bord protégé par compte administrateur unique (cookie httpOnly signé, expiration 12 h).
- Formulaires publics protégés par pot de miel anti-spam.

## Développement

```bash
npm install
npm run dev          # site sur http://localhost:3001 (utiliser `vercel dev` pour les API)
npm run lint         # vérification TypeScript
npm run build        # build de production
npm run db:setup     # crée les tables + paramètres par défaut (DATABASE_URL requise)
npm run migrate:drive  # migration unique Google Drive → Neon/Blob (abandonnée depuis)
```

## Variables d'environnement (Vercel → Settings → Environment Variables)

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL Neon |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (téléversement des médias) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Identifiants initiaux du tableau de bord (le mot de passe est ensuite modifiable dans « Mon compte ») |
| `ADMIN_SESSION_SECRET` | Secret de signature des sessions (chaîne aléatoire longue) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `NOTIFY_EMAIL` | *(Optionnel)* Notifications email — alternative configurable directement dans le tableau de bord |
| `DJOMY_CLIENT_ID` / `DJOMY_CLIENT_SECRET` / `DJOMY_PARTNER_DOMAIN` | API de paiement Djomy |
| `VITE_PUBLIC_URL` | URL publique du site (redirections paiement) |

## Documentation utilisateur

Voir [MODE_D_EMPLOI_TABLEAU_DE_BORD.md](./MODE_D_EMPLOI_TABLEAU_DE_BORD.md) — guide complet du tableau de bord pour l'administrateur du site.
