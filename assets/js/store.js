/* =========================================================================
   Globo Loco Shop — État de l'application et persistance
   -------------------------------------------------------------------------
   Toutes les données (catalogue, photos, avis, informations magasin, code
   administrateur) vivent dans le localStorage du navigateur. Il n'y a pas de
   serveur : l'application est entièrement autonome.
   ========================================================================= */

const GLS_STORE = (function (U, D) {
  'use strict';

  const DATA_KEY = 'globoloco.data.v1';
  const ADMIN_KEY = 'globoloco.admin.v1';
  const SESSION_KEY = 'globoloco.session.v1';

  // Code administrateur livré par défaut. Il doit obligatoirement être changé
  // à la première connexion (voir `mustChange`).
  const DEFAULT_ADMIN_CODE = 'GLOBO2026';

  let data = null;
  let admin = null;
  const listeners = [];

  /* ------------------------- Persistance bas niveau ------------------ */

  function readJSON(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      U.toast(
        'Espace de stockage saturé : allégez les photos ou exportez vos données.',
        'error'
      );
      return false;
    }
  }

  function persist() {
    writeJSON(DATA_KEY, data);
    emit();
  }

  function persistAdmin() {
    writeJSON(ADMIN_KEY, admin);
  }

  function emit() {
    listeners.forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        /* un abonné en erreur ne doit pas bloquer les autres */
      }
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  /* ------------------------------ Init ------------------------------- */

  function init() {
    data = readJSON(DATA_KEY);
    if (!data || !data.categories || !data.products) {
      data = D.defaultData();
      writeJSON(DATA_KEY, data);
    }
    // Compléments de structure pour les données anciennes.
    if (!data.reviews) data.reviews = [];
    if (!data.store.access) data.store.access = [];
    if (migrate()) writeJSON(DATA_KEY, data);

    admin = readJSON(ADMIN_KEY);
    if (!admin || !admin.hash) {
      const salt = U.randomSalt();
      return U.hashSecret(DEFAULT_ADMIN_CODE, salt).then(function (hash) {
        admin = {
          salt: salt,
          hash: hash,
          mustChange: true,
          createdAt: new Date().toISOString(),
          updatedAt: null
        };
        persistAdmin();
      });
    }
    return Promise.resolve();
  }

  /* ---------------------------- Migrations --------------------------- */

  // Valeurs livrées en version 1 du jeu de données. Une donnée encore égale à
  // sa valeur d'origine est considérée comme non modifiée par le commerçant :
  // elle peut être remplacée sans écraser un réglage volontaire.
  const V1_DEFAULTS = {
    tagline: 'Boutique de mode et de prêt-à-porter',
    phone: '02 35 00 00 00',
    email: 'contact@globolocoshop.fr',
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
    ]
  };

  function sameAs(value, reference) {
    return JSON.stringify(value) === JSON.stringify(reference);
  }

  function migrate() {
    if ((data.version || 1) >= 2) return false;
    const fresh = D.defaultData().store;

    // La fiche « Accessibilité » a été retirée des plans d'accès.
    data.store.access = (data.store.access || []).filter(function (plan) {
      return plan.id !== 'acc-pmr';
    });

    // Horaires, coordonnées et réseaux sociaux vérifiés : on ne remplace que
    // ce qui n'a jamais été modifié depuis l'espace administrateur.
    ['tagline', 'phone', 'email'].forEach(function (key) {
      if (data.store[key] === V1_DEFAULTS[key]) data.store[key] = fresh[key];
    });
    if (sameAs(data.store.hours, V1_DEFAULTS.hours)) data.store.hours = fresh.hours;
    if (sameAs(data.store.social, V1_DEFAULTS.social)) data.store.social = fresh.social;
    if (!data.store.brands) data.store.brands = fresh.brands;
    if (/boutique indépendante de mode et de prêt-à-porter/.test(data.store.about || '')) {
      data.store.about = fresh.about;
    }

    data.version = 2;
    return true;
  }

  function resetAll() {
    try {
      window.localStorage.removeItem(DATA_KEY);
      window.localStorage.removeItem(ADMIN_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function resetCatalog() {
    data = D.defaultData();
    persist();
  }

  /* ----------------------------- Lecture ----------------------------- */

  function getStore() {
    return data.store;
  }

  function getCategories() {
    return data.categories.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function getCategory(id) {
    return data.categories.filter(function (c) {
      return c.id === id;
    })[0] || null;
  }

  function getSubcategories(categoryId) {
    const cat = getCategory(categoryId);
    if (!cat) return [];
    return cat.subcategories.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function allSubcategories() {
    const out = [];
    data.categories.forEach(function (cat) {
      cat.subcategories.forEach(function (sub) {
        out.push(sub);
      });
    });
    return out;
  }

  function getSubcategory(id) {
    return allSubcategories().filter(function (s) {
      return s.id === id;
    })[0] || null;
  }

  function getProducts(filter) {
    let list = data.products.slice();
    if (filter && filter.subcategoryId) {
      list = list.filter(function (p) {
        return p.subcategoryId === filter.subcategoryId;
      });
    }
    if (filter && filter.categoryId) {
      list = list.filter(function (p) {
        return p.categoryId === filter.categoryId;
      });
    }
    if (filter && filter.query) {
      const q = U.normalize(filter.query);
      list = list.filter(function (p) {
        const sub = getSubcategory(p.subcategoryId);
        const haystack = U.normalize(
          [p.name, p.brand, p.description, sub ? sub.name : '', (p.colors || []).map(function (c) {
            return c.name;
          }).join(' ')].join(' ')
        );
        return haystack.indexOf(q) !== -1;
      });
    }
    return list;
  }

  function getProduct(id) {
    return data.products.filter(function (p) {
      return p.id === id;
    })[0] || null;
  }

  function countProducts(subcategoryId) {
    return data.products.filter(function (p) {
      return p.subcategoryId === subcategoryId;
    }).length;
  }

  function countProductsInCategory(categoryId) {
    return data.products.filter(function (p) {
      return p.categoryId === categoryId;
    }).length;
  }

  // Produits similaires : même sous-catégorie d'abord, puis même catégorie.
  function similarProducts(product, limit) {
    const max = limit || 6;
    const sameSub = data.products.filter(function (p) {
      return p.subcategoryId === product.subcategoryId && p.id !== product.id;
    });
    const sameCat = data.products.filter(function (p) {
      return (
        p.categoryId === product.categoryId &&
        p.subcategoryId !== product.subcategoryId &&
        p.id !== product.id
      );
    });
    // On privilégie les produits partageant une couleur ou la marque.
    const colorNames = (product.colors || []).map(function (c) {
      return c.name;
    });
    function score(p) {
      let s = 0;
      if (p.brand === product.brand) s += 2;
      (p.colors || []).forEach(function (c) {
        if (colorNames.indexOf(c.name) !== -1) s += 1;
      });
      return s;
    }
    sameSub.sort(function (a, b) {
      return score(b) - score(a);
    });
    return sameSub.concat(sameCat).slice(0, max);
  }

  function featuredProducts(limit) {
    const featured = data.products.filter(function (p) {
      return p.featured;
    });
    const pool = featured.length >= (limit || 8) ? featured : data.products;
    return pool.slice(0, limit || 8);
  }

  function stats() {
    return {
      categories: data.categories.length,
      subcategories: allSubcategories().length,
      products: data.products.length,
      reviews: data.reviews.length
    };
  }

  /* ------------------------------ Avis ------------------------------- */

  function getReviews(productId) {
    return data.reviews
      .filter(function (r) {
        return r.productId === productId;
      })
      .sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      });
  }

  function averageRating(productId) {
    const list = getReviews(productId);
    if (!list.length) return null;
    const sum = list.reduce(function (acc, r) {
      return acc + Number(r.rating || 0);
    }, 0);
    return Math.round((sum / list.length) * 10) / 10;
  }

  function addReview(review) {
    const entry = {
      id: U.uid('rev'),
      productId: review.productId,
      author: review.author || 'Client anonyme',
      rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
      comment: review.comment || '',
      date: new Date().toISOString().slice(0, 10)
    };
    data.reviews.push(entry);
    persist();
    return entry;
  }

  function deleteReview(id) {
    data.reviews = data.reviews.filter(function (r) {
      return r.id !== id;
    });
    persist();
  }

  /* --------------------------- Écriture admin ------------------------ */

  function updateStore(patch) {
    Object.keys(patch).forEach(function (key) {
      data.store[key] = patch[key];
    });
    persist();
  }

  function saveAccessPlan(plan) {
    const list = data.store.access;
    const existing = list.filter(function (a) {
      return a.id === plan.id;
    })[0];
    if (existing) {
      Object.keys(plan).forEach(function (key) {
        existing[key] = plan[key];
      });
    } else {
      plan.id = plan.id || U.uid('acc');
      list.push(plan);
    }
    persist();
  }

  function deleteAccessPlan(id) {
    data.store.access = data.store.access.filter(function (a) {
      return a.id !== id;
    });
    persist();
  }

  function saveCategory(input) {
    if (input.id) {
      const cat = getCategory(input.id);
      if (!cat) return null;
      cat.name = input.name;
      cat.emoji = input.emoji;
      cat.description = input.description;
      cat.slug = U.slugify(input.name);
      persist();
      return cat;
    }
    const cat = {
      id: U.uid('cat'),
      name: input.name,
      emoji: input.emoji || '🏷️',
      slug: U.slugify(input.name),
      description: input.description || '',
      order: data.categories.length,
      subcategories: []
    };
    data.categories.push(cat);
    persist();
    return cat;
  }

  // Supprime la catégorie, ses sous-catégories, ses produits et leurs avis.
  function deleteCategory(id) {
    const cat = getCategory(id);
    if (!cat) return;
    const subIds = cat.subcategories.map(function (s) {
      return s.id;
    });
    const productIds = data.products
      .filter(function (p) {
        return subIds.indexOf(p.subcategoryId) !== -1;
      })
      .map(function (p) {
        return p.id;
      });
    data.products = data.products.filter(function (p) {
      return productIds.indexOf(p.id) === -1;
    });
    data.reviews = data.reviews.filter(function (r) {
      return productIds.indexOf(r.productId) === -1;
    });
    data.categories = data.categories.filter(function (c) {
      return c.id !== id;
    });
    persist();
  }

  function saveSubcategory(input) {
    const cat = getCategory(input.categoryId);
    if (!cat) return null;

    if (input.id) {
      const current = getSubcategory(input.id);
      if (!current) return null;
      // Changement de catégorie de rattachement
      if (current.categoryId !== input.categoryId) {
        const oldCat = getCategory(current.categoryId);
        if (oldCat) {
          oldCat.subcategories = oldCat.subcategories.filter(function (s) {
            return s.id !== current.id;
          });
        }
        current.categoryId = input.categoryId;
        current.order = cat.subcategories.length;
        cat.subcategories.push(current);
        data.products.forEach(function (p) {
          if (p.subcategoryId === current.id) p.categoryId = input.categoryId;
        });
      }
      current.name = input.name;
      current.description = input.description;
      current.sizeType = input.sizeType || current.sizeType;
      current.slug = U.slugify(input.name);
      persist();
      return current;
    }

    const sub = {
      id: U.uid('sub'),
      categoryId: cat.id,
      name: input.name,
      slug: U.slugify(input.name),
      description: input.description || '',
      sizeType: input.sizeType || 'clothing',
      order: cat.subcategories.length
    };
    cat.subcategories.push(sub);
    persist();
    return sub;
  }

  function deleteSubcategory(id) {
    const sub = getSubcategory(id);
    if (!sub) return;
    const cat = getCategory(sub.categoryId);
    if (cat) {
      cat.subcategories = cat.subcategories.filter(function (s) {
        return s.id !== id;
      });
    }
    const productIds = data.products
      .filter(function (p) {
        return p.subcategoryId === id;
      })
      .map(function (p) {
        return p.id;
      });
    data.products = data.products.filter(function (p) {
      return p.subcategoryId !== id;
    });
    data.reviews = data.reviews.filter(function (r) {
      return productIds.indexOf(r.productId) === -1;
    });
    persist();
  }

  function saveProduct(input) {
    const sub = getSubcategory(input.subcategoryId);
    if (!sub) return null;

    if (input.id) {
      const product = getProduct(input.id);
      if (!product) return null;
      Object.keys(input).forEach(function (key) {
        product[key] = input[key];
      });
      product.categoryId = sub.categoryId;
      persist();
      return product;
    }

    const product = {
      id: U.uid('prd'),
      subcategoryId: sub.id,
      categoryId: sub.categoryId,
      name: input.name,
      brand: input.brand || '',
      collection: input.collection || '',
      price: Number(input.price) || 0,
      oldPrice: input.oldPrice ? Number(input.oldPrice) : null,
      description: input.description || '',
      material: input.material || '',
      cut: input.cut || '',
      care: input.care || '',
      reference: input.reference || 'GLS-' + String(U.hashString(input.name) % 100000).padStart(5, '0'),
      sizes: input.sizes || [],
      colors: input.colors || [],
      images: input.images || [],
      inStock: input.inStock !== false,
      featured: !!input.featured,
      createdAt: new Date().toISOString()
    };
    data.products.push(product);
    persist();
    return product;
  }

  function deleteProduct(id) {
    data.products = data.products.filter(function (p) {
      return p.id !== id;
    });
    data.reviews = data.reviews.filter(function (r) {
      return r.productId !== id;
    });
    persist();
  }

  /* --------------------------- Photos produit ------------------------ */

  function addProductImage(productId, dataUrl) {
    const product = getProduct(productId);
    if (!product) return false;
    if (!product.images) product.images = [];
    product.images.push(dataUrl);
    persist();
    return true;
  }

  function removeProductImage(productId, index) {
    const product = getProduct(productId);
    if (!product || !product.images) return false;
    product.images.splice(index, 1);
    persist();
    return true;
  }

  function moveProductImage(productId, index, direction) {
    const product = getProduct(productId);
    if (!product || !product.images) return false;
    const target = index + direction;
    if (target < 0 || target >= product.images.length) return false;
    const tmp = product.images[index];
    product.images[index] = product.images[target];
    product.images[target] = tmp;
    persist();
    return true;
  }

  /* ------------------------ Compte administrateur -------------------- */

  function isLoggedIn() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) === 'open';
    } catch (err) {
      return false;
    }
  }

  function mustChangeCode() {
    return !!(admin && admin.mustChange);
  }

  function adminInfo() {
    return {
      mustChange: mustChangeCode(),
      updatedAt: admin ? admin.updatedAt : null,
      createdAt: admin ? admin.createdAt : null,
      usingDefault: mustChangeCode()
    };
  }

  function login(code) {
    return U.hashSecret(code, admin.salt).then(function (hash) {
      if (hash !== admin.hash) return false;
      try {
        window.sessionStorage.setItem(SESSION_KEY, 'open');
      } catch (err) {
        /* ignore */
      }
      emit();
      return true;
    });
  }

  function logout() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      /* ignore */
    }
    emit();
  }

  // Change le code : l'ancien code est toujours exigé (y compris lors du
  // changement obligatoire à la première connexion).
  function changeCode(oldCode, newCode) {
    return U.hashSecret(oldCode, admin.salt).then(function (hash) {
      if (hash !== admin.hash) {
        return { ok: false, error: 'Ancien code incorrect.' };
      }
      const validation = validateCode(newCode);
      if (!validation.ok) return validation;
      if (oldCode === newCode) {
        return { ok: false, error: 'Le nouveau code doit être différent de l’ancien.' };
      }
      const salt = U.randomSalt();
      return U.hashSecret(newCode, salt).then(function (newHash) {
        admin.salt = salt;
        admin.hash = newHash;
        admin.mustChange = false;
        admin.updatedAt = new Date().toISOString();
        persistAdmin();
        emit();
        return { ok: true };
      });
    });
  }

  function validateCode(code) {
    const value = String(code || '');
    if (value.length < 8) {
      return { ok: false, error: 'Le code doit contenir au moins 8 caractères.' };
    }
    if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
      return { ok: false, error: 'Le code doit contenir au moins une lettre et un chiffre.' };
    }
    return { ok: true };
  }

  /* --------------------------- Import / export ----------------------- */

  function exportData() {
    return JSON.stringify(data, null, 2);
  }

  function importData(json) {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      return { ok: false, error: 'Fichier JSON invalide.' };
    }
    if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.products)) {
      return { ok: false, error: 'Structure inattendue : « categories » et « products » sont requis.' };
    }
    if (!parsed.reviews) parsed.reviews = [];
    if (!parsed.store) parsed.store = D.defaultData().store;
    if (!parsed.store.access) parsed.store.access = [];
    if (!parsed.store.brands) parsed.store.brands = [];
    if (!parsed.store.social) parsed.store.social = [];
    data = parsed;
    persist();
    return { ok: true };
  }

  return {
    DEFAULT_ADMIN_CODE: DEFAULT_ADMIN_CODE,
    init: init,
    subscribe: subscribe,
    resetAll: resetAll,
    resetCatalog: resetCatalog,

    getStore: getStore,
    getCategories: getCategories,
    getCategory: getCategory,
    getSubcategories: getSubcategories,
    allSubcategories: allSubcategories,
    getSubcategory: getSubcategory,
    getProducts: getProducts,
    getProduct: getProduct,
    countProducts: countProducts,
    countProductsInCategory: countProductsInCategory,
    similarProducts: similarProducts,
    featuredProducts: featuredProducts,
    stats: stats,

    getReviews: getReviews,
    averageRating: averageRating,
    addReview: addReview,
    deleteReview: deleteReview,

    updateStore: updateStore,
    saveAccessPlan: saveAccessPlan,
    deleteAccessPlan: deleteAccessPlan,
    saveCategory: saveCategory,
    deleteCategory: deleteCategory,
    saveSubcategory: saveSubcategory,
    deleteSubcategory: deleteSubcategory,
    saveProduct: saveProduct,
    deleteProduct: deleteProduct,

    addProductImage: addProductImage,
    removeProductImage: removeProductImage,
    moveProductImage: moveProductImage,

    isLoggedIn: isLoggedIn,
    mustChangeCode: mustChangeCode,
    adminInfo: adminInfo,
    login: login,
    logout: logout,
    changeCode: changeCode,
    validateCode: validateCode,

    exportData: exportData,
    importData: importData
  };
})(GLS_UTILS, GLS_DATA);
