# Guide d'Installation de la Synchronisation Google Drive — EMROD SARL 🪑

Ce site internet est connecté directement à votre espace Google Drive pour :
1. **Afficher** les images de la Galerie.
2. **Afficher** votre catalogue de Meubles avec leurs prix, descriptions, et photos complémentaires (via des sous-dossiers).
3. **Sauvegarder** les formulaires prospects directement dans votre dossier Prospects.
4. **Générer et sauvegarder** les Bons de commande dans votre dossier de Commandes, puis rediriger automatiquement vos clients sur WhatsApp.

Voici les étapes simples pour activer cette synchronisation en 5 minutes chrono ! ⚡

---

## Étape 1 : Configurer les dossiers Google Drive

Afin que le site puisse lire vos dossiers, assurez-vous que la visibilité de chacun de ces dossiers soit configurée sur **"Tous les utilisateurs disposant du lien peuvent lire"** (Accès Public en lecture).

Voici vos dossiers configurés sur le site :
* **Galerie** : `14FAzo-gy1WKjCxEFcXEWhVzhfvPqYx2X`
* **Catalogue Meubles** : `1yisVYsJBiyyYeP9DEg8d-BbXxPJ0Hwju`
* **Prospects (Leads)** : `1bOVDe5nRZStmn0AFD041m6MKoejAppEy`
* **Bons de commande** : `1-FPIxzxKVLcutOct5dcDv5gZ8mRFrEjM`

---

## Étape 2 : Déployer le script de sauvegarde (Google Apps Script)

Pour pouvoir **écrire** des fichiers dans votre Drive (prospects et bons de commande) en toute sécurité, nous utilisons un script intermédiaire Google Apps Script.

1. Rendez-vous sur [Google Apps Script](https://script.google.com/) et connectez-vous avec votre compte Google.
2. Cliquez sur **"Nouveau projet"** en haut à gauche et nommez-le par exemple `EMROD - Webhook`.
3. Supprimez le code existant dans l'éditeur et collez le contenu du fichier [apps-script-webhook.gs](file:///c:/Users/GBESSI/Desktop/SITES%20CLIENTS/emrod-sarl---mobilier-sur-mesure/apps-script-webhook.gs).
4. Cliquez sur **"Déployer"** (bouton bleu en haut à droite) puis sélectionnez **"Nouveau déploiement"**.
5. Dans la fenêtre qui s'ouvre, cliquez sur l'icône de l'engrenage à côté de "Sélectionner le type" et choisissez **"Application Web"**.
6. Remplissez les champs comme suit :
   * **Description** : `Webhook EMROD V1`
   * **Exécuter en tant que** : **"Moi (votre_email@gmail.com)"** (très important !)
   * **Qui a accès** : **"Tout le monde"** (Anyone) (nécessaire pour que le site puisse lui envoyer les requêtes)
7. Cliquez sur **"Déployer"**.
8. Une boîte de dialogue s'ouvre pour vous demander d'autoriser l'accès. Cliquez sur **"Autoriser l'accès"**, sélectionnez votre compte Google, puis cliquez sur **"Advanced"** (Paramètres avancés) puis sur **"Go to EMROD - Webhook (unsafe)"** et enfin validez les autorisations.
9. Une fois le déploiement terminé, copiez **l'URL de l'application Web** qui se termine par `/exec` (ex : `https://script.google.com/macros/s/AKfycby.../exec`).

---

## Étape 3 : Configurer le fichier `.env`

1. Ouvrez ou créez le fichier `.env` à la racine de votre projet.
2. Collez la configuration suivante en remplaçant la valeur par l'URL copiée à l'étape précédente :

```env
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI"
APP_URL="http://localhost:3000"

# Google Drive Read Key (Déjà configurée par défaut)
GOOGLE_DRIVE_API_KEY="AIzaSyDoGTa3hjcJ3b1iQ2b18BTEv_pJOoUfEiM"

# L'URL Google Apps Script obtenue à l'Étape 2
APPS_SCRIPT_WEBHOOK_URL="https://script.google.com/macros/s/VOTRE_ID_DEPLOIMENT_ICI/exec"
```

3. Sauvegardez le fichier `.env`.

---

## Étape 4 : Utiliser la Boutique

Pour ajouter un nouveau meuble dans votre catalogue, c'est extrêmement simple et intuitif :

1. Ouvrez votre dossier Google Drive **Catalogue Meubles** (`1yisVYsJBiyyYeP9DEg8d-BbXxPJ0Hwju`).
2. Créez un **nouveau sous-dossier** pour votre meuble. Le nom de ce dossier sera le nom affiché sur le site (ex : `Table Basse Milano`).
3. Glissez-déposez vos photos de ce meuble dans ce sous-dossier (ex : vue de face, vue sous un autre angle, gros plan).
4. Choisissez la photo principale que vous souhaitez voir s'afficher en premier dans la liste du catalogue.
5. Faites un clic droit sur cette photo dans Google Drive, puis cliquez sur **"Informations"** > **"Détails"** (ou cliquez sur le bouton "i" en haut à droite).
6. Dans le champ **Description** tout en bas de l'onglet de droite, écrivez le prix et la description sous cette forme simple :
   ```
   Prix: 450 000 GNF
   Description: Superbe table basse en bois massif d'ébène avec finition huilée naturelle. Piètement en acier noir mat.
   ```
   *Note : Le site comprendra automatiquement le prix pour calculer l'acompte de 60% requis !*

C'est tout ! Votre catalogue se synchronisera en temps réel à chaque fois qu'un utilisateur consultera votre site internet. 🎉
