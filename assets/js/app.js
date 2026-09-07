/* =========================================================================
   Globo Loco Shop — Routeur et coquille de l'application
   ========================================================================= */

(function (U, S, V, A) {
  'use strict';

  const root = U.el('#view');
  const header = U.el('#site-header');

  // Repère affiché en pied de page : permet de vérifier d'un coup d'œil quelle
  // version du site on est en train de consulter.
  const APP_REVISION = 'révision 5 — 5 septembre 2026';

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
    const shopName = S.getStore().name;
    document.title =
      view.title && view.title !== shopName ? view.title + ' — ' + shopName : shopName;

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
      brandMark(store) +
      '<span class="brand__text"><b>' + U.escapeHtml(store.name) + '</b>' +
      '<em>' + U.escapeHtml(store.address) + ' · ' + U.escapeHtml(store.city) + '</em></span>' +
      '</a>' +
      '<form class="search" id="search-form" role="search">' +
      '<input type="search" name="q" placeholder="' + U.escapeHtml(S.text('nav.search')) + '" ' +
      'value="' + U.escapeHtml(searchValue) + '" aria-label="Rechercher">' +
      '<button type="submit" aria-label="Lancer la recherche">⌕</button>' +
      '</form>' +
      '<nav class="header__links">' +
      link('#/categories', S.text('nav.catalogue'), current === 'categories' || current === 'categorie' || current === 'sous-categorie') +
      link('#/acces', S.text('nav.access'), current === 'acces') +
      link('#/magasin', S.text('nav.store'), current === 'magasin') +
      '<a class="header__admin' + (current === 'admin' ? ' is-active' : '') + '" href="#/admin">' +
      (admin ? '● ' : '') + U.escapeHtml(S.text('nav.admin')) + '</a>' +
      '</nav>' +
      '</div>' +
      // Chaque rayon est replié : on le déplie pour voir ses sous-catégories.
      '<nav class="megamenu" id="megamenu" hidden>' +
      '<div class="megamenu__inner">' +
      cats
        .map(function (cat) {
          const subs = S.getSubcategories(cat.id);
          return (
            '<details class="megamenu__group">' +
            '<summary>' +
            '<span class="megamenu__emoji" aria-hidden="true">' + U.escapeHtml(cat.emoji) + '</span>' +
            '<span class="megamenu__name">' + U.escapeHtml(cat.name) + '</span>' +
            '<span class="megamenu__count">' + subs.length + ' ' +
            U.escapeHtml(S.text('nav.menu.count')) + '</span>' +
            '<span class="megamenu__chevron" aria-hidden="true">▾</span>' +
            '</summary>' +
            '<ul>' +
            subs
              .map(function (sub) {
                return (
                  '<li><a href="#/sous-categorie/' + sub.id + '">' + U.escapeHtml(sub.name) + '</a></li>'
                );
              })
              .join('') +
            '<li class="megamenu__all"><a href="#/categorie/' + cat.id + '">' +
            U.escapeHtml(S.text('nav.menu.all')) + '</a></li>' +
            '</ul>' +
            '</details>'
          );
        })
        .join('') +
      '</div>' +
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

    // Un seul rayon déplié à la fois.
    const groups = U.els('.megamenu__group', header);
    groups.forEach(function (group) {
      group.addEventListener('toggle', function () {
        if (!group.open) return;
        groups.forEach(function (other) {
          if (other !== group) other.open = false;
        });
      });
    });

    applyFavicon(store);
    renderFooter();
  }

  // Logo de la boutique : image importée si elle existe, monogramme sinon.
  function brandMark(store) {
    if (store.logo) {
      return (
        '<span class="brand__logo"><img src="' + U.escapeHtml(store.logo) + '" alt="' +
        U.escapeHtml(store.name) + '"></span>'
      );
    }
    return (
      '<span class="brand__mark" aria-hidden="true">' +
      U.escapeHtml(store.logoInitials || initialsFrom(store.name)) +
      '</span>'
    );
  }

  function initialsFrom(name) {
    return String(name || '')
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) {
        return word.charAt(0).toUpperCase();
      })
      .join('');
  }

  // L'icône d'onglet suit le logo choisi par la boutique.
  function applyFavicon(store) {
    let icon = U.el('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    if (store.logo) {
      icon.href = store.logo;
      return;
    }
    const initials = store.logoInitials || initialsFrom(store.name);
    icon.href =
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
          '<rect width="64" height="64" rx="14" fill="#b8342f"/>' +
          '<text x="32" y="43" font-family="Georgia,serif" font-size="30" font-weight="700" ' +
          'text-anchor="middle" fill="#fff">' +
          U.escapeHtml(initials) +
          '</text></svg>'
      );
  }

  function closeMenu() {
    const menu = U.el('#megamenu', header);
    const burger = U.el('#burger', header);
    if (menu) {
      menu.hidden = true;
      // On referme les rayons pour rouvrir le menu dans son état replié.
      U.els('.megamenu__group', menu).forEach(function (group) {
        group.open = false;
      });
    }
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
      U.escapeHtml(store.postalCode) + ' ' + U.escapeHtml(store.city) +
      (store.phone ? '<br>' + U.escapeHtml(store.phone) : '') + '</p>' +
      ((store.social || []).length
        ? '<p class="footer__social">' +
          store.social
            .map(function (s) {
              return (
                '<a href="' + U.escapeHtml(s.url) + '" target="_blank" rel="noopener">' +
                U.escapeHtml(s.label) + ' ↗</a>'
              );
            })
            .join('') +
          '</p>'
        : '') +
      '</div>' +
      '<div>' +
      '<h2>' + U.escapeHtml(S.text('footer.sections')) + '</h2>' +
      '<ul>' +
      S.getCategories()
        .map(function (cat) {
          return '<li><a href="#/categorie/' + cat.id + '">' + U.escapeHtml(cat.name) + '</a></li>';
        })
        .join('') +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h2>' + U.escapeHtml(S.text('footer.infos')) + '</h2>' +
      '<ul>' +
      '<li><a href="#/acces">' + U.escapeHtml(S.text('footer.access')) + '</a></li>' +
      '<li><a href="#/magasin">' + U.escapeHtml(S.text('footer.contact')) + '</a></li>' +
      '<li><a href="#/admin">' + U.escapeHtml(S.text('footer.admin')) + '</a></li>' +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h2>' + U.escapeHtml(S.text('footer.hours')) + '</h2>' +
      '<ul class="hours hours--compact">' +
      store.hours
        .map(function (row) {
          return '<li><span>' + U.escapeHtml(row.day) + '</span><b>' + U.escapeHtml(row.value) + '</b></li>';
        })
        .join('') +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<p class="footer__credit">' + U.escapeHtml(S.text('credit.footer')) +
      ' <a href="mailto:' + U.escapeHtml(S.text('credit.email')) + '">' +
      U.escapeHtml(S.text('credit.email')) + '</a>.</p>' +
      '<p class="footer__legal">© ' + new Date().getFullYear() + ' ' + U.escapeHtml(store.name) +
      ' — ' + U.escapeHtml(store.address) + ', ' + U.escapeHtml(store.postalCode) + ' ' +
      U.escapeHtml(store.city) + '. ' + U.escapeHtml(S.text('footer.rights')) +
      ' <span class="footer__rev">' + U.escapeHtml(APP_REVISION) + '</span></p>';
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
