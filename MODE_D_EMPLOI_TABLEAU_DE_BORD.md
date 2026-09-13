════════════════════════════════════════════════════════════════════
        EMROD SARL — MODE D'EMPLOI : LE TABLEAU DE BORD
════════════════════════════════════════════════════════════════════

Le site n'utilise PLUS Google Drive. Tout se gère désormais depuis
votre tableau de bord d'administration :

        🔗 https://emrod.vercel.app/admin

Connectez-vous avec l'email et le mot de passe administrateur
(définis dans les variables d'environnement ADMIN_EMAIL et
ADMIN_PASSWORD du projet Vercel).

──────────────────────────────────────────────────────────────────────
 1. ACCUEIL DU TABLEAU DE BORD
──────────────────────────────────────────────────────────────────────
D'un coup d'œil : nouveaux prospects, commandes payées, montant
encaissé, produits en ligne — ainsi que les dernières demandes et
commandes reçues.

──────────────────────────────────────────────────────────────────────
 2. CATALOGUE (page « Modèles & Services » du site)
──────────────────────────────────────────────────────────────────────
SECTIONS ET SOUS-SECTIONS :
 • « Section / Catégorie » → créez une SECTION (ex : « Chambres »)
   ou une SOUS-SECTION en choisissant son rattachement
   (ex : « Lits » à l'intérieur de « Chambres »).
 • Sur le site : les sections s'affichent en onglets ; sélectionner
   une section révèle ses sous-sections (filtres « ↳ »).
 • 2 niveaux maximum. Supprimer une section promeut ses
   sous-sections au premier niveau (rien n'est perdu).

CRÉER / MODIFIER UN PRODUIT :
 • « Nouveau produit » → nom, catégorie (section ou sous-section),
   prix (en GNF), description, dimensions, finition, essence.
 • Prix = 0 → le produit s'affiche « Prix sur demande » et le
   paiement en ligne est désactivé pour ce produit.
 • Bouton œil → masquer/afficher un produit sur le site sans le
   supprimer.

ACOMPTE À LA COMMANDE (règle propre à CHAQUE produit) :
 • Pourcentage  → ex : 60% du prix (modifiable à tout moment,
   ex : 30% aujourd'hui, 60% demain).
 • Montant fixe → ex : 500 000 GNF quel que soit le prix.
 • Désactivé    → aucun paiement en ligne : le client commande,
   sa commande est enregistrée et il confirme sur WhatsApp.
 • Le système de paiement Djomy déduit TOUJOURS automatiquement
   le montant correspondant à la règle en vigueur.
 • Les changements s'appliquent immédiatement aux commandes
   suivantes (les commandes déjà payées restent inchangées).

MÉDIAS DU PRODUIT (IMAGES + VIDÉOS) :
 • « Ajouter des médias » → images (JPG/PNG/WebP) ET vidéos
   (MP4) — plusieurs fichiers à la fois.
 • Les vidéos apparaissent dans la fiche produit : le visiteur
   peut les lire en plein écran, à côté des photos.
 • La 1ère IMAGE devient la vignette du catalogue (jamais une
   vidéo). Étoile ★ → choisir une autre image comme principale.
 • Flèches ← → → réordonner. Corbeille → supprimer.

──────────────────────────────────────────────────────────────────────
 3. GALERIE
──────────────────────────────────────────────────────────────────────
 • « Ajouter des médias » → images (JPG/PNG/WebP) ou vidéos (MP4).
 • « Lien vidéo externe » → coller une URL d'embed (YouTube, Drive).
 • Chaque média peut être masqué (œil), réordonné (flèches),
   renommé (cliquez sur le titre sous la vignette) ou supprimé.

──────────────────────────────────────────────────────────────────────
 4. PROSPECTS
──────────────────────────────────────────────────────────────────────
Toutes les demandes du formulaire de contact et du popup arrivent ici.
 • Statuts : Nouveau → Contacté → Archivé.
 • Cliquez sur une ligne pour voir la fiche complète (message inclus).
 • Boutons téléphone/email pour contacter en un clic.
 • « Export CSV » → télécharger la liste pour Excel.

──────────────────────────────────────────────────────────────────────
 5. COMMANDES
──────────────────────────────────────────────────────────────────────
Chaque commande est créée automatiquement quand un client clique sur
« Confirmer la commande ». Le statut se met à jour tout seul via le
paiement Djomy :

 • En attente → le client n'a pas encore payé l'acompte (ou commande
   sans acompte en ligne : à traiter directement avec le client).
 • Payée       → acompte reçu (confirmation automatique Djomy).
 • Échouée     → paiement incomplet : VÉRIFIEZ avant de produire !

Vous pouvez changer le statut manuellement (ex. « Remboursée ») et
exporter la liste en CSV.

──────────────────────────────────────────────────────────────────────
 6. PARAMÈTRES DU SITE — TOUT PILOTER
──────────────────────────────────────────────────────────────────────
 • Onglet CONTACT     : adresse, téléphones, emails, WhatsApp, horaires.
 • Onglet ACCUEIL     : textes du bandeau d'accueil, images du
                        carrousel, chiffres clés, mots défilants,
                        images « Nos plus belles réalisations »…
 • Témoignages        : les avis affichés sur la page d'accueil.
 • Partenaires        : les noms affichés en bas du site.
 • FAQ Chatbot        : les questions/réponses de l'assistant.
 • FAQ Contact        : les questions/réponses de la page Contact.
 • À propos           : paragraphes, citation et étapes du processus.
 • PDF Catalogue      : téléversez le PDF téléchargeable du site.
 • SEO                : titre et description pour Google.

⚠️ Pensez à cliquer sur « Enregistrer » après chaque onglet modifié.

──────────────────────────────────────────────────────────────────────
 BON À SAVOIR
──────────────────────────────────────────────────────────────────────
 • Les modifications sont visibles sur le site sous ~1 minute
   (cache du navigateur).
 • Plus besoin de Google Drive : les images sont hébergées sur
   Vercel Blob, les données dans une base PostgreSQL (Neon).
 • En cas de session expirée, reconnectez-vous simplement.
══════════════════════════════════════════════════════════════════════
