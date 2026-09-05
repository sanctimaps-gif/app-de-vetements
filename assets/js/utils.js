/* =========================================================================
   Globo Loco Shop — Utilitaires
   ========================================================================= */

const GLS_UTILS = (function () {
  'use strict';

  /* ------------------------------- DOM ------------------------------- */

  function el(selector, root) {
    return (root || document).querySelector(selector);
  }

  function els(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  /* ------------------------------ Divers ----------------------------- */

  function uid(prefix) {
    return (
      (prefix || 'id') +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function formatPrice(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return Number(value).toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // Normalise une chaîne pour la recherche (sans accents, minuscules).
  function normalize(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function slugify(str) {
    return normalize(str)
      .replace(/[’']/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parseList(value) {
    return String(value || '')
      .split(/[,\n;]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  /* --------------------------- Visuel produit ------------------------ */

  // Hash déterministe utilisé pour varier les visuels générés.
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function contrastOn(hex) {
    const clean = String(hex || '#888888').replace('#', '');
    if (clean.length < 6) return '#ffffff';
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.62 ? '#22222a' : '#ffffff';
  }

  // Génère un visuel SVG (data URI) pour les produits sans photo.
  // Aucune requête réseau : l'application fonctionne hors ligne.
  function placeholderImage(product, colorHex) {
    const base = colorHex || (product.colors && product.colors[0] && product.colors[0].hex) || '#8a8f98';
    const seed = hashString(product.id || product.name || 'produit');
    const angle = seed % 90;
    const ink = contrastOn(base);
    const initials = String(product.name || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) {
        return w.charAt(0).toUpperCase();
      })
      .join('');
    const brand = String(product.brand || 'Globo Loco Shop');

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">' +
      '<defs>' +
      '<linearGradient id="g" gradientTransform="rotate(' + angle + ')">' +
      '<stop offset="0%" stop-color="' + base + '"/>' +
      '<stop offset="100%" stop-color="' + base + '" stop-opacity="0.55"/>' +
      '</linearGradient>' +
      '<pattern id="p" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<rect width="46" height="46" fill="none"/>' +
      '<circle cx="10" cy="10" r="1.6" fill="' + ink + '" fill-opacity="0.16"/>' +
      '</pattern>' +
      '</defs>' +
      '<rect width="600" height="750" fill="url(#g)"/>' +
      '<rect width="600" height="750" fill="url(#p)"/>' +
      '<circle cx="300" cy="318" r="132" fill="' + ink + '" fill-opacity="0.10"/>' +
      '<text x="300" y="360" font-family="Georgia, serif" font-size="112" font-weight="700" ' +
      'text-anchor="middle" fill="' + ink + '" fill-opacity="0.85">' + escapeHtml(initials) + '</text>' +
      '<text x="300" y="620" font-family="Helvetica, Arial, sans-serif" font-size="26" ' +
      'letter-spacing="6" text-anchor="middle" fill="' + ink + '" fill-opacity="0.75">' +
      escapeHtml(brand.toUpperCase()) + '</text>' +
      '<text x="300" y="662" font-family="Helvetica, Arial, sans-serif" font-size="17" ' +
      'letter-spacing="3" text-anchor="middle" fill="' + ink + '" fill-opacity="0.55">' +
      'GLOBO LOCO SHOP</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Liste des visuels d'un produit : photos ajoutées, sinon visuels générés
  // (un par couleur, dans la limite de 4).
  function productImages(product) {
    if (product.images && product.images.length) return product.images.slice();
    const colors = (product.colors || []).slice(0, 4);
    if (!colors.length) return [placeholderImage(product, null)];
    return colors.map(function (c) {
      return placeholderImage(product, c.hex);
    });
  }

  function productCover(product) {
    return productImages(product)[0];
  }

  /* ------------------------- Redimensionnement ----------------------- */

  // Réduit une image importée avant stockage (le localStorage est limité).
  function readImageFile(file, maxSize) {
    const limit = maxSize || 1000;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error('Le fichier sélectionné n’est pas une image.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('Impossible de lire le fichier.'));
      };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () {
          reject(new Error('Image illisible.'));
        };
        img.onload = function () {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const ratio = Math.min(1, limit / Math.max(w, h));
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
          } catch (err) {
            // Canvas indisponible : on retombe sur l'image d'origine.
            resolve(String(reader.result));
          }
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Lecture d'un logo. Contrairement aux photos produit, on préserve la
  // transparence (sortie PNG, sans fond blanc) et on laisse les SVG intacts.
  function readLogoFile(file, maxSize) {
    const limit = maxSize || 400;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) {
        reject(new Error('Le fichier sélectionné n’est pas une image.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error('Impossible de lire le fichier.'));
      };
      reader.onload = function () {
        const source = String(reader.result);
        // Un SVG est déjà léger et se redimensionne sans perte : on le garde.
        if (file.type === 'image/svg+xml') {
          resolve(source);
          return;
        }
        const img = new Image();
        img.onerror = function () {
          reject(new Error('Image illisible.'));
        };
        img.onload = function () {
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const ratio = Math.min(1, limit / Math.max(w, h));
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
          try {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/png'));
          } catch (err) {
            resolve(source);
          }
        };
        img.src = source;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ------------------------------ Hash ------------------------------- */

  // Hachage du code administrateur. SHA-256 via Web Crypto quand disponible,
  // repli déterministe sinon (contextes non sécurisés).
  function hashSecret(secret, salt) {
    const input = String(salt || '') + '::' + String(secret || '');
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      try {
        return window.crypto.subtle
          .digest('SHA-256', new TextEncoder().encode(input))
          .then(function (buffer) {
            return (
              'sha256:' +
              Array.prototype.map
                .call(new Uint8Array(buffer), function (b) {
                  return b.toString(16).padStart(2, '0');
                })
                .join('')
            );
          })
          .catch(function () {
            return Promise.resolve(fallbackHash(input));
          });
      } catch (err) {
        return Promise.resolve(fallbackHash(input));
      }
    }
    return Promise.resolve(fallbackHash(input));
  }

  function fallbackHash(input) {
    let h1 = 0x811c9dc5;
    let h2 = 0xc2b2ae35;
    for (let i = 0; i < input.length; i++) {
      const c = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (c + i), 2246822519) >>> 0;
    }
    return 'fnv:' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }

  function randomSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(16);
      window.crypto.getRandomValues(arr);
      return Array.prototype.map
        .call(arr, function (b) {
          return b.toString(16).padStart(2, '0');
        })
        .join('');
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  /* ----------------------------- Toasts ------------------------------ */

  let toastTimer = null;

  function toast(message, kind) {
    let holder = el('#toast');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'toast';
      document.body.appendChild(holder);
    }
    holder.className = 'toast toast--' + (kind || 'info') + ' is-visible';
    holder.textContent = message;
    holder.setAttribute('role', 'status');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      holder.classList.remove('is-visible');
    }, 3200);
  }

  return {
    el: el,
    els: els,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    uid: uid,
    formatPrice: formatPrice,
    formatDate: formatDate,
    normalize: normalize,
    slugify: slugify,
    parseList: parseList,
    hashString: hashString,
    contrastOn: contrastOn,
    placeholderImage: placeholderImage,
    productImages: productImages,
    productCover: productCover,
    readImageFile: readImageFile,
    readLogoFile: readLogoFile,
    hashSecret: hashSecret,
    randomSalt: randomSalt,
    toast: toast
  };
})();
