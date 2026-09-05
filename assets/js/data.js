/* =========================================================================
   Globo Loco Shop — Données par défaut
   -------------------------------------------------------------------------
   Ce fichier contient :
     - les informations du magasin (modifiables depuis l'espace admin)
     - l'arborescence catégories / sous-catégories
     - le générateur du catalogue produit (déterministe)
   Toutes ces données sont copiées dans le localStorage au premier lancement.
   ========================================================================= */

const GLS_DATA = (function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1. Informations du magasin
     --------------------------------------------------------------------- */

  const STORE = {
    name: 'Globo Loco Shop',
    tagline: 'Boutique de mode et de prêt-à-porter',
    address: '59 rue Jeanne d’Arc',
    postalCode: '76000',
    city: 'Rouen',
    country: 'France',
    phone: '02 35 00 00 00',
    email: 'contact@globolocoshop.fr',
    // Coordonnées approximatives du 59 rue Jeanne d'Arc, à vérifier / ajuster
    // depuis l'espace administrateur (onglet « Magasin »).
    lat: 49.4425,
    lng: 1.0928,
    about:
      'Globo Loco Shop est une boutique indépendante de mode et de prêt-à-porter ' +
      'installée en plein cœur de Rouen, sur la rue Jeanne d’Arc. Vêtements, ' +
      'chaussures, accessoires, sous-vêtements, sport et bagagerie : on habille ' +
      'toute la famille, de la basket du quotidien à la pièce qui change la tenue.',
    hours: [
      { day: 'Lundi', value: '14h00 – 19h00' },
      { day: 'Mardi', value: '10h00 – 19h00' },
      { day: 'Mercredi', value: '10h00 – 19h00' },
      { day: 'Jeudi', value: '10h00 – 19h00' },
      { day: 'Vendredi', value: '10h00 – 19h00' },
      { day: 'Samedi', value: '10h00 – 19h30' },
      { day: 'Dimanche', value: 'Fermé' }
    ],
    social: [
      { label: 'Instagram', url: 'https://instagram.com/' },
      { label: 'Facebook', url: 'https://facebook.com/' }
    ],
    // Les plans d'accès. Chaque entrée est librement modifiable par l'admin.
    access: [
      {
        id: 'acc-metro',
        icon: '🚇',
        title: 'En métro',
        summary: 'Ligne de métro de Rouen (réseau Astuce)',
        steps: [
          'Station « Palais de Justice » : sortir et remonter la rue Jeanne d’Arc — environ 2 minutes à pied.',
          'Station « Théâtre des Arts » : descendre la rue Jeanne d’Arc vers le nord — environ 4 minutes à pied.',
          'Station « Gare-Rue Verte » : la rue Jeanne d’Arc part de la gare et descend directement jusqu’à la boutique — environ 8 minutes à pied.'
        ]
      },
      {
        id: 'acc-bus',
        icon: '🚌',
        title: 'En bus / TEOR',
        summary: 'Arrêts desservis à moins de 5 minutes à pied',
        steps: [
          'Lignes TEOR T1 / T2 / T3 : arrêt « Théâtre des Arts », puis remonter la rue Jeanne d’Arc.',
          'Arrêt « Palais de Justice » : à une rue de la boutique.',
          'Plusieurs lignes du réseau Astuce desservent le centre-ville et la rue Jeanne d’Arc.'
        ]
      },
      {
        id: 'acc-train',
        icon: '🚆',
        title: 'En train',
        summary: 'Gare de Rouen-Rive-Droite',
        steps: [
          'Depuis la gare de Rouen-Rive-Droite, descendre la rue Jeanne d’Arc tout droit.',
          'Environ 900 m, soit 10 à 12 minutes à pied, entièrement en descente.',
          'Possibilité de prendre le métro à « Gare-Rue Verte » jusqu’à « Palais de Justice ».'
        ]
      },
      {
        id: 'acc-voiture',
        icon: '🚗',
        title: 'En voiture',
        summary: 'Centre-ville, circulation réglementée',
        steps: [
          'Depuis l’A150 ou l’A13, suivre « Rouen Centre » puis « Rive Droite ».',
          'La rue Jeanne d’Arc est un axe central : suivre la signalisation « Théâtre des Arts » ou « Palais de Justice ».',
          'Attention : une partie du centre-ville est en zone à circulation apaisée, privilégier les parkings.'
        ]
      },
      {
        id: 'acc-parking',
        icon: '🅿️',
        title: 'Stationnement',
        summary: 'Parkings publics à proximité immédiate',
        steps: [
          'Parking Espace du Palais — le plus proche, à quelques dizaines de mètres.',
          'Parking du Vieux-Marché — environ 6 minutes à pied.',
          'Parking Hôtel de Ville — environ 8 minutes à pied.',
          'Stationnement de surface payant sur les rues adjacentes.'
        ]
      },
      {
        id: 'acc-velo',
        icon: '🚲',
        title: 'À vélo',
        summary: 'Stations de vélos en libre-service et arceaux',
        steps: [
          'Plusieurs stations de vélos en libre-service jalonnent la rue Jeanne d’Arc.',
          'Arceaux de stationnement vélo devant et autour de la boutique.',
          'Les quais de Seine et les pistes cyclables du centre mènent directement à la rue Jeanne d’Arc.'
        ]
      },
      {
        id: 'acc-pied',
        icon: '🚶',
        title: 'À pied',
        summary: 'Depuis les principaux points du centre',
        steps: [
          'Depuis la Cathédrale Notre-Dame : environ 6 minutes par la rue du Gros-Horloge.',
          'Depuis la place du Vieux-Marché : environ 6 minutes.',
          'Depuis les quais de Seine : remonter la rue Jeanne d’Arc, environ 4 minutes.'
        ]
      },
      {
        id: 'acc-pmr',
        icon: '♿',
        title: 'Accessibilité',
        summary: 'Accès et confort de visite',
        steps: [
          'Boutique de plain-pied, entrée accessible depuis le trottoir.',
          'Allées dégagées permettant la circulation en fauteuil.',
          'Une question sur l’accessibilité ? Contactez-nous avant votre venue.'
        ]
      }
    ]
  };

  /* ---------------------------------------------------------------------
     2. Catégories et sous-catégories
     --------------------------------------------------------------------- */

  // sizeType : détermine les tailles proposées par défaut pour la sous-catégorie
  //   clothing | bottoms | shoes | onesize | socks | bra | belt | none
  const CATEGORY_TREE = [
    {
      name: 'Vêtements',
      emoji: '👕',
      description:
        'Hauts, bas, pièces à enfiler et manteaux : la garde-robe complète, du basique de tous les jours à la pièce forte.',
      subcategories: [
        { name: 'T-shirts', sizeType: 'clothing', price: [12, 39] },
        { name: 'Débardeurs', sizeType: 'clothing', price: [9, 29] },
        { name: 'Tops', sizeType: 'clothing', price: [15, 45] },
        { name: 'Polos', sizeType: 'clothing', price: [25, 65] },
        { name: 'Chemises', sizeType: 'clothing', price: [29, 89] },
        { name: 'Pulls', sizeType: 'clothing', price: [35, 110] },
        { name: 'Sweats', sizeType: 'clothing', price: [30, 85] },
        { name: 'Gilets', sizeType: 'clothing', price: [35, 95] },
        { name: 'Cardigans', sizeType: 'clothing', price: [39, 105] },
        { name: 'Vestes', sizeType: 'clothing', price: [59, 189] },
        { name: 'Blousons', sizeType: 'clothing', price: [69, 199] },
        { name: 'Manteaux', sizeType: 'clothing', price: [89, 259] },
        { name: 'Doudounes', sizeType: 'clothing', price: [79, 229] },
        { name: 'Parkas', sizeType: 'clothing', price: [89, 239] },
        { name: 'Pantalons', sizeType: 'bottoms', price: [35, 99] },
        { name: 'Jeans', sizeType: 'bottoms', price: [45, 129] },
        { name: 'Jogging', sizeType: 'clothing', price: [29, 79] },
        { name: 'Leggings', sizeType: 'clothing', price: [15, 45] },
        { name: 'Shorts', sizeType: 'bottoms', price: [19, 55] },
        { name: 'Bermudas', sizeType: 'bottoms', price: [25, 65] },
        { name: 'Jupes', sizeType: 'clothing', price: [25, 79] },
        { name: 'Robes', sizeType: 'clothing', price: [35, 139] },
        { name: 'Combinaisons', sizeType: 'clothing', price: [45, 129] },
        { name: 'Maillots de bain', sizeType: 'clothing', price: [19, 59] },
        { name: 'Vêtements de nuit', sizeType: 'clothing', price: [19, 59] },
        { name: 'Vêtements de sport', sizeType: 'clothing', price: [25, 89] }
      ]
    },
    {
      name: 'Chaussures',
      emoji: '👟',
      description:
        'De la sneaker du quotidien à la chaussure de randonnée : tous les modèles, du 36 au 47.',
      subcategories: [
        { name: 'Baskets / sneakers', sizeType: 'shoes', price: [49, 179] },
        { name: 'Chaussures de ville', sizeType: 'shoes', price: [69, 199] },
        { name: 'Chaussures de sport', sizeType: 'shoes', price: [55, 159] },
        { name: 'Bottines', sizeType: 'shoes', price: [59, 169] },
        { name: 'Bottes', sizeType: 'shoes', price: [69, 199] },
        { name: 'Chaussures montantes', sizeType: 'shoes', price: [65, 175] },
        { name: 'Mocassins', sizeType: 'shoes', price: [59, 165] },
        { name: 'Chaussures bateau', sizeType: 'shoes', price: [55, 145] },
        { name: 'Sandales', sizeType: 'shoes', price: [29, 95] },
        { name: 'Tongs', sizeType: 'shoes', price: [12, 39] },
        { name: 'Claquettes', sizeType: 'shoes', price: [15, 49] },
        { name: 'Chaussons', sizeType: 'shoes', price: [15, 49] },
        { name: 'Chaussures de randonnée', sizeType: 'shoes', price: [79, 219] }
      ]
    },
    {
      name: 'Accessoires',
      emoji: '🧢',
      description:
        'Le détail qui fait la tenue : couvre-chefs, maroquinerie, bijoux et petits sacs.',
      subcategories: [
        { name: 'Casquettes', sizeType: 'onesize', price: [15, 45] },
        { name: 'Bonnets', sizeType: 'onesize', price: [12, 39] },
        { name: 'Chapeaux', sizeType: 'onesize', price: [19, 59] },
        { name: 'Écharpes', sizeType: 'onesize', price: [15, 55] },
        { name: 'Gants', sizeType: 'gloves', price: [12, 49] },
        { name: 'Ceintures', sizeType: 'belt', price: [19, 65] },
        { name: 'Portefeuilles', sizeType: 'onesize', price: [19, 79] },
        { name: 'Sacs à main', sizeType: 'onesize', price: [35, 149] },
        { name: 'Sacs à dos', sizeType: 'onesize', price: [29, 119] },
        { name: 'Sacs banane', sizeType: 'onesize', price: [19, 69] },
        { name: 'Sacs de sport', sizeType: 'onesize', price: [25, 89] },
        { name: 'Lunettes', sizeType: 'onesize', price: [19, 89] },
        { name: 'Bijoux / accessoires de mode', sizeType: 'onesize', price: [9, 79] }
      ]
    },
    {
      name: 'Sous-vêtements',
      emoji: '🩲',
      description:
        'La base de la garde-robe : coton peigné, coupes confortables et lots avantageux.',
      subcategories: [
        { name: 'Boxers', sizeType: 'clothing', price: [9, 39] },
        { name: 'Slips', sizeType: 'clothing', price: [8, 32] },
        { name: 'Culottes', sizeType: 'clothing', price: [8, 35] },
        { name: 'Soutiens-gorge', sizeType: 'bra', price: [19, 59] },
        { name: 'Brassières', sizeType: 'clothing', price: [15, 45] },
        { name: 'Chaussettes', sizeType: 'socks', price: [5, 25] },
        { name: 'Collants', sizeType: 'clothing', price: [7, 29] },
        { name: 'Pyjamas / lingerie de nuit', sizeType: 'clothing', price: [19, 69] }
      ]
    },
    {
      name: 'Sport',
      emoji: '🏃',
      description:
        'Running, salle, terrain : des matières techniques et respirantes pour bouger sans y penser.',
      subcategories: [
        { name: 'T-shirts de sport', sizeType: 'clothing', price: [15, 49] },
        { name: 'Shorts de sport', sizeType: 'clothing', price: [15, 49] },
        { name: 'Pantalons de sport', sizeType: 'clothing', price: [29, 79] },
        { name: 'Sweats de sport', sizeType: 'clothing', price: [35, 89] },
        { name: 'Vestes de sport', sizeType: 'clothing', price: [45, 129] },
        { name: 'Leggings', sizeType: 'clothing', price: [19, 59] },
        { name: 'Brassières de sport', sizeType: 'clothing', price: [19, 55] },
        { name: 'Maillots', sizeType: 'clothing', price: [25, 89] },
        { name: 'Chaussures de sport', sizeType: 'shoes', price: [55, 165] },
        { name: 'Accessoires sportifs', sizeType: 'onesize', price: [9, 69] }
      ]
    },
    {
      name: 'Autres',
      emoji: '🧳',
      description:
        'Bagagerie et maroquinerie : de quoi partir en week-end ou pour trois semaines.',
      subcategories: [
        { name: 'Valises', sizeType: 'luggage', price: [69, 249] },
        { name: 'Sacs de voyage', sizeType: 'onesize', price: [39, 149] },
        { name: 'Articles de maroquinerie', sizeType: 'onesize', price: [19, 129] }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
     3. Vocabulaire de génération du catalogue
     --------------------------------------------------------------------- */

  // Marques maison, volontairement fictives.
  const BRANDS = [
    'Atelier 76',
    'Seine & Co',
    'Loco Basics',
    'Maison Jeanne',
    'Nord Denim',
    'Rouen Street',
    'Cauchois',
    'Vertigo Wear',
    'Bleu Cauchoise',
    'Globo Signature',
    'Armada',
    'Petit Quevilly Co',
    'Horloge Studio',
    'Cap Nord'
  ];

  const COLOR_POOL = [
    { name: 'Noir', hex: '#1b1b1f' },
    { name: 'Blanc', hex: '#f6f5f1' },
    { name: 'Écru', hex: '#e8dfcd' },
    { name: 'Gris chiné', hex: '#9b9ea3' },
    { name: 'Bleu marine', hex: '#1f2c4c' },
    { name: 'Bleu ciel', hex: '#7fa8d1' },
    { name: 'Denim brut', hex: '#3a4d66' },
    { name: 'Kaki', hex: '#5d6144' },
    { name: 'Vert sapin', hex: '#28453a' },
    { name: 'Bordeaux', hex: '#5c1f2b' },
    { name: 'Rouge', hex: '#b8342f' },
    { name: 'Terracotta', hex: '#b96a4a' },
    { name: 'Moutarde', hex: '#c8993a' },
    { name: 'Camel', hex: '#a97d4f' },
    { name: 'Beige', hex: '#cdbba4' },
    { name: 'Rose poudré', hex: '#dfa9ad' },
    { name: 'Violet', hex: '#5b4780' },
    { name: 'Orange', hex: '#d9762b' }
  ];

  const MATERIALS = [
    'coton bio',
    'coton peigné',
    'maille douce',
    'molleton gratté',
    'lin lavé',
    'denim stretch',
    'laine mélangée',
    'nylon recyclé',
    'jersey respirant',
    'twill de coton',
    'polaire recyclée',
    'cuir de vachette',
    'toile enduite'
  ];

  const CUTS = [
    'coupe droite',
    'coupe ajustée',
    'coupe oversize',
    'coupe classique',
    'coupe décontractée',
    'coupe cintrée',
    'coupe ample'
  ];

  // Noms de modèles, façon collection.
  const MODEL_NAMES = [
    'Arc',
    'Boieldieu',
    'Cauchoise',
    'Corneille',
    'Darnétal',
    'Duclair',
    'Écluse',
    'Estuaire',
    'Falaise',
    'Gros-Horloge',
    'Hangar 23',
    'Île Lacroix',
    'Jeanne',
    'Lafayette',
    'Malraux',
    'Martainville',
    'Mont-Riboudet',
    'Normandie',
    'Panorama',
    'Quai Bas',
    'Rive Droite',
    'Rive Gauche',
    'Saint-Sever',
    'Sotteville',
    'Vieux-Marché',
    'Yainville'
  ];

  const QUALIFIERS = [
    'Essentiel',
    'Signature',
    'Heritage',
    'Daily',
    'Studio',
    'Classic',
    'Origine',
    'Atelier',
    'Nomade',
    'Confort'
  ];

  const SIZE_SETS = {
    clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    bottoms: ['36', '38', '40', '42', '44', '46', '48'],
    shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
    onesize: ['Taille unique'],
    socks: ['35-38', '39-42', '43-46'],
    bra: ['85A', '85B', '90B', '90C', '95B', '95C'],
    belt: ['85 cm', '90 cm', '95 cm', '100 cm', '105 cm'],
    gloves: ['S', 'M', 'L', 'XL'],
    luggage: ['Cabine 55 cm', 'Moyenne 65 cm', 'Grande 75 cm']
  };

  /* ---------------------------------------------------------------------
     4. Utilitaires de génération
     --------------------------------------------------------------------- */

  function slugify(str) {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Hash 32 bits déterministe (pour semer le générateur pseudo-aléatoire).
  function seedFrom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Générateur pseudo-aléatoire déterministe (mulberry32).
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rand, arr) {
    return arr[Math.floor(rand() * arr.length)];
  }

  function pickMany(rand, arr, count) {
    const copy = arr.slice();
    const out = [];
    const n = Math.min(count, copy.length);
    for (let i = 0; i < n; i++) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  }

  // Singulier approximatif d'un nom de sous-catégorie, pour les descriptions.
  function singular(name) {
    const base = name.split('/')[0].trim();
    if (/eaux$/.test(base)) return base.replace(/x$/, '');
    if (/s$/.test(base) && !/^(Jogging|Sport)$/.test(base)) return base.replace(/s$/, '');
    return base;
  }

  function priceIn(rand, range) {
    const [min, max] = range;
    const raw = min + rand() * (max - min);
    // Prix en .90 / .00 / .50
    const endings = [0.9, 0, 0.5];
    const whole = Math.floor(raw);
    return Math.max(min, whole + endings[Math.floor(rand() * endings.length)]);
  }

  function buildDescription(rand, subName, brand, material, cut) {
    const item = singular(subName).toLowerCase();
    const openers = [
      `Un ${item} pensé pour durer, en ${material}.`,
      `Le ${item} ${brand} que l’on reprend saison après saison, en ${material}.`,
      `${brand} revisite le ${item} avec une ${cut} et un ${material} agréable à porter.`,
      `Une valeur sûre du rayon : ce ${item} en ${material}, ${cut}.`
    ];
    const middles = [
      'Les finitions sont soignées, les coutures renforcées aux points de tension.',
      'La matière garde sa tenue lavage après lavage.',
      'Un modèle facile à associer, qui se glisse dans toutes les tenues.',
      'Fabrication soignée et matières sélectionnées avec attention.'
    ];
    const closers = [
      'Disponible en boutique au 59 rue Jeanne d’Arc à Rouen, essayage possible sur place.',
      'Passez l’essayer en boutique, l’équipe vous conseille sur la taille.',
      'Existe en plusieurs coloris, voir les disponibilités en magasin.',
      'Conseil de l’équipe : prenez votre taille habituelle, la coupe est fidèle.'
    ];
    return [pick(rand, openers), pick(rand, middles), pick(rand, closers)].join(' ');
  }

  const CARE_LINES = [
    'Lavage en machine à 30°C sur l’envers.',
    'Lavage à 30°C, ne pas utiliser de sèche-linge.',
    'Nettoyage à la main recommandé, séchage à plat.',
    'Entretien à sec conseillé pour préserver la matière.',
    'Nettoyer avec un chiffon doux légèrement humide.'
  ];

  /* ---------------------------------------------------------------------
     5. Construction du catalogue par défaut
     --------------------------------------------------------------------- */

  function buildCatalog() {
    const categories = [];
    const products = [];

    CATEGORY_TREE.forEach(function (cat, ci) {
      const catId = 'cat-' + slugify(cat.name);
      const category = {
        id: catId,
        name: cat.name,
        emoji: cat.emoji,
        slug: slugify(cat.name),
        description: cat.description,
        order: ci,
        subcategories: []
      };

      cat.subcategories.forEach(function (sub, si) {
        const subId = 'sub-' + slugify(cat.name) + '-' + slugify(sub.name);
        const subcategory = {
          id: subId,
          categoryId: catId,
          name: sub.name,
          slug: slugify(sub.name),
          sizeType: sub.sizeType,
          order: si,
          description:
            'Notre sélection ' +
            sub.name.toLowerCase() +
            ' — ' +
            cat.name.toLowerCase() +
            '. Toutes les pièces sont disponibles à l’essayage en boutique.'
        };
        category.subcategories.push(subcategory);

        // Produits de la sous-catégorie
        const rand = rng(seedFrom(subId));
        const count = 4 + Math.floor(rand() * 4); // 4 à 7 produits
        const usedNames = new Set();

        for (let p = 0; p < count; p++) {
          const brand = pick(rand, BRANDS);
          const model = pick(rand, MODEL_NAMES);
          const qualifier = pick(rand, QUALIFIERS);
          const material = pick(rand, MATERIALS);
          const cut = pick(rand, CUTS);

          let name = singular(sub.name) + ' ' + model;
          if (usedNames.has(name)) name = singular(sub.name) + ' ' + model + ' ' + qualifier;
          if (usedNames.has(name)) name = singular(sub.name) + ' ' + model + ' ' + (p + 1);
          usedNames.add(name);

          const colors = pickMany(rand, COLOR_POOL, 2 + Math.floor(rand() * 4));
          const sizeSet = SIZE_SETS[sub.sizeType] || SIZE_SETS.clothing;
          const sizes =
            sizeSet.length <= 3
              ? sizeSet.slice()
              : sizeSet.filter(function () {
                  return rand() > 0.18;
                });
          const price = priceIn(rand, sub.price);
          const onSale = rand() > 0.82;

          products.push({
            id: 'prd-' + slugify(sub.name) + '-' + slugify(name) + '-' + p,
            subcategoryId: subId,
            categoryId: catId,
            name: name,
            brand: brand,
            collection: qualifier,
            price: Math.round(price * 100) / 100,
            oldPrice: onSale ? Math.round(price * 1.25 * 100) / 100 : null,
            description: buildDescription(rand, sub.name, brand, material, cut),
            material: material,
            cut: cut,
            care: pick(rand, CARE_LINES),
            reference: 'GLS-' + String(seedFrom(name + subId) % 100000).padStart(5, '0'),
            sizes: sizes.length ? sizes : sizeSet.slice(0, 3),
            colors: colors,
            images: [], // vide = visuel généré automatiquement
            inStock: rand() > 0.08,
            featured: rand() > 0.9,
            createdAt: '2026-01-01T00:00:00.000Z'
          });
        }
      });

      categories.push(category);
    });

    return { categories: categories, products: products };
  }

  /* ---------------------------------------------------------------------
     6. Avis de démonstration
     --------------------------------------------------------------------- */

  const REVIEW_AUTHORS = ['Camille', 'Yanis', 'Sophie', 'Marc', 'Leïla', 'Thomas', 'Anaïs', 'Karim'];
  const REVIEW_TEXTS = [
    'Très bonne qualité, la taille est fidèle. Je recommande.',
    'Acheté en boutique, l’équipe a été de bon conseil sur la taille.',
    'Belle matière, rien à redire après plusieurs lavages.',
    'Conforme à la description, coupe agréable au quotidien.',
    'Bon rapport qualité-prix, je repasserai.',
    'Un peu juste à la taille, je conseille de prendre au-dessus.'
  ];

  function buildReviews(products) {
    const reviews = [];
    products.forEach(function (product) {
      const rand = rng(seedFrom('rev-' + product.id));
      const count = Math.floor(rand() * 3); // 0 à 2 avis
      for (let i = 0; i < count; i++) {
        reviews.push({
          id: 'rev-' + product.id + '-' + i,
          productId: product.id,
          author: pick(rand, REVIEW_AUTHORS),
          rating: 3 + Math.floor(rand() * 3),
          comment: pick(rand, REVIEW_TEXTS),
          date: '2026-0' + (1 + Math.floor(rand() * 8)) + '-1' + (1 + Math.floor(rand() * 8))
        });
      }
    });
    return reviews;
  }

  /* ---------------------------------------------------------------------
     7. Export
     --------------------------------------------------------------------- */

  function defaultData() {
    const catalog = buildCatalog();
    return {
      version: 1,
      store: JSON.parse(JSON.stringify(STORE)),
      categories: catalog.categories,
      products: catalog.products,
      reviews: buildReviews(catalog.products)
    };
  }

  return {
    defaultData: defaultData,
    slugify: slugify,
    COLOR_POOL: COLOR_POOL,
    SIZE_SETS: SIZE_SETS,
    BRANDS: BRANDS
  };
})();
