---
name: emrod-website-corrections
description: Effectue de manière méticuleuse toutes les corrections sur le site vitrine EMROD (Accueil, À propos, Galerie, Layout, Contact).
---

# Corrections pour EMROD DF

Ce skill contient l'ensemble des instructions pour appliquer les corrections demandées sur le site EMROD. Suivez ces étapes méticuleusement.

## 1. Modifications de la Page d'Accueil (`src/pages/Home.tsx`)

1. **Phrase d'accroche (Hero text)** :
   - Modifiez le texte principal pour intégrer les arguments : "Sur mesure / Fait par des femmes".
   - *Remplacement suggéré* : Remplacez "Des meubles uniques, pour votre intérieur." par "Des meubles uniques, sur mesure. Créés par des femmes pour votre intérieur." ou intégrez l'argument subtilement dans le sous-titre.

2. **Image de la Page d'Accueil** :
   - Transformez le composant statique de l'image de fond (`hero-new.jpg`) en un carrousel d'images (utilisez `AnimatePresence` de framer-motion avec `setInterval` pour faire défiler plusieurs images depuis `public/gallery/`).

3. **Simplification du langage** :
   - Modifiez la phrase : "Nous allions savoir-faire artisanal et design moderne pour concevoir des meubles durables et élégants." en une phrase plus simple, accessible à tous les niveaux de français. Exemple : "Nous créons des meubles solides et beaux, en mélangeant le travail à la main et des idées modernes."

4. **Le client au cœur du projet** :
   - Mettez à jour le texte de la section "La Signature EMROD" pour insister sur le fait que le client est au centre de chaque décision.

5. **Catalogue téléchargeable & Extraction de données** :
   - Modifiez la section d'appel à l'action. Le bouton "Découvrir le catalogue" doit maintenant ouvrir un formulaire (LeadPopup) pour extraire les données du visiteur (Nom, Email, Téléphone) avant de proposer le téléchargement du fichier `DOC-20260601-WA0022..pdf`.

## 2. Modifications de la Page À Propos (`src/pages/About.tsx`)

1. **Images** :
   - Récupérez l'image "Détail de fabrication" (`detailWood`) de la page d'accueil et placez-la sur la page À propos.
   - Retravaillez le fond de la 2e image (`aboutWood`) pour qu'il soit plus "propre" (utilisez des classes CSS/Tailwind pour adoucir les bords ou changer l'arrière-plan du conteneur).

2. **Histoire de l'entreprise** :
   - Rédigez une histoire complète et structurée pour l'Atelier, mettant en avant le parcours, la passion pour le bois et l'engagement envers le client.

3. **Process / Notre Méthode** :
   - **Étape 1 (Choix du matériel)** : Précisez que le choix du matériel se fait "en commun accord avec le client (en particulier sur les matériaux nobles)".
   - **Étape 2 (Validation du design)** : Insérez une nouvelle étape (ou remplacez-en une) par la "Validation du design en accord avec le client".
   - **Le Façonnage en Atelier** : Remplacez "techniques traditionnelles" par "techniques modernes". Insérez et faites mention de certaines techniques utilisées pour la conception des meubles. Fusionnez la partie "Nous appliquons les vernis..." (Finition) dans cette étape des techniques.
   - **Dernière étape (Livraison)** : Remplacez l'étape finale existante par "Livraison et montage", en expliquant que l'installation se fait directement chez le client.

## 3. Modifications de la Galerie (`src/pages/Gallery.tsx`)

1. **Système de catégories** :
   - Créez un système d'onglets (boutons) au-dessus de la galerie pour filtrer les images par les catégories suivantes : *Tout, Salon, Chambre complète, Meubles de Bureau, Cuisines, Dressing, Meubles Télé, Murs décoratifs, Comptoirs*.
   - Implémentez un système de références simple ou utilisez des mots-clés de base pour simuler le filtrage en attendant une API backend plus complexe.

## 4. Partenaires et Layout Global (`src/components/layout/Layout.tsx` & `src/pages/Contact.tsx`)

1. **Partenaires** :
   - Créez un composant (ou une section dans `Layout.tsx`) qui affiche les logos et noms des partenaires.
   - Insérez cette section **juste avant le footer** (ou avant les informations de contact de l'entreprise si sur la page contact).
   - *Contenu temporaire* : Utilisez des textes et des conteneurs vides pour les logos en attendant que les fichiers réels soient fournis.

2. **Page Contact (`Contact.tsx`)** :
   - **Google Maps** : Ajoutez l'intégration (iframe) de Google Maps pour la localisation (T7, Corniche Nord, virage du lac Sonfonia Centre, Conakry).
   - Assurez-vous que le formulaire de contact confirme l'envoi du message à la fois par mail (via l'API existante) et propose l'ouverture de WhatsApp (déjà implémenté, mais vérifiez que le flux est parfait).

## Dépendances et Ordre d'exécution
1. Mettre à jour `LeadPopup.tsx` et l'intégration du catalogue.
2. Refondre `Home.tsx` (Carrousel, Textes, Client au centre).
3. Mettre à jour `About.tsx` (Images, Histoire, Processus).
4. Ajouter les catégories dans `Gallery.tsx`.
5. Insérer les partenaires dans `Layout.tsx` et la carte dans `Contact.tsx`.
