---
name: emrod-fix-payment-security
description: Corrige les vulnérabilités critiques du système de paiement Djomy (manipulation de prix et failles Webhook) sur le projet EMROD.
---

# 🚨 Contexte et Objectif
Ce skill est généré suite à un audit de sécurité. Il guide pas-à-pas la correction des vulnérabilités critiques liées à l'intégration du paiement Djomy dans le projet EMROD SARL.

**Vulnérabilités à corriger :**
1. Le frontend (`OrderModal.tsx`) calcule l'acompte et l'envoie au backend (`create.ts`), permettant une manipulation du prix (ex: payer 1 GNF au lieu de 60%).
2. Le `webhook.ts` se base sur les `metadata` falsifiables envoyées par le client pour enregistrer la commande dans Google Sheets, au lieu de s'assurer que le montant payé correspond au prix du produit.
3. Le flux du webhook utilise une concaténation de string non-sécurisée.

---

# 🛠️ Étapes d'exécution obligatoires

## Étape 1 : Sécurisation du calcul de l'acompte (Backend)
Dans `api/payment/create.ts` :
1. **Modifier la logique de réception** : Le frontend ne doit plus envoyer `amount` (l'acompte calculé). Il doit envoyer le `prixTotal` (numérique) et le `produit`.
2. **Si le catalogue est statique ou hébergé sur Drive** : Puisqu'il n'y a pas de base de données, le backend doit générer une empreinte ou au moins recalculer l'acompte côté serveur de manière stricte. 
3. *Idéalement* : Créer un petit dictionnaire/fichier de prix côté serveur (ex: `api/payment/catalog_prices.json`) si les prix sont fixes. Si les prix sont dynamiques, utiliser un secret cryptographique (HMAC) partagé pour signer le prix côté backend avant l'affichage frontend (optionnel si trop complexe, mais le recalcul de 60% doit être fait sur le serveur).
4. Forcer le calcul : `const acompteCalcule = Math.round(prixTotalNumeric * 0.6);`. C'est ce `acompteCalcule` qui doit être envoyé à l'API Djomy.
5. Ajouter les vraies métadonnées sécurisées (prix attendu, acompte attendu).

## Étape 2 : Blindage du Webhook (`api/payment/webhook.ts`)
Dans `api/payment/webhook.ts` :
1. **Remplacer la lecture du rawBody** :
   ```typescript
   const chunks = [];
   for await (const chunk of req) {
     chunks.push(chunk);
   }
   const rawBody = Buffer.concat(chunks).toString('utf8');
   ```
2. **Ajouter la validation métier** :
   Avant d'appeler le Google Apps Script, vérifier que `data.paidAmount` correspond bien à l'acompte attendu pour le produit. S'il y a un décalage (quelqu'un a payé 1 GNF pour un produit à 10 millions), le webhook DOIT logger une alerte de fraude dans le Google Sheet (ex: ajouter un flag `[ATTENTION FRAUDE]`) ou rejeter l'événement, plutôt que de marquer la commande comme valide.

## Étape 3 : Nettoyage du Frontend (`OrderModal.tsx`)
Dans `src/components/OrderModal.tsx` :
1. Ne plus envoyer le `amount: acompteNumeric` dans le corps de la requête vers `/api/payment/create`.
2. Envoyer le prix total (`prixNumeric`) et laisser le backend se débrouiller avec le calcul de l'acompte.

## Étape 4 : Tests
1. Simuler une requête POST malveillante vers `/api/payment/create` avec des montants trafiqués pour vérifier que le backend les rejette ou recalcule correctement l'acompte.
2. Vérifier que la compilation TypeScript passe (`npm run tsc`).
