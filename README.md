# Plans

PWA de dessin de plans de coupe pour iPhone (client : Alexis BP). Interface en français.
Aucun framework ni compilation : HTML + CSS + JS servis tels quels.

| Fichier | Rôle |
|---|---|
| `index.html` | Écran unique de l'app (dessin, menu, feuilles, dialogue) |
| `styles.css` | Styles, repris des maquettes |
| `app.js` | Moteur de dessin (canvas 2D), outils, enregistrement IndexedDB, import/export |
| `sw.js` | Service worker : hors-ligne, mise à jour au lancement suivant |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
| `tools/generer-icones.py` | Régénère `icons/` (`python tools/generer-icones.py`, nécessite Pillow) |

Les maquettes statiques sont dans `mockups/` (dépôt séparé, ignoré par `.gitignore`).

## Lancer en local

```bash
python -m http.server 8770
```

Puis ouvrir http://localhost:8770. Le service worker exige `localhost` ou HTTPS : sur l'iPhone,
l'app doit être servie en HTTPS (ex. GitHub Pages), puis ajoutée avec Safari › Partager › « Sur l'écran d'accueil ».

## Mettre à jour

Après une modification, changer `VERSION` dans `sw.js` si la liste des fichiers change.
Sinon, les fichiers se mettent à jour d'eux-mêmes : la nouvelle version s'affiche au lancement suivant.
