---
name: emrod-hostinger-fix
description: "Corrige l'erreur 404 lors du rafraîchissement des pages React sur un hébergement Apache (Hostinger)."
---

# Instructions

Ce skill permet de générer un fichier `.htaccess` adapté pour que React Router (SPA) fonctionne correctement sur un hébergement mutualisé comme Hostinger.

## Actions à réaliser

1. Créez un fichier `.htaccess` dans le dossier `public/` à la racine du projet.
2. Insérez le code suivant :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

Ce fichier garantira que toutes les URL (comme `/catalogue/salon/table-basse` ou `/services`) soient correctement redirigées vers `index.html` côté serveur, laissant React Router gérer l'affichage de la bonne page.
