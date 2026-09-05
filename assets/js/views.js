/* =========================================================================
   Globo Loco Shop — Vues publiques
   ========================================================================= */

const GLS_VIEWS = (function (U, S) {
  'use strict';

  const h = U.escapeHtml;

  /* ---------------------------- Composants --------------------------- */

  function stars(rating) {
    if (rating === null || rating === undefined) {
      return '<span class="stars stars--empty" aria-label="Aucun avis">☆☆☆☆☆</span>';
    }
    const full = Math.round(rating);
    let out = '';
    for (let i = 1; i <= 5; i++) out += i <= full ? '★' : '☆';
    return (
      '<span class="stars" aria-label="Note ' + h(rating) + ' sur 5">' + out + '</span>'
    );
  }

  function breadcrumb(items) {
    return (
      '<nav class="breadcrumb" aria-label="Fil d’Ariane"><ol>' +
      items
        .map(function (item, i) {
          const last = i === items.length - 1;
          return (
            '<li>' +
            (last || !item.href
              ? '<span aria-current="page">' + h(item.label) + '</span>'
              : '<a href="' + h(item.href) + '">' + h(item.label) + '</a>') +
            '</li>'
          );
        })
        .join('') +
      '</ol></nav>'
    );
  }

  function colorDots(product, max) {
    const colors = (product.colors || []).slice(0, max || 5);
    if (!colors.length) return '';
    return (
      '<span class="dots" title="' +
      h(
        (product.colors || [])
          .map(function (c) {
            return c.name;
          })
          .join(', ')
      ) +
      '">' +
      colors
        .map(function (c) {
          return '<i class="dot" style="background:' + h(c.hex) + '"></i>';
        })
        .join('') +
      ((product.colors || []).length > colors.length
        ? '<em class="dots__more">+' + ((product.colors || []).length - colors.length) + '</em>'
        : '') +
      '</span>'
    );
  }

  function productCard(product) {
    const rating = S.averageRating(product.id);
    const sub = S.getSubcategory(product.subcategoryId);
    return (
      '<a class="card" href="#/produit/' + h(product.id) + '">' +
      '<div class="card__media">' +
      '<img loading="lazy" src="' + h(U.productCover(product)) + '" alt="' + h(product.name) + '">' +
      (product.oldPrice ? '<span class="badge badge--sale">Promo</span>' : '') +
      (!product.inStock ? '<span class="badge badge--out">Épuisé</span>' : '') +
      '</div>' +
      '<div class="card__body">' +
      '<p class="card__brand">' + h(product.brand) + '</p>' +
      '<h3 class="card__title">' + h(product.name) + '</h3>' +
      '<p class="card__meta">' + h(sub ? sub.name : '') + '</p>' +
      '<div class="card__footer">' +
      '<span class="price">' +
      U.formatPrice(product.price) +
      (product.oldPrice ? ' <s>' + U.formatPrice(product.oldPrice) + '</s>' : '') +
      '</span>' +
      colorDots(product, 4) +
      '</div>' +
      (rating ? '<p class="card__rating">' + stars(rating) + ' <span>' + h(rating) + '/5</span></p>' : '') +
      '</div>' +
      '</a>'
    );
  }

  function grid(products, emptyMessage) {
    if (!products.length) {
      return '<p class="empty">' + h(emptyMessage || 'Aucun article pour le moment.') + '</p>';
    }
    return '<div class="grid">' + products.map(productCard).join('') + '</div>';
  }

  /* ------------------------------ Accueil ---------------------------- */

  function home() {
    const store = S.getStore();
    const categories = S.getCategories();
    const st = S.stats();

    const html =
      '<section class="hero">' +
      '<div class="hero__text">' +
      '<p class="hero__eyebrow">' + h(store.city) + ' — ' + h(store.address) + '</p>' +
      '<h1>' + h(store.name) + '</h1>' +
      '<p class="hero__tagline">' + h(store.tagline) + '</p>' +
      '<p class="hero__about">' + h(store.about) + '</p>' +
      '<div class="hero__actions">' +
      '<a class="btn btn--primary" href="#/categories">Voir le catalogue</a>' +
      '<a class="btn btn--ghost" href="#/acces">Comment venir</a>' +
      '</div>' +
      '<ul class="hero__stats">' +
      '<li><strong>' + st.categories + '</strong><span>catégories</span></li>' +
      '<li><strong>' + st.subcategories + '</strong><span>sous-catégories</span></li>' +
      '<li><strong>' + st.products + '</strong><span>articles</span></li>' +
      '</ul>' +
      '</div>' +
      '<div class="hero__card">' +
      '<h2>Horaires</h2>' +
      '<ul class="hours">' +
      store.hours
        .map(function (row) {
          return '<li><span>' + h(row.day) + '</span><b>' + h(row.value) + '</b></li>';
        })
        .join('') +
      '</ul>' +
      '<p class="hero__contact">' +
      h(store.address) + '<br>' + h(store.postalCode) + ' ' + h(store.city) +
      (store.phone ? '<br>' + h(store.phone) : '') +
      '</p>' +
      ((store.social || []).length
        ? '<p class="hero__social">' +
          store.social
            .map(function (s) {
              return (
                '<a class="btn btn--ghost btn--small" href="' + h(s.url) +
                '" target="_blank" rel="noopener">Suivre sur ' + h(s.label) + ' ↗</a>'
              );
            })
            .join(' ') +
          '</p>'
        : '') +
      '</div>' +
      '</section>' +
      '<section class="section">' +
      '<div class="section__head"><h2>Nos rayons</h2>' +
      '<a class="link" href="#/categories">Tout parcourir →</a></div>' +
      '<div class="cats">' +
      categories
        .map(function (cat) {
          return (
            '<a class="cat" href="#/categorie/' + h(cat.id) + '">' +
            '<span class="cat__emoji" aria-hidden="true">' + h(cat.emoji) + '</span>' +
            '<span class="cat__name">' + h(cat.name) + '</span>' +
            '<span class="cat__count">' + cat.subcategories.length + ' sous-catégories · ' +
            S.countProductsInCategory(cat.id) + ' articles</span>' +
            '</a>'
          );
        })
        .join('') +
      '</div>' +
      '</section>' +
      '<section class="section">' +
      '<div class="section__head"><h2>Coups de cœur</h2></div>' +
      grid(S.featuredProducts(8)) +
      '</section>' +
      '<section class="section band">' +
      '<div class="band__inner">' +
      '<div><h2>Venir à la boutique</h2>' +
      '<p>Métro, bus, train, voiture, vélo ou à pied : tous les plans d’accès au ' +
      h(store.address) + ', ' + h(store.postalCode) + ' ' + h(store.city) + '.</p></div>' +
      '<a class="btn btn--primary" href="#/acces">Voir les plans d’accès</a>' +
      '</div>' +
      '</section>';

    return { html: html, title: store.name };
  }

  /* --------------------------- Catégories ---------------------------- */

  function categories() {
    const cats = S.getCategories();
    const html =
      breadcrumb([{ label: 'Accueil', href: '#/' }, { label: 'Catalogue' }]) +
      '<header class="page-head">' +
      '<h1>Le catalogue</h1>' +
      '<p>Choisissez un rayon, puis une sous-catégorie pour voir les articles.</p>' +
      '</header>' +
      '<div class="cats cats--large">' +
      cats
        .map(function (cat) {
          return (
            '<a class="cat" href="#/categorie/' + h(cat.id) + '">' +
            '<span class="cat__emoji" aria-hidden="true">' + h(cat.emoji) + '</span>' +
            '<span class="cat__name">' + h(cat.name) + '</span>' +
            '<span class="cat__desc">' + h(cat.description) + '</span>' +
            '<span class="cat__count">' + cat.subcategories.length + ' sous-catégories · ' +
            S.countProductsInCategory(cat.id) + ' articles</span>' +
            '</a>'
          );
        })
        .join('') +
      '</div>';
    return { html: html, title: 'Catalogue' };
  }

  // Page catégorie : uniquement les sous-catégories, aucun article.
  function category(id) {
    const cat = S.getCategory(id);
    if (!cat) return notFound('Catégorie introuvable.');
    const subs = S.getSubcategories(cat.id);

    const html =
      breadcrumb([
        { label: 'Accueil', href: '#/' },
        { label: 'Catalogue', href: '#/categories' },
        { label: cat.name }
      ]) +
      '<header class="page-head">' +
      '<h1><span aria-hidden="true">' + h(cat.emoji) + '</span> ' + h(cat.name) + '</h1>' +
      '<p>' + h(cat.description) + '</p>' +
      '<p class="page-head__note">Les articles se trouvent dans les sous-catégories ci-dessous.</p>' +
      '</header>' +
      (subs.length
        ? '<div class="subs">' +
          subs
            .map(function (sub) {
              return (
                '<a class="sub" href="#/sous-categorie/' + h(sub.id) + '">' +
                '<span class="sub__name">' + h(sub.name) + '</span>' +
                '<span class="sub__count">' + S.countProducts(sub.id) + ' articles</span>' +
                '</a>'
              );
            })
            .join('') +
          '</div>'
        : '<p class="empty">Aucune sous-catégorie pour l’instant.</p>');

    return { html: html, title: cat.name };
  }

  /* ------------------------- Sous-catégorie -------------------------- */

  function subcategory(id, params) {
    const sub = S.getSubcategory(id);
    if (!sub) return notFound('Sous-catégorie introuvable.');
    const cat = S.getCategory(sub.categoryId);
    let products = S.getProducts({ subcategoryId: sub.id });

    // Options de filtre construites depuis le catalogue de la sous-catégorie.
    const brands = uniq(
      products.map(function (p) {
        return p.brand;
      })
    ).sort();
    const sizes = uniq(
      products.reduce(function (acc, p) {
        return acc.concat(p.sizes || []);
      }, [])
    );
    const colors = uniq(
      products.reduce(function (acc, p) {
        return acc.concat(
          (p.colors || []).map(function (c) {
            return c.name;
          })
        );
      }, [])
    ).sort();

    const fBrand = params.marque || '';
    const fSize = params.taille || '';
    const fColor = params.couleur || '';
    const sort = params.tri || 'defaut';

    if (fBrand) {
      products = products.filter(function (p) {
        return p.brand === fBrand;
      });
    }
    if (fSize) {
      products = products.filter(function (p) {
        return (p.sizes || []).indexOf(fSize) !== -1;
      });
    }
    if (fColor) {
      products = products.filter(function (p) {
        return (p.colors || []).some(function (c) {
          return c.name === fColor;
        });
      });
    }
    if (sort === 'prix-asc') products.sort(byPrice(1));
    if (sort === 'prix-desc') products.sort(byPrice(-1));
    if (sort === 'nom') {
      products.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'fr');
      });
    }
    if (sort === 'note') {
      products.sort(function (a, b) {
        return (S.averageRating(b.id) || 0) - (S.averageRating(a.id) || 0);
      });
    }

    function options(list, selected) {
      return list
        .map(function (v) {
          return (
            '<option value="' + h(v) + '"' + (v === selected ? ' selected' : '') + '>' + h(v) + '</option>'
          );
        })
        .join('');
    }

    const html =
      breadcrumb([
        { label: 'Accueil', href: '#/' },
        { label: 'Catalogue', href: '#/categories' },
        { label: cat ? cat.name : '', href: cat ? '#/categorie/' + cat.id : '' },
        { label: sub.name }
      ]) +
      '<header class="page-head">' +
      '<h1>' + h(sub.name) + '</h1>' +
      '<p>' + h(sub.description) + '</p>' +
      '</header>' +
      '<form class="filters" id="filters" data-sub="' + h(sub.id) + '">' +
      '<label>Marque<select name="marque"><option value="">Toutes</option>' +
      options(brands, fBrand) + '</select></label>' +
      '<label>Taille<select name="taille"><option value="">Toutes</option>' +
      options(sizes, fSize) + '</select></label>' +
      '<label>Couleur<select name="couleur"><option value="">Toutes</option>' +
      options(colors, fColor) + '</select></label>' +
      '<label>Trier<select name="tri">' +
      '<option value="defaut"' + (sort === 'defaut' ? ' selected' : '') + '>Sélection</option>' +
      '<option value="prix-asc"' + (sort === 'prix-asc' ? ' selected' : '') + '>Prix croissant</option>' +
      '<option value="prix-desc"' + (sort === 'prix-desc' ? ' selected' : '') + '>Prix décroissant</option>' +
      '<option value="nom"' + (sort === 'nom' ? ' selected' : '') + '>Nom (A-Z)</option>' +
      '<option value="note"' + (sort === 'note' ? ' selected' : '') + '>Mieux notés</option>' +
      '</select></label>' +
      '<button type="button" class="btn btn--ghost btn--small" id="filters-reset">Réinitialiser</button>' +
      '</form>' +
      '<p class="result-count">' + products.length + ' article' + (products.length > 1 ? 's' : '') + '</p>' +
      grid(products, 'Aucun article ne correspond à ces filtres.');

    return {
      html: html,
      title: sub.name,
      mount: function (root, ctx) {
        const form = U.el('#filters', root);
        if (!form) return;
        form.addEventListener('change', function () {
          const q = [];
          U.els('select', form).forEach(function (select) {
            if (select.value && select.value !== 'defaut') {
              q.push(encodeURIComponent(select.name) + '=' + encodeURIComponent(select.value));
            }
          });
          ctx.navigate('#/sous-categorie/' + sub.id + (q.length ? '?' + q.join('&') : ''));
        });
        const reset = U.el('#filters-reset', root);
        if (reset) {
          reset.addEventListener('click', function () {
            ctx.navigate('#/sous-categorie/' + sub.id);
          });
        }
      }
    };
  }

  function byPrice(dir) {
    return function (a, b) {
      return (a.price - b.price) * dir;
    };
  }

  function uniq(list) {
    const seen = {};
    const out = [];
    list.forEach(function (v) {
      if (v && !seen[v]) {
        seen[v] = true;
        out.push(v);
      }
    });
    return out;
  }

  /* ---------------------------- Fiche produit ------------------------ */

  function product(id) {
    const p = S.getProduct(id);
    if (!p) return notFound('Article introuvable.');
    const sub = S.getSubcategory(p.subcategoryId);
    const cat = S.getCategory(p.categoryId);
    const reviews = S.getReviews(p.id);
    const rating = S.averageRating(p.id);
    const similar = S.similarProducts(p, 6);
    const isAdmin = S.isLoggedIn();
    const images = U.productImages(p);
    const generated = !(p.images && p.images.length);

    const html =
      breadcrumb([
        { label: 'Accueil', href: '#/' },
        { label: 'Catalogue', href: '#/categories' },
        { label: cat ? cat.name : '', href: cat ? '#/categorie/' + cat.id : '' },
        { label: sub ? sub.name : '', href: sub ? '#/sous-categorie/' + sub.id : '' },
        { label: p.name }
      ]) +
      '<article class="product" data-product="' + h(p.id) + '">' +

      /* ---- Photo (au-dessus des informations) ---- */
      '<section class="product__gallery">' +
      '<div class="gallery__main">' +
      '<img id="gallery-main" src="' + h(images[0]) + '" alt="' + h(p.name) + '">' +
      '</div>' +
      '<div class="gallery__thumbs" id="gallery-thumbs">' +
      images
        .map(function (src, i) {
          return (
            '<button type="button" class="thumb' + (i === 0 ? ' is-active' : '') +
            '" data-index="' + i + '" data-src="' + h(src) + '">' +
            '<img src="' + h(src) + '" alt="Vue ' + (i + 1) + ' de ' + h(p.name) + '">' +
            (isAdmin && !generated
              ? '<span class="thumb__tools">' +
                '<i data-photo-move="-1" data-index="' + i + '" title="Déplacer à gauche">◀</i>' +
                '<i data-photo-remove="' + i + '" title="Retirer cette photo">✕</i>' +
                '<i data-photo-move="1" data-index="' + i + '" title="Déplacer à droite">▶</i>' +
                '</span>'
              : '') +
            '</button>'
          );
        })
        .join('') +
      '</div>' +
      (generated
        ? '<p class="gallery__note">Visuel généré automatiquement — ajoutez une photo depuis l’espace administrateur.</p>'
        : '') +
      (isAdmin
        ? '<div class="gallery__admin">' +
          '<p class="gallery__admin-title">Gestion des photos</p>' +
          '<div class="gallery__admin-row">' +
          '<label class="btn btn--small btn--ghost">Ajouter une photo' +
          '<input type="file" accept="image/*" id="photo-file" hidden multiple></label>' +
          '<input type="url" id="photo-url" placeholder="…ou coller une adresse d’image (https://)">' +
          '<button type="button" class="btn btn--small" id="photo-url-add">Ajouter l’URL</button>' +
          '</div>' +
          (p.images && p.images.length
            ? '<button type="button" class="btn btn--small btn--danger-ghost" id="photo-clear">Retirer toutes les photos</button>'
            : '') +
          '</div>'
        : '') +
      '</section>' +

      /* ---- Informations sous la photo ---- */
      '<section class="product__info">' +
      '<p class="product__brand">' + h(p.brand) + (p.collection ? ' · ' + h(p.collection) : '') + '</p>' +
      '<h1>' + h(p.name) + '</h1>' +
      '<p class="product__price">' +
      U.formatPrice(p.price) +
      (p.oldPrice ? ' <s>' + U.formatPrice(p.oldPrice) + '</s>' : '') +
      '</p>' +
      '<p class="product__rating">' + stars(rating) +
      (rating ? ' <span>' + h(rating) + '/5 · ' + reviews.length + ' avis</span>' : ' <span>Aucun avis</span>') +
      '</p>' +
      '<p class="product__stock ' + (p.inStock ? 'in' : 'out') + '">' +
      (p.inStock ? 'Disponible en boutique' : 'Momentanément épuisé') + '</p>' +

      '<div class="specs">' +
      '<div class="spec"><h2>Marque</h2><p>' + h(p.brand) + '</p></div>' +
      '<div class="spec"><h2>Tailles disponibles</h2>' +
      '<ul class="sizes">' +
      (p.sizes || [])
        .map(function (s) {
          return '<li>' + h(s) + '</li>';
        })
        .join('') +
      '</ul>' +
      (!(p.sizes || []).length ? '<p class="muted">Non renseigné</p>' : '') +
      '</div>' +
      '<div class="spec"><h2>Couleurs disponibles</h2>' +
      '<ul class="colors">' +
      (p.colors || [])
        .map(function (c, i) {
          return (
            '<li><button type="button" class="color' + (i === 0 ? ' is-active' : '') +
            '" data-color-index="' + i + '" data-hex="' + h(c.hex) + '">' +
            '<i style="background:' + h(c.hex) + '"></i><span>' + h(c.name) + '</span></button></li>'
          );
        })
        .join('') +
      '</ul>' +
      (!(p.colors || []).length ? '<p class="muted">Non renseigné</p>' : '') +
      '</div>' +
      '<div class="spec spec--wide"><h2>Description</h2><p>' + h(p.description) + '</p></div>' +
      (p.material || p.cut || p.care || p.reference
        ? '<div class="spec spec--wide"><h2>Détails</h2><ul class="details">' +
          (p.material ? '<li><span>Matière</span><b>' + h(p.material) + '</b></li>' : '') +
          (p.cut ? '<li><span>Coupe</span><b>' + h(p.cut) + '</b></li>' : '') +
          (p.care ? '<li><span>Entretien</span><b>' + h(p.care) + '</b></li>' : '') +
          (p.reference ? '<li><span>Référence</span><b>' + h(p.reference) + '</b></li>' : '') +
          '</ul></div>'
        : '') +
      '</div>' +

      (isAdmin
        ? '<p class="product__admin-link"><a class="btn btn--small btn--ghost" href="#/admin?onglet=produits&produit=' +
          h(p.id) + '">Modifier cet article</a></p>'
        : '') +
      '</section>' +

      /* ---- Avis ---- */
      '<section class="product__reviews" id="avis">' +
      '<h2>Avis des client·es</h2>' +
      (reviews.length
        ? '<ul class="reviews">' +
          reviews
            .map(function (r) {
              return (
                '<li class="review">' +
                '<p class="review__head"><b>' + h(r.author) + '</b> ' + stars(r.rating) +
                '<time>' + h(U.formatDate(r.date)) + '</time></p>' +
                '<p class="review__body">' + h(r.comment) + '</p>' +
                (isAdmin
                  ? '<button type="button" class="btn btn--tiny btn--danger-ghost" data-review-delete="' +
                    h(r.id) + '">Supprimer</button>'
                  : '') +
                '</li>'
              );
            })
            .join('') +
          '</ul>'
        : '<p class="empty">Aucun avis pour l’instant. Soyez la première personne à en laisser un.</p>') +
      '<form class="review-form" id="review-form">' +
      '<h3>Laisser un avis</h3>' +
      '<div class="review-form__row">' +
      '<label>Votre prénom<input type="text" name="author" maxlength="40" placeholder="Camille" required></label>' +
      '<label>Note<select name="rating">' +
      '<option value="5">★★★★★ — Excellent</option>' +
      '<option value="4">★★★★☆ — Très bien</option>' +
      '<option value="3">★★★☆☆ — Correct</option>' +
      '<option value="2">★★☆☆☆ — Décevant</option>' +
      '<option value="1">★☆☆☆☆ — Mauvais</option>' +
      '</select></label>' +
      '</div>' +
      '<label>Votre avis<textarea name="comment" rows="3" maxlength="600" ' +
      'placeholder="Taille, matière, confort…" required></textarea></label>' +
      '<button type="submit" class="btn btn--primary">Publier mon avis</button>' +
      '</form>' +
      '</section>' +

      /* ---- Produits similaires ---- */
      '<section class="product__similar">' +
      '<h2>Produits similaires</h2>' +
      (similar.length
        ? '<ul class="similar-list">' +
          similar
            .map(function (sp) {
              const ssub = S.getSubcategory(sp.subcategoryId);
              return (
                '<li><a href="#/produit/' + h(sp.id) + '">' +
                '<img src="' + h(U.productCover(sp)) + '" alt="" loading="lazy">' +
                '<span class="similar__text">' +
                '<b>' + h(sp.name) + '</b>' +
                '<em>' + h(sp.brand) + ' · ' + h(ssub ? ssub.name : '') + '</em>' +
                '</span>' +
                '<span class="similar__price">' + U.formatPrice(sp.price) + '</span>' +
                '</a></li>'
              );
            })
            .join('') +
          '</ul>'
        : '<p class="empty">Aucun produit similaire pour le moment.</p>') +
      '</section>' +
      '</article>';

    return {
      html: html,
      title: p.name,
      mount: function (root, ctx) {
        mountProduct(root, ctx, p);
      }
    };
  }

  function mountProduct(root, ctx, p) {
    const main = U.el('#gallery-main', root);
    const thumbs = U.el('#gallery-thumbs', root);
    const isAdmin = S.isLoggedIn();

    // Sélection d'une vignette
    if (thumbs) {
      thumbs.addEventListener('click', function (event) {
        const removeBtn = event.target.closest('[data-photo-remove]');
        if (removeBtn) {
          event.preventDefault();
          event.stopPropagation();
          const index = Number(removeBtn.getAttribute('data-photo-remove'));
          if (window.confirm('Retirer cette photo de la fiche ?')) {
            S.removeProductImage(p.id, index);
            U.toast('Photo retirée.', 'success');
            ctx.rerender();
          }
          return;
        }
        const moveBtn = event.target.closest('[data-photo-move]');
        if (moveBtn) {
          event.preventDefault();
          event.stopPropagation();
          S.moveProductImage(
            p.id,
            Number(moveBtn.getAttribute('data-index')),
            Number(moveBtn.getAttribute('data-photo-move'))
          );
          ctx.rerender();
          return;
        }
        const btn = event.target.closest('.thumb');
        if (!btn || !main) return;
        main.src = btn.getAttribute('data-src');
        U.els('.thumb', thumbs).forEach(function (t) {
          t.classList.remove('is-active');
        });
        btn.classList.add('is-active');
      });
    }

    // Sélection de couleur : met à jour le visuel généré quand il n'y a pas
    // de photo réelle.
    U.els('[data-color-index]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        U.els('[data-color-index]', root).forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        if (!(p.images && p.images.length) && main) {
          const index = Number(btn.getAttribute('data-color-index'));
          const src = U.placeholderImage(p, (p.colors[index] || {}).hex);
          main.src = src;
          const thumb = U.el('.thumb[data-index="' + index + '"]', root);
          if (thumb) {
            U.els('.thumb', root).forEach(function (t) {
              t.classList.remove('is-active');
            });
            thumb.classList.add('is-active');
          }
        }
      });
    });

    // Avis
    const form = U.el('#review-form', root);
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const fd = new FormData(form);
        const author = String(fd.get('author') || '').trim();
        const comment = String(fd.get('comment') || '').trim();
        if (!author || !comment) {
          U.toast('Merci de renseigner votre prénom et votre avis.', 'error');
          return;
        }
        S.addReview({
          productId: p.id,
          author: author,
          rating: Number(fd.get('rating')),
          comment: comment
        });
        U.toast('Merci, votre avis est publié.', 'success');
        ctx.rerender('#avis');
      });
    }

    U.els('[data-review-delete]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!window.confirm('Supprimer cet avis ?')) return;
        S.deleteReview(btn.getAttribute('data-review-delete'));
        U.toast('Avis supprimé.', 'success');
        ctx.rerender('#avis');
      });
    });

    if (!isAdmin) return;

    // Ajout de photos (fichier)
    const fileInput = U.el('#photo-file', root);
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const files = Array.prototype.slice.call(fileInput.files || []);
        if (!files.length) return;
        Promise.all(
          files.map(function (file) {
            return U.readImageFile(file, 1000);
          })
        )
          .then(function (urls) {
            urls.forEach(function (url) {
              S.addProductImage(p.id, url);
            });
            U.toast(urls.length + ' photo(s) ajoutée(s).', 'success');
            ctx.rerender();
          })
          .catch(function (err) {
            U.toast(err.message || 'Impossible d’ajouter cette image.', 'error');
          });
      });
    }

    // Ajout de photo (URL)
    const urlAdd = U.el('#photo-url-add', root);
    if (urlAdd) {
      urlAdd.addEventListener('click', function () {
        const input = U.el('#photo-url', root);
        const value = String(input.value || '').trim();
        if (!/^https?:\/\//i.test(value) && !/^data:image\//i.test(value)) {
          U.toast('Adresse invalide : elle doit commencer par https:// .', 'error');
          return;
        }
        S.addProductImage(p.id, value);
        U.toast('Photo ajoutée.', 'success');
        ctx.rerender();
      });
    }

    const clear = U.el('#photo-clear', root);
    if (clear) {
      clear.addEventListener('click', function () {
        if (!window.confirm('Retirer toutes les photos ? Le visuel généré sera réaffiché.')) return;
        S.saveProduct({ id: p.id, subcategoryId: p.subcategoryId, images: [] });
        U.toast('Photos retirées.', 'success');
        ctx.rerender();
      });
    }
  }

  /* ---------------------------- Recherche ---------------------------- */

  function search(params) {
    const query = params.q || '';
    const results = query ? S.getProducts({ query: query }) : [];
    const html =
      breadcrumb([{ label: 'Accueil', href: '#/' }, { label: 'Recherche' }]) +
      '<header class="page-head"><h1>Recherche</h1>' +
      (query ? '<p>' + results.length + ' résultat(s) pour « ' + h(query) + ' »</p>' : '<p>Saisissez un terme dans la barre de recherche.</p>') +
      '</header>' +
      (query ? grid(results, 'Aucun article ne correspond à cette recherche.') : '');
    return { html: html, title: 'Recherche' };
  }

  /* ------------------------- Plans d'accès --------------------------- */

  function accessMap(store) {
    // Plan schématique du quartier (non à l'échelle), généré en SVG.
    return (
      '<figure class="map">' +
      '<svg viewBox="0 0 720 460" role="img" aria-label="Plan schématique du quartier autour de la boutique">' +
      '<rect width="720" height="460" fill="#f2efe9"/>' +
      // Îlots
      '<g fill="#e4ded2">' +
      '<rect x="30" y="40" width="260" height="150" rx="6"/>' +
      '<rect x="30" y="230" width="260" height="180" rx="6"/>' +
      '<rect x="430" y="40" width="260" height="110" rx="6"/>' +
      '<rect x="430" y="190" width="260" height="120" rx="6"/>' +
      '<rect x="430" y="350" width="260" height="60" rx="6"/>' +
      '</g>' +
      // Rues transversales
      '<g stroke="#ffffff" stroke-width="18" stroke-linecap="round">' +
      '<line x1="30" y1="210" x2="690" y2="210"/>' +
      '<line x1="30" y1="330" x2="690" y2="330"/>' +
      '<line x1="430" y1="170" x2="690" y2="170"/>' +
      '</g>' +
      // Rue Jeanne d'Arc (axe principal)
      '<line x1="360" y1="10" x2="360" y2="450" stroke="#ffffff" stroke-width="42"/>' +
      '<line x1="360" y1="10" x2="360" y2="450" stroke="#cfc5b2" stroke-width="2" stroke-dasharray="12 14"/>' +
      // Seine
      '<rect x="0" y="425" width="720" height="35" fill="#a8c6d8"/>' +
      '<text x="16" y="449" font-size="13" fill="#3d5c6e" font-family="Helvetica, Arial, sans-serif">La Seine</text>' +
      // Libellés
      '<text x="372" y="28" font-size="14" font-weight="700" fill="#33312c" font-family="Helvetica, Arial, sans-serif">↑ Gare de Rouen-Rive-Droite</text>' +
      '<text x="346" y="205" font-size="13" fill="#6b6455" font-family="Helvetica, Arial, sans-serif" transform="rotate(-90 346 205)">Rue Jeanne d’Arc</text>' +
      '<text x="40" y="204" font-size="12" fill="#7a7264" font-family="Helvetica, Arial, sans-serif">Rue Ganterie</text>' +
      '<text x="40" y="324" font-size="12" fill="#7a7264" font-family="Helvetica, Arial, sans-serif">Rue du Gros-Horloge</text>' +
      '<text x="440" y="164" font-size="12" fill="#7a7264" font-family="Helvetica, Arial, sans-serif">Rue aux Juifs · Palais de Justice</text>' +
      // Points d'intérêt
      poi(360, 268, '#b8342f', 'Globo Loco Shop — 59 rue Jeanne d’Arc', true) +
      poi(360, 120, '#2b5d8a', 'Métro Gare-Rue Verte (vers le nord)') +
      poi(360, 210, '#2b5d8a', 'Métro Palais de Justice') +
      poi(360, 392, '#2b5d8a', 'Métro / TEOR Théâtre des Arts') +
      poi(560, 312, '#3f7a4f', 'Parking Espace du Palais') +
      poi(250, 330, '#3f7a4f', 'Parking Vieux-Marché') +
      '</svg>' +
      '<figcaption>Plan schématique du quartier — non à l’échelle. Les distances réelles sont indiquées dans les fiches ci-dessous.</figcaption>' +
      '</figure>'
    );
  }

  function poi(x, y, color, label, big) {
    const r = big ? 13 : 8;
    const anchor = x > 400 ? 'end' : 'start';
    const dx = x > 400 ? -(r + 8) : r + 8;
    return (
      '<g>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '" stroke="#fff" stroke-width="3"/>' +
      (big ? '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 8) + '" fill="' + color + '" opacity="0.18"/>' : '') +
      '<text x="' + (x + dx) + '" y="' + (y + 4) + '" text-anchor="' + anchor + '" font-size="' +
      (big ? 14 : 12) + '" font-weight="' + (big ? '700' : '500') + '" fill="#33312c" ' +
      'font-family="Helvetica, Arial, sans-serif">' + h(label) + '</text>' +
      '</g>'
    );
  }

  function access() {
    const store = S.getStore();
    const fullAddress =
      store.address + ', ' + store.postalCode + ' ' + store.city + ', ' + store.country;
    const encoded = encodeURIComponent(fullAddress);
    const geo = store.lat + ',' + store.lng;

    const html =
      breadcrumb([{ label: 'Accueil', href: '#/' }, { label: 'Plans d’accès' }]) +
      '<header class="page-head">' +
      '<h1>Venir à la boutique</h1>' +
      '<p><strong>' + h(store.name) + '</strong> — ' + h(store.address) + ', ' +
      h(store.postalCode) + ' ' + h(store.city) + '</p>' +
      '</header>' +
      accessMap(store) +
      '<div class="itineraries">' +
      '<a class="btn btn--primary" target="_blank" rel="noopener" ' +
      'href="https://www.openstreetmap.org/?mlat=' + h(store.lat) + '&mlon=' + h(store.lng) + '#map=18/' +
      h(store.lat) + '/' + h(store.lng) + '">Ouvrir dans OpenStreetMap</a>' +
      '<a class="btn btn--ghost" target="_blank" rel="noopener" ' +
      'href="https://www.google.com/maps/dir/?api=1&destination=' + encoded + '">Itinéraire Google Maps</a>' +
      '<a class="btn btn--ghost" target="_blank" rel="noopener" ' +
      'href="https://maps.apple.com/?daddr=' + encoded + '">Itinéraire Plans (Apple)</a>' +
      '<a class="btn btn--ghost" href="geo:' + h(geo) + '?q=' + encoded + '">Ouvrir dans mon GPS</a>' +
      '</div>' +
      '<div class="access-grid">' +
      store.access
        .map(function (plan) {
          return (
            '<article class="access">' +
            '<h2><span aria-hidden="true">' + h(plan.icon) + '</span> ' + h(plan.title) + '</h2>' +
            '<p class="access__summary">' + h(plan.summary) + '</p>' +
            '<ul>' +
            (plan.steps || [])
              .map(function (step) {
                return '<li>' + h(step) + '</li>';
              })
              .join('') +
            '</ul>' +
            '</article>'
          );
        })
        .join('') +
      '</div>' +
      '<p class="disclaimer">Les informations de transport et de stationnement sont indicatives et ' +
      'modifiables depuis l’espace administrateur (onglet « Magasin »). Vérifiez les horaires ' +
      'auprès des exploitants de réseau avant votre déplacement.</p>';

    return { html: html, title: 'Plans d’accès' };
  }

  /* ------------------------------ Magasin ---------------------------- */

  function storeInfo() {
    const store = S.getStore();
    const html =
      breadcrumb([{ label: 'Accueil', href: '#/' }, { label: 'La boutique' }]) +
      '<header class="page-head"><h1>La boutique</h1><p>' + h(store.tagline) + '</p></header>' +
      '<div class="store-grid">' +
      '<section class="panel"><h2>À propos</h2><p>' + h(store.about) + '</p></section>' +
      '<section class="panel"><h2>Coordonnées</h2>' +
      '<p>' + h(store.address) + '<br>' + h(store.postalCode) + ' ' + h(store.city) + '<br>' +
      h(store.country) + '</p>' +
      '<p>' +
      (store.phone
        ? '<a href="tel:' + h(String(store.phone).replace(/\s/g, '')) + '">' + h(store.phone) + '</a>'
        : '') +
      (store.phone && store.email ? '<br>' : '') +
      (store.email ? '<a href="mailto:' + h(store.email) + '">' + h(store.email) + '</a>' : '') +
      '</p>' +
      (store.social && store.social.length
        ? '<p class="social">' +
          store.social
            .map(function (s) {
              return (
                '<a href="' + h(s.url) + '" target="_blank" rel="noopener">' + h(s.label) + ' ↗</a>'
              );
            })
            .join(' · ') +
          '</p>'
        : '') +
      '</section>' +
      '<section class="panel"><h2>Horaires</h2><ul class="hours">' +
      store.hours
        .map(function (row) {
          return '<li><span>' + h(row.day) + '</span><b>' + h(row.value) + '</b></li>';
        })
        .join('') +
      '</ul></section>' +
      ((store.brands || []).length
        ? '<section class="panel panel--full"><h2>Marques en boutique</h2>' +
          '<ul class="brand-list">' +
          store.brands
            .map(function (b) {
              return '<li>' + h(b) + '</li>';
            })
            .join('') +
          '</ul>' +
          '<p class="muted">Sélection variable selon les arrivages.</p>' +
          '</section>'
        : '') +
      '</div>' +
      '<p class="cta-line"><a class="btn btn--primary" href="#/acces">Voir tous les plans d’accès</a></p>' +
      creditBlock();
    return { html: html, title: 'La boutique' };
  }

  /* --------------------------- Crédit / contact ---------------------- */

  // Encart de contact du créateur du site.
  function creditBlock() {
    return (
      '<aside class="credit">' +
      '<h2>Un site comme celui-ci pour votre commerce ?</h2>' +
      '<p>Ce site a été conçu sur mesure. Pour contacter le créateur du site, il suffit ' +
      'd’envoyer un mail à <a href="mailto:Sanctimaps@gmail.com">Sanctimaps@gmail.com</a>.</p>' +
      '</aside>'
    );
  }

  /* ------------------------------- 404 ------------------------------- */

  function notFound(message) {
    return {
      html:
        '<div class="page-head"><h1>Page introuvable</h1><p>' +
        h(message || 'Cette page n’existe pas ou a été supprimée.') +
        '</p><p><a class="btn btn--primary" href="#/">Retour à l’accueil</a></p></div>',
      title: 'Page introuvable'
    };
  }

  return {
    home: home,
    categories: categories,
    category: category,
    subcategory: subcategory,
    product: product,
    search: search,
    access: access,
    storeInfo: storeInfo,
    notFound: notFound,
    grid: grid,
    stars: stars,
    productCard: productCard
  };
})(GLS_UTILS, GLS_STORE);
