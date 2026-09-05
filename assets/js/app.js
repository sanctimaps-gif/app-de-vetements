/* =========================================================================
   Globo Loco Shop — Routeur et coquille de l'application
   ========================================================================= */

(function (U, S, V, A) {
  'use strict';

  const root = U.el('#view');
  const header = U.el('#site-header');

  /* ----------------------------- Routage ----------------------------- */

  function parseHash() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const parts = raw.split('?');
    const path = parts[0].replace(/^\/+|\/+$/g, '');
    const params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        if (!pair) return;
        const kv = pair.split('=');
        params[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
    }
    return { segments: path ? path.split('/') : [], params: params };
  }

  function resolve(route) {
    const seg = route.segments;
    const p = route.params;

    if (!seg.length) return V.home();
    switch (seg[0]) {
      case 'categories':
        return V.categories();
      case 'categorie':
        return seg[1] ? V.category(seg[1]) : V.categories();
      case 'sous-categorie':
        return seg[1] ? V.subcategory(seg[1], p) : V.categories();
      case 'produit':
        return seg[1] ? V.product(seg[1]) : V.notFound();
      case 'recherche':
        return V.search(p);
      case 'acces':
        return V.access();
      case 'magasin':
        return V.storeInfo();
      case 'admin':
        return A.view(p);
      default:
        return V.notFound();
    }
  }

  const ctx = {
    navigate: function (hash) {
      if (window.location.hash === hash) {
        render();
      } else {
        window.location.hash = hash;
      }
    },
    rerender: function (anchor) {
      render(anchor);
    }
  };

  let lastScroll = 0;

  function render(anchor) {
    const route = parseHash();
    const keepScroll = !!anchor;
    if (keepScroll) lastScroll = window.scrollY;

    let view;
    try {
      view = resolve(route);
    } catch (err) {
      view = V.notFound('Une erreur est survenue : ' + err.message);
    }

    root.innerHTML = view.html;
    document.title = (view.title ? view.title + ' — ' : '') + S.getStore().name;

    if (view.mount) view.mount(root, ctx);
    renderChrome(route);

    if (anchor) {
      const target = U.el(anchor, root);
      if (target) {
        target.scrollIntoView({ block: 'start' });
      } else {
        window.scrollTo(0, lastScroll);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  /* ---------------------- En-tête, menus, pied ----------------------- */

  function renderChrome(route) {
    const store = S.getStore();
    const cats = S.getCategories();
    const admin = S.isLoggedIn();
    const current = route.segments[0] || '';

    // L'en-tête est reconstruit à chaque rendu : on mémorise la saisie et le
    // focus de la recherche pour ne pas les perdre en cours de frappe.
    const previousSearch = U.el('#search-form input', header);
    const searchValue = route.params.q || (previousSearch ? previousSearch.value : '');
    const searchFocused = !!previousSearch && document.activeElement === previousSearch;
    const searchCaret = searchFocused ? previousSearch.selectionStart : null;

    header.innerHTML =
      '<div class="header__bar">' +
      '<button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">☰</button>' +
      '<a class="brand" href="#/">' +
      '<span class="brand__mark" aria-hidden="true">GL</span>' +
      '<span class="brand__text"><b>' + U.escapeHtml(store.name) + '</b>' +
      '<em>' + U.escapeHtml(store.address) + ' · ' + U.escapeHtml(store.city) + '</em></span>' +
      '</a>' +
      '<form class="search" id="search-form" role="search">' +
      '<input type="search" name="q" placeholder="Rechercher un article, une marque…" ' +
      'value="' + U.escapeHtml(searchValue) + '" aria-label="Rechercher">' +
      '<button type="submit" aria-label="Lancer la recherche">⌕</button>' +
      '</form>' +
      '<nav class="header__links">' +
      link('#/categories', 'Catalogue', current === 'categories' || current === 'categorie' || current === 'sous-categorie') +
      link('#/acces', 'Plans d’accès', current === 'acces') +
      link('#/magasin', 'La boutique', current === 'magasin') +
      '<a class="header__admin' + (current === 'admin' ? ' is-active' : '') + '" href="#/admin">' +
      (admin ? '● Administration' : 'Administration') + '</a>' +
      '</nav>' +
      '</div>' +
      '<nav class="megamenu" id="megamenu" hidden>' +
      cats
        .map(function (cat) {
          return (
            '<div class="megamenu__col">' +
            '<a class="megamenu__cat" href="#/categorie/' + cat.id + '">' +
            U.escapeHtml(cat.emoji) + ' ' + U.escapeHtml(cat.name) + '</a>' +
            '<ul>' +
            S.getSubcategories(cat.id)
              .map(function (sub) {
                return (
                  '<li><a href="#/sous-categorie/' + sub.id + '">' + U.escapeHtml(sub.name) + '</a></li>'
                );
              })
              .join('') +
            '</ul>' +
            '</div>'
          );
        })
        .join('') +
      '</nav>';

    const searchForm = U.el('#search-form', header);
    if (searchFocused) {
      const input = U.el('input', searchForm);
      input.focus();
      const caret = searchCaret === null ? input.value.length : searchCaret;
      try {
        input.setSelectionRange(caret, caret);
      } catch (err) {
        /* certains navigateurs refusent setSelectionRange sur type=search */
      }
    }
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const value = String(new FormData(searchForm).get('q') || '').trim();
      ctx.navigate(value ? '#/recherche?q=' + encodeURIComponent(value) : '#/categories');
      closeMenu();
    });

    const burger = U.el('#burger', header);
    burger.addEventListener('click', function () {
      const menu = U.el('#megamenu', header);
      const open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? '✕' : '☰';
    });

    U.el('#megamenu', header).addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    renderFooter();
  }

  function closeMenu() {
    const menu = U.el('#megamenu', header);
    const burger = U.el('#burger', header);
    if (menu) menu.hidden = true;
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.textContent = '☰';
    }
  }

  function link(href, label, active) {
    return (
      '<a href="' + href + '"' + (active ? ' class="is-active"' : '') + '>' + U.escapeHtml(label) + '</a>'
    );
  }

  function renderFooter() {
    const store = S.getStore();
    const footer = U.el('#site-footer');
    footer.innerHTML =
      '<div class="footer__inner">' +
      '<div>' +
      '<h2>' + U.escapeHtml(store.name) + '</h2>' +
      '<p>' + U.escapeHtml(store.address) + '<br>' +
      U.escapeHtml(store.postalCode) + ' ' + U.escapeHtml(store.city) + '<br>' +
      U.escapeHtml(store.phone) + '</p>' +
      '</div>' +
      '<div>' +
      '<h2>Rayons</h2>' +
      '<ul>' +
      S.getCategories()
        .map(function (cat) {
          return '<li><a href="#/categorie/' + cat.id + '">' + U.escapeHtml(cat.name) + '</a></li>';
        })
        .join('') +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h2>Infos</h2>' +
      '<ul>' +
      '<li><a href="#/acces">Plans d’accès</a></li>' +
      '<li><a href="#/magasin">Horaires et contact</a></li>' +
      '<li><a href="#/admin">Espace administrateur</a></li>' +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h2>Horaires</h2>' +
      '<ul class="hours hours--compact">' +
      store.hours
        .map(function (row) {
          return '<li><span>' + U.escapeHtml(row.day) + '</span><b>' + U.escapeHtml(row.value) + '</b></li>';
        })
        .join('') +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<p class="footer__legal">© ' + new Date().getFullYear() + ' ' + U.escapeHtml(store.name) +
      ' — Application de démonstration. Les données sont enregistrées localement dans ce navigateur.</p>';
  }

  /* ---------------------------- Démarrage ---------------------------- */

  window.addEventListener('hashchange', function () {
    closeMenu();
    render();
  });

  S.init().then(function () {
    render();
  });
})(GLS_UTILS, GLS_STORE, GLS_VIEWS, GLS_ADMIN);
