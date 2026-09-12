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
GÉRER LES CATÉGORIES :
 • Bouton « Catégorie » → créer une nouvelle catégorie.
 • Crayon → renommer. Flèches ↑↓ → changer l'ordre d'affichage.
 • Supprimer une catégorie ne supprime pas ses produits (ils
   deviennent « sans catégorie »).

CRÉER / MODIFIER UN PRODUIT :
 • « Nouveau produit » → nom, catégorie, prix (en GNF), description,
   dimensions, finition, essence.
 • Prix = 0 → le produit s'affiche « Prix sur demande » et le
   paiement en ligne est désactivé pour ce produit.
 • L'acompte de 60 % est TOUJOURS calculé automatiquement :
   ne l'ajoutez pas dans le prix.
 • Bouton œil → masquer/afficher un produit sur le site sans le
   supprimer.

GÉRER LES IMAGES D'UN PRODUIT :
 • « Ajouter des images » → sélectionnez plusieurs fichiers à la fois.
 • La 1ère image devient l'image principale (vignette du catalogue).
 • Étoile ★ → définir une autre image comme principale.
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

 • En attente → le client n'a pas encore payé l'acompte.
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
