# Globo Loco Shop

Application web de la boutique **Globo Loco Shop** — mode et prêt-à-porter,
59 rue Jeanne d’Arc, 76000 Rouen.

Catalogue complet (catégories → sous-catégories → articles), fiches produit avec
photos modifiables, avis, plans d’accès et espace administrateur protégé par code.

## Lancer l’application

Aucune installation, aucune dépendance, aucun serveur : c’est une application
statique en HTML/CSS/JavaScript.

```bash
# Le plus simple : ouvrir index.html dans un navigateur
# Ou servir le dossier localement :
npx http-server -p 8080 .
# puis ouvrir http://127.0.0.1:8080
```

Elle peut aussi être publiée telle quelle sur GitHub Pages ou tout hébergement
de fichiers statiques.

## Compte administrateur

| | |
|---|---|
| Accès | bouton **Administration** dans l’en-tête, ou `#/admin` |
| Code par défaut | `GLOBO2026` |
| Première connexion | le code doit **obligatoirement** être remplacé avant d’accéder à la gestion |
| Changement ultérieur | onglet **Code d’accès** — l’ancien code est toujours exigé |
| Règles du nouveau code | au moins 8 caractères, dont une lettre et un chiffre |

Le code n’est jamais stocké en clair : seul un condensé SHA-256 avec sel
aléatoire est conservé (repli sur un hachage interne si l’API Web Crypto n’est
pas disponible). Il n’existe aucune procédure de récupération : en cas d’oubli,
seule la remise à zéro complète (onglet **Données** → « Tout réinitialiser », ou
vidage du stockage local du navigateur) rétablit le code par défaut.

> **Portée de la protection.** L’application fonctionne entièrement dans le
> navigateur, sans serveur. Le code protège l’accès à l’interface de gestion sur
> l’appareil utilisé ; il ne constitue pas une authentification serveur et ne
> protège pas des données contre quelqu’un qui aurait accès au navigateur.

### Ce que l’administrateur peut faire

- **Catégories / sous-catégories** : créer, renommer, décrire, changer l’icône,
  rattacher une sous-catégorie à une autre catégorie, supprimer (avec le contenu).
- **Articles** : créer, modifier (nom, marque, collection, prix, prix barré,
  référence, matière, coupe, entretien, description, tailles, couleurs, stock,
  mise en avant), supprimer.
- **Photos** : ajouter par fichier ou par URL, retirer, réordonner — depuis la
  fiche produit ou depuis le formulaire d’édition. Les images importées sont
  redimensionnées avant stockage.
- **Avis** : supprimer un avis depuis la fiche produit.
- **Magasin** : nom, accroche, adresse, coordonnées GPS, téléphone, e-mail,
  horaires, texte de présentation.
- **Plans d’accès** : ajouter, modifier, supprimer les fiches (métro, bus, train,
  voiture, stationnement, vélo, à pied, accessibilité…).
- **Données** : export JSON, import JSON, réinitialisation du catalogue ou totale.

## Structure du catalogue

Six rayons, 73 sous-catégories. **Les articles ne sont jamais placés dans une
catégorie** : une page catégorie ne liste que ses sous-catégories, et le
catalogue d’articles se trouve dans les sous-catégories.

| Rayon | Sous-catégories |
|---|---|
| 👕 Vêtements | 26 (t-shirts, débardeurs, tops, polos, chemises, pulls, sweats, gilets, cardigans, vestes, blousons, manteaux, doudounes, parkas, pantalons, jeans, jogging, leggings, shorts, bermudas, jupes, robes, combinaisons, maillots de bain, vêtements de nuit, vêtements de sport) |
| 👟 Chaussures | 13 (baskets, chaussures de ville, de sport, bottines, bottes, montantes, mocassins, bateau, sandales, tongs, claquettes, chaussons, randonnée) |
| 🧢 Accessoires | 13 (casquettes, bonnets, chapeaux, écharpes, gants, ceintures, portefeuilles, sacs à main, à dos, banane, de sport, lunettes, bijoux) |
| 🩲 Sous-vêtements | 8 (boxers, slips, culottes, soutiens-gorge, brassières, chaussettes, collants, pyjamas) |
| 🏃 Sport | 10 (t-shirts, shorts, pantalons, sweats, vestes, leggings, brassières, maillots, chaussures, accessoires) |
| 🧳 Autres | 3 (valises, sacs de voyage, maroquinerie) |

### Fiche produit

L’ordre demandé est respecté : **la photo en haut**, puis, en dessous, la marque,
les tailles disponibles, la description, les couleurs disponibles, les avis (avec
formulaire de dépôt) et, en fin de page, la liste des **produits similaires**
(même sous-catégorie en priorité, puis même rayon, en privilégiant la marque et
les couleurs communes).

Un article sans photo affiche un visuel généré automatiquement en SVG à partir de
ses couleurs — aucune image externe n’est nécessaire, l’application fonctionne
hors ligne.

## Plans d’accès

La page **Plans d’accès** (`#/acces`) regroupe :

- un plan schématique du quartier en SVG (rue Jeanne d’Arc, stations, parkings) ;
- des liens d’itinéraire vers OpenStreetMap, Google Maps, Plans (Apple) et le GPS
  de l’appareil (`geo:`) ;
- une fiche par mode d’accès : métro, bus/TEOR, train, voiture, stationnement,
  vélo, à pied, accessibilité.

> Les informations de transport et de stationnement sont **indicatives** et
> entièrement modifiables depuis l’espace administrateur. Vérifiez les dessertes
> et horaires auprès des exploitants avant de les publier.

## Données et stockage

Tout est enregistré dans le `localStorage` du navigateur (catalogue, photos,
avis, informations magasin) ; la session administrateur utilise le
`sessionStorage`. Les données ne quittent jamais l’appareil et ne sont pas
partagées entre navigateurs — utilisez l’export/import JSON pour les transférer.

Au premier lancement, un catalogue de démonstration est généré (marques et
articles fictifs, prix cohérents par rayon).

## Organisation du code

```
index.html
assets/
  css/styles.css       Feuille de style unique (responsive, thème boutique)
  js/data.js           Données par défaut : magasin, arborescence, générateur de catalogue
  js/utils.js          Utilitaires : DOM, formats, visuels SVG, images, hachage du code
  js/store.js          État, persistance localStorage, CRUD, compte administrateur
  js/views.js          Vues publiques : accueil, catégories, catalogue, fiche, accès
  js/admin.js          Espace administrateur : connexion, onglets, formulaires
  js/app.js            Routeur par ancre, en-tête, menu, pied de page
```

Routes : `#/`, `#/categories`, `#/categorie/:id`, `#/sous-categorie/:id`,
`#/produit/:id`, `#/recherche?q=`, `#/acces`, `#/magasin`, `#/admin?onglet=`.
