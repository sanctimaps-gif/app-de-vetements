/* =========================================================================
   Globo Loco Shop — Espace administrateur
   -------------------------------------------------------------------------
   Connexion par code, changement obligatoire à la première connexion, puis
   gestion des catégories, sous-catégories, articles, photos, avis, des
   informations du magasin et des plans d'accès.
   ========================================================================= */

const GLS_ADMIN = (function (U, S, D) {
  'use strict';

  const h = U.escapeHtml;

  // Libellés lisibles des grilles de tailles proposées aux sous-catégories.
  const SIZE_TYPE_LABELS = {
    clothing: 'Vêtements',
    bottoms: 'Bas (tailles chiffrées)',
    shoes: 'Chaussures',
    onesize: 'Taille unique',
    socks: 'Chaussettes',
    bra: 'Soutiens-gorge',
    belt: 'Ceintures',
    gloves: 'Gants',
    luggage: 'Bagagerie'
  };

  const TABS = [
    { id: 'tableau', label: 'Tableau de bord' },
    { id: 'categories', label: 'Catégories' },
    { id: 'produits', label: 'Articles' },
    { id: 'magasin', label: 'Magasin & accès' },
    { id: 'textes', label: 'Textes du site' },
    { id: 'securite', label: 'Code d’accès' },
    { id: 'donnees', label: 'Données' }
  ];

  /* ============================== Entrée ============================= */

  function view(params) {
    if (!S.isLoggedIn()) return loginView(params);
    if (S.mustChangeCode()) return firstChangeView();
    return dashboard(params);
  }

  /* ============================ Connexion ============================ */

  function loginView(params) {
    const info = S.adminInfo();
    const html =
      '<div class="admin-gate">' +
      '<h1>Espace administrateur</h1>' +
      '<p>Accès réservé à la gestion de la boutique.</p>' +
      '<form id="login-form" class="gate-form">' +
      '<label>Code administrateur' +
      '<input type="password" name="code" autocomplete="current-password" required autofocus></label>' +
      '<button type="submit" class="btn btn--primary">Se connecter</button>' +
      '<p class="gate-error" id="login-error" hidden></p>' +
      '</form>' +
      (info.usingDefault
        ? '<p class="gate-hint"><b>Première connexion</b> — le code livré par défaut est ' +
          '<code>' + h(S.DEFAULT_ADMIN_CODE) + '</code>. Il devra être changé immédiatement après ' +
          'la connexion.</p>'
        : '<p class="gate-hint">Code oublié ? Il n’est pas récupérable : seule une réinitialisation ' +
          'complète des données (onglet « Données » d’une session ouverte, ou vidage du stockage du ' +
          'navigateur) rétablit le code par défaut.</p>') +
      '</div>';

    return {
      html: html,
      title: 'Administration',
      mount: function (root, ctx) {
        const form = U.el('#login-form', root);
        const error = U.el('#login-error', root);
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          const code = new FormData(form).get('code');
          S.login(code).then(function (ok) {
            if (!ok) {
              error.hidden = false;
              error.textContent = 'Code incorrect.';
              return;
            }
            U.toast('Connexion réussie.', 'success');
            ctx.rerender();
          });
        });
      }
    };
  }

  /* ================= Changement obligatoire du code ================== */

  function firstChangeView() {
    const html =
      '<div class="admin-gate">' +
      '<h1>Changez votre code</h1>' +
      '<p>Pour votre sécurité, le code livré par défaut doit être remplacé avant ' +
      'd’accéder à la gestion de la boutique.</p>' +
      changeCodeForm('Définir mon nouveau code') +
      '<p class="gate-hint">Le code devra contenir au moins 8 caractères, dont une lettre et un ' +
      'chiffre. Il pourra être modifié à tout moment, à condition de connaître l’ancien code.</p>' +
      '<p><button type="button" class="btn btn--ghost btn--small" id="gate-logout">Se déconnecter</button></p>' +
      '</div>';

    return {
      html: html,
      title: 'Changer le code',
      mount: function (root, ctx) {
        bindChangeCode(root, ctx);
        U.el('#gate-logout', root).addEventListener('click', function () {
          S.logout();
          ctx.rerender();
        });
      }
    };
  }

  function changeCodeForm(submitLabel) {
    return (
      '<form id="code-form" class="gate-form">' +
      '<label>Ancien code<input type="password" name="old" autocomplete="current-password" required></label>' +
      '<label>Nouveau code<input type="password" name="next" autocomplete="new-password" required></label>' +
      '<label>Confirmer le nouveau code<input type="password" name="confirm" autocomplete="new-password" required></label>' +
      '<button type="submit" class="btn btn--primary">' + h(submitLabel) + '</button>' +
      '<p class="gate-error" id="code-error" hidden></p>' +
      '</form>'
    );
  }

  function bindChangeCode(root, ctx) {
    const form = U.el('#code-form', root);
    const error = U.el('#code-error', root);
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const fd = new FormData(form);
      const oldCode = String(fd.get('old') || '');
      const next = String(fd.get('next') || '');
      const confirm = String(fd.get('confirm') || '');
      error.hidden = true;

      if (next !== confirm) {
        error.hidden = false;
        error.textContent = 'Les deux nouveaux codes ne correspondent pas.';
        return;
      }
      S.changeCode(oldCode, next).then(function (result) {
        if (!result.ok) {
          error.hidden = false;
          error.textContent = result.error;
          return;
        }
        U.toast('Code administrateur mis à jour.', 'success');
        ctx.rerender();
      });
    });
  }

  /* ============================ Tableau de bord ====================== */

  function dashboard(params) {
    const active = params.onglet || 'tableau';
    const body = renderTab(active, params);

    const html =
      '<div class="admin">' +
      '<header class="admin__head">' +
      '<div><h1>Administration</h1><p>Connecté·e — toutes les modifications sont enregistrées ' +
      'immédiatement dans ce navigateur.</p></div>' +
      '<button type="button" class="btn btn--ghost btn--small" id="admin-logout">Se déconnecter</button>' +
      '</header>' +
      '<nav class="admin__tabs">' +
      TABS.map(function (tab) {
        return (
          '<a class="admin__tab' + (tab.id === active ? ' is-active' : '') +
          '" href="#/admin?onglet=' + tab.id + '">' + h(tab.label) + '</a>'
        );
      }).join('') +
      '</nav>' +
      '<div class="admin__body">' + body.html + '</div>' +
      '</div>';

    return {
      html: html,
      title: 'Administration',
      mount: function (root, ctx) {
        U.el('#admin-logout', root).addEventListener('click', function () {
          S.logout();
          U.toast('Déconnecté·e.', 'info');
          ctx.navigate('#/');
        });
        if (body.mount) body.mount(root, ctx);
      }
    };
  }

  function renderTab(tab, params) {
    if (tab === 'categories') return tabCategories(params);
    if (tab === 'produits') return tabProducts(params);
    if (tab === 'magasin') return tabStore(params);
    if (tab === 'textes') return tabTexts();
    if (tab === 'securite') return tabSecurity();
    if (tab === 'donnees') return tabData();
    return tabOverview();
  }

  /* --------------------------- Onglet : accueil ---------------------- */

  function tabOverview() {
    const st = S.stats();
    const info = S.adminInfo();
    const cats = S.getCategories();
    const emptySubs = S.allSubcategories().filter(function (sub) {
      return S.countProducts(sub.id) === 0;
    });
    const noPhoto = S.getProducts({}).filter(function (p) {
      return !(p.images && p.images.length);
    });

    return {
      html:
        '<div class="kpis">' +
        kpi(st.categories, 'catégories') +
        kpi(st.subcategories, 'sous-catégories') +
        kpi(st.products, 'articles') +
        kpi(st.reviews, 'avis') +
        '</div>' +
        '<div class="panel">' +
        '<h2>État du catalogue</h2>' +
        '<ul class="checklist">' +
        '<li>' + noPhoto.length + ' article(s) sans photo réelle (visuel généré automatiquement).</li>' +
        '<li>' + emptySubs.length + ' sous-catégorie(s) sans article.</li>' +
        '<li>Code administrateur ' +
        (info.updatedAt
          ? 'modifié le ' + h(U.formatDate(info.updatedAt)) + '.'
          : 'jamais modifié.') +
        '</li>' +
        '</ul>' +
        '</div>' +
        '<div class="panel">' +
        '<h2>Répartition par rayon</h2>' +
        '<ul class="bars">' +
        cats
          .map(function (cat) {
            const count = S.countProductsInCategory(cat.id);
            const pct = st.products ? Math.round((count / st.products) * 100) : 0;
            return (
              '<li><span>' + h(cat.emoji) + ' ' + h(cat.name) + '</span>' +
              '<i style="width:' + Math.max(pct, 2) + '%"></i>' +
              '<b>' + count + '</b></li>'
            );
          })
          .join('') +
        '</ul>' +
        '</div>'
    };
  }

  function kpi(value, label) {
    return '<div class="kpi"><strong>' + value + '</strong><span>' + h(label) + '</span></div>';
  }

  /* ------------------------ Onglet : catégories ---------------------- */

  function tabCategories(params) {
    const cats = S.getCategories();
    const editCat = params.categorie ? S.getCategory(params.categorie) : null;
    const editSub = params.souscategorie ? S.getSubcategory(params.souscategorie) : null;

    const html =
      '<div class="panel">' +
      '<h2>' + (editCat ? 'Modifier la catégorie' : 'Ajouter une catégorie') + '</h2>' +
      '<form id="cat-form" class="form form--inline">' +
      '<input type="hidden" name="id" value="' + h(editCat ? editCat.id : '') + '">' +
      '<label class="small">Icône<input type="text" name="emoji" maxlength="4" value="' +
      h(editCat ? editCat.emoji : '🏷️') + '"></label>' +
      '<label>Nom<input type="text" name="name" required value="' +
      h(editCat ? editCat.name : '') + '"></label>' +
      '<label class="wide">Description<input type="text" name="description" value="' +
      h(editCat ? editCat.description : '') + '"></label>' +
      '<div class="form__actions">' +
      '<button type="submit" class="btn btn--primary">' + (editCat ? 'Enregistrer' : 'Ajouter') + '</button>' +
      (editCat ? '<a class="btn btn--ghost" href="#/admin?onglet=categories">Annuler</a>' : '') +
      '</div>' +
      '</form>' +
      '</div>' +

      '<div class="panel">' +
      '<h2>' + (editSub ? 'Modifier la sous-catégorie' : 'Ajouter une sous-catégorie') + '</h2>' +
      '<form id="sub-form" class="form form--inline">' +
      '<input type="hidden" name="id" value="' + h(editSub ? editSub.id : '') + '">' +
      '<label>Catégorie<select name="categoryId" required>' +
      cats
        .map(function (c) {
          const selected = editSub
            ? c.id === editSub.categoryId
            : params.categorieParente === c.id;
          return '<option value="' + h(c.id) + '"' + (selected ? ' selected' : '') + '>' + h(c.name) + '</option>';
        })
        .join('') +
      '</select></label>' +
      '<label>Nom<input type="text" name="name" required value="' + h(editSub ? editSub.name : '') + '"></label>' +
      '<label>Grille de tailles<select name="sizeType">' +
      Object.keys(D.SIZE_SETS)
        .map(function (key) {
          const selected = editSub && editSub.sizeType === key;
          const set = D.SIZE_SETS[key];
          const preview = set.slice(0, 4).join(', ') + (set.length > 4 ? '…' : '');
          return (
            '<option value="' + h(key) + '"' + (selected ? ' selected' : '') + '>' +
            h(SIZE_TYPE_LABELS[key] || key) + ' — ' + h(preview) + '</option>'
          );
        })
        .join('') +
      '</select></label>' +
      '<label class="wide">Description<input type="text" name="description" value="' +
      h(editSub ? editSub.description : '') + '"></label>' +
      '<div class="form__actions">' +
      '<button type="submit" class="btn btn--primary">' + (editSub ? 'Enregistrer' : 'Ajouter') + '</button>' +
      (editSub ? '<a class="btn btn--ghost" href="#/admin?onglet=categories">Annuler</a>' : '') +
      '</div>' +
      '</form>' +
      '</div>' +

      '<div class="panel">' +
      '<h2>Arborescence</h2>' +
      '<div class="tree">' +
      cats
        .map(function (cat) {
          const subs = S.getSubcategories(cat.id);
          return (
            '<details class="tree__cat"' + (cats.length <= 3 ? ' open' : '') + '>' +
            '<summary>' +
            '<span class="tree__title">' + h(cat.emoji) + ' ' + h(cat.name) + '</span>' +
            '<span class="tree__count">' + subs.length + ' sous-catégories · ' +
            S.countProductsInCategory(cat.id) + ' articles</span>' +
            '</summary>' +
            '<div class="tree__tools">' +
            '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=categories&categorie=' + h(cat.id) + '">Modifier</a>' +
            '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=categories&categorieParente=' + h(cat.id) + '">+ Sous-catégorie</a>' +
            '<button type="button" class="btn btn--tiny btn--danger-ghost" data-del-cat="' + h(cat.id) + '">Supprimer</button>' +
            '</div>' +
            '<ul class="tree__subs">' +
            subs
              .map(function (sub) {
                return (
                  '<li>' +
                  '<a class="tree__sub-name" href="#/sous-categorie/' + h(sub.id) + '">' + h(sub.name) + '</a>' +
                  '<span class="tree__count">' + S.countProducts(sub.id) + ' articles</span>' +
                  '<span class="tree__tools">' +
                  '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=categories&souscategorie=' + h(sub.id) + '">Modifier</a>' +
                  '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=produits&sous=' + h(sub.id) + '">Articles</a>' +
                  '<button type="button" class="btn btn--tiny btn--danger-ghost" data-del-sub="' + h(sub.id) + '">Supprimer</button>' +
                  '</span>' +
                  '</li>'
                );
              })
              .join('') +
            (!subs.length ? '<li class="muted">Aucune sous-catégorie.</li>' : '') +
            '</ul>' +
            '</details>'
          );
        })
        .join('') +
      '</div>' +
      '</div>';

    return {
      html: html,
      mount: function (root, ctx) {
        const catForm = U.el('#cat-form', root);
        catForm.addEventListener('submit', function (event) {
          event.preventDefault();
          const fd = new FormData(catForm);
          S.saveCategory({
            id: String(fd.get('id') || '') || null,
            name: String(fd.get('name') || '').trim(),
            emoji: String(fd.get('emoji') || '').trim() || '🏷️',
            description: String(fd.get('description') || '').trim()
          });
          U.toast('Catégorie enregistrée.', 'success');
          ctx.navigate('#/admin?onglet=categories');
        });

        const subForm = U.el('#sub-form', root);
        subForm.addEventListener('submit', function (event) {
          event.preventDefault();
          const fd = new FormData(subForm);
          const saved = S.saveSubcategory({
            id: String(fd.get('id') || '') || null,
            categoryId: String(fd.get('categoryId') || ''),
            name: String(fd.get('name') || '').trim(),
            sizeType: String(fd.get('sizeType') || 'clothing'),
            description: String(fd.get('description') || '').trim()
          });
          if (!saved) {
            U.toast('Catégorie de rattachement introuvable.', 'error');
            return;
          }
          U.toast('Sous-catégorie enregistrée.', 'success');
          ctx.navigate('#/admin?onglet=categories');
        });

        U.els('[data-del-cat]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-del-cat');
            const cat = S.getCategory(id);
            const count = S.countProductsInCategory(id);
            if (
              !window.confirm(
                'Supprimer la catégorie « ' + cat.name + ' » ?\n' +
                  'Ses ' + cat.subcategories.length + ' sous-catégories et ' + count +
                  ' articles seront également supprimés.'
              )
            )
              return;
            S.deleteCategory(id);
            U.toast('Catégorie supprimée.', 'success');
            ctx.rerender();
          });
        });

        U.els('[data-del-sub]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = btn.getAttribute('data-del-sub');
            const sub = S.getSubcategory(id);
            if (
              !window.confirm(
                'Supprimer la sous-catégorie « ' + sub.name + ' » et ses ' +
                  S.countProducts(id) + ' articles ?'
              )
            )
              return;
            S.deleteSubcategory(id);
            U.toast('Sous-catégorie supprimée.', 'success');
            ctx.rerender();
          });
        });
      }
    };
  }

  /* -------------------------- Onglet : articles ---------------------- */

  function tabProducts(params) {
    const subs = S.allSubcategories();
    const editing = params.produit ? S.getProduct(params.produit) : null;
    const creating = params.nouveau === '1';
    const currentSub = params.sous || (editing ? editing.subcategoryId : '');
    const list = currentSub ? S.getProducts({ subcategoryId: currentSub }) : [];

    function subOptions(selected) {
      return S.getCategories()
        .map(function (cat) {
          return (
            '<optgroup label="' + h(cat.name) + '">' +
            S.getSubcategories(cat.id)
              .map(function (sub) {
                return (
                  '<option value="' + h(sub.id) + '"' + (sub.id === selected ? ' selected' : '') + '>' +
                  h(sub.name) + ' (' + S.countProducts(sub.id) + ')</option>'
                );
              })
              .join('') +
            '</optgroup>'
          );
        })
        .join('');
    }

    let html =
      '<div class="panel">' +
      '<h2>Choisir une sous-catégorie</h2>' +
      '<form class="form form--inline" id="sub-picker">' +
      '<label class="wide">Sous-catégorie<select name="sous">' +
      '<option value="">— Sélectionner —</option>' + subOptions(currentSub) + '</select></label>' +
      '<div class="form__actions">' +
      (currentSub
        ? '<a class="btn btn--primary" href="#/admin?onglet=produits&sous=' + h(currentSub) +
          '&nouveau=1">+ Nouvel article</a>'
        : '') +
      '</div>' +
      '</form>' +
      '</div>';

    if (editing || (creating && currentSub)) {
      html += productForm(editing, currentSub, subOptions);
    }

    if (currentSub) {
      const sub = S.getSubcategory(currentSub);
      html +=
        '<div class="panel">' +
        '<h2>' + h(sub ? sub.name : '') + ' — ' + list.length + ' article(s)</h2>' +
        (list.length
          ? '<table class="table"><thead><tr>' +
            '<th>Article</th><th>Marque</th><th>Prix</th><th>Tailles</th><th>Photos</th><th>Stock</th><th></th>' +
            '</tr></thead><tbody>' +
            list
              .map(function (p) {
                return (
                  '<tr>' +
                  '<td><a href="#/produit/' + h(p.id) + '">' + h(p.name) + '</a></td>' +
                  '<td>' + h(p.brand) + '</td>' +
                  '<td>' + U.formatPrice(p.price) + '</td>' +
                  '<td>' + h((p.sizes || []).join(', ')) + '</td>' +
                  '<td>' + ((p.images && p.images.length) || 0) + '</td>' +
                  '<td>' + (p.inStock ? 'Oui' : 'Non') + '</td>' +
                  '<td class="table__actions">' +
                  '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=produits&sous=' + h(currentSub) +
                  '&produit=' + h(p.id) + '">Modifier</a>' +
                  '<button type="button" class="btn btn--tiny btn--danger-ghost" data-del-prd="' + h(p.id) +
                  '">Supprimer</button>' +
                  '</td>' +
                  '</tr>'
                );
              })
              .join('') +
            '</tbody></table>'
          : '<p class="empty">Aucun article dans cette sous-catégorie.</p>') +
        '</div>';
    }

    return {
      html: html,
      mount: function (root, ctx) {
        const picker = U.el('#sub-picker select', root);
        picker.addEventListener('change', function () {
          ctx.navigate(
            picker.value ? '#/admin?onglet=produits&sous=' + picker.value : '#/admin?onglet=produits'
          );
        });

        U.els('[data-del-prd]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            const p = S.getProduct(btn.getAttribute('data-del-prd'));
            if (!window.confirm('Supprimer l’article « ' + p.name + ' » ?')) return;
            S.deleteProduct(p.id);
            U.toast('Article supprimé.', 'success');
            ctx.rerender();
          });
        });

        bindProductForm(root, ctx, editing, currentSub);
      }
    };
  }

  function productForm(product, subId, subOptions) {
    const p = product || {};
    const sub = S.getSubcategory(product ? product.subcategoryId : subId);
    const sizePreset = (sub && D.SIZE_SETS[sub.sizeType]) || D.SIZE_SETS.clothing;
    const colors = p.colors || [];

    return (
      '<div class="panel" id="product-panel">' +
      '<h2>' + (product ? 'Modifier « ' + h(p.name) + ' »' : 'Nouvel article') + '</h2>' +
      '<form id="product-form" class="form form--grid">' +
      '<input type="hidden" name="id" value="' + h(p.id || '') + '">' +
      '<label>Nom<input type="text" name="name" required value="' + h(p.name || '') + '"></label>' +
      '<label>Marque<input type="text" name="brand" list="brand-list" value="' + h(p.brand || '') + '"></label>' +
      '<datalist id="brand-list">' +
      D.BRANDS.map(function (b) {
        return '<option value="' + h(b) + '"></option>';
      }).join('') +
      '</datalist>' +
      '<label>Collection<input type="text" name="collection" value="' + h(p.collection || '') + '"></label>' +
      '<label>Sous-catégorie<select name="subcategoryId" required>' +
      subOptions(product ? product.subcategoryId : subId) + '</select></label>' +
      '<label>Prix (€)<input type="number" step="0.01" min="0" name="price" required value="' +
      h(p.price !== undefined ? p.price : '') + '"></label>' +
      '<label>Prix barré (€)<input type="number" step="0.01" min="0" name="oldPrice" value="' +
      h(p.oldPrice || '') + '"></label>' +
      '<label>Référence<input type="text" name="reference" value="' + h(p.reference || '') + '"></label>' +
      '<label>Matière<input type="text" name="material" value="' + h(p.material || '') + '"></label>' +
      '<label>Coupe<input type="text" name="cut" value="' + h(p.cut || '') + '"></label>' +
      '<label class="wide">Entretien<input type="text" name="care" value="' + h(p.care || '') + '"></label>' +
      '<label class="wide">Description<textarea name="description" rows="4">' +
      h(p.description || '') + '</textarea></label>' +

      '<div class="field wide">' +
      '<span class="field__label">Tailles disponibles</span>' +
      '<input type="text" name="sizes" id="sizes-input" value="' + h((p.sizes || []).join(', ')) +
      '" placeholder="S, M, L, XL">' +
      '<p class="field__hint">Séparées par des virgules. Grille de la sous-catégorie :' +
      sizePreset
        .map(function (s) {
          return ' <button type="button" class="chip" data-size="' + h(s) + '">' + h(s) + '</button>';
        })
        .join('') +
      ' <button type="button" class="chip chip--all" data-size-all="' + h(sizePreset.join(', ')) +
      '">Tout ajouter</button></p>' +
      '</div>' +

      '<div class="field wide">' +
      '<span class="field__label">Couleurs disponibles</span>' +
      '<div id="colors-rows">' +
      (colors.length
        ? colors.map(colorRow).join('')
        : colorRow({ name: '', hex: '#1b1b1f' })) +
      '</div>' +
      '<p class="field__hint">' +
      '<button type="button" class="chip" id="color-add">+ Ajouter une couleur</button>' +
      D.COLOR_POOL.slice(0, 8)
        .map(function (c) {
          return (
            ' <button type="button" class="chip chip--color" data-color-name="' + h(c.name) +
            '" data-color-hex="' + h(c.hex) + '"><i style="background:' + h(c.hex) + '"></i>' +
            h(c.name) + '</button>'
          );
        })
        .join('') +
      '</p>' +
      '</div>' +

      '<label class="check"><input type="checkbox" name="inStock"' +
      (p.inStock === false ? '' : ' checked') + '> Disponible en boutique</label>' +
      '<label class="check"><input type="checkbox" name="featured"' +
      (p.featured ? ' checked' : '') + '> Mettre en avant sur l’accueil</label>' +

      (product ? photosField(p) : '') +

      '<div class="form__actions wide">' +
      '<button type="submit" class="btn btn--primary">Enregistrer</button>' +
      '<a class="btn btn--ghost" href="#/admin?onglet=produits&sous=' +
      h(product ? product.subcategoryId : subId) + '">Annuler</a>' +
      '</div>' +
      '</form>' +
      '</div>'
    );
  }

  // Bloc de gestion des photos affiché dans le formulaire d'un article existant.
  function photosField(p) {
    const images = p.images || [];
    return (
      '<div class="field wide">' +
      '<span class="field__label">Photos (' + images.length + ')</span>' +
      (images.length
        ? '<div class="admin-photos">' +
          images
            .map(function (src, i) {
              return (
                '<figure class="admin-photo"><img src="' + h(src) + '" alt="Photo ' + (i + 1) + '">' +
                '<button type="button" class="btn btn--tiny btn--danger-ghost" ' +
                'data-admin-photo-remove="' + i + '">Retirer</button></figure>'
              );
            })
            .join('') +
          '</div>'
        : '<p class="muted">Aucune photo : un visuel est généré automatiquement à partir des couleurs.</p>') +
      '<p class="field__hint">' +
      '<label class="chip">+ Ajouter des photos' +
      '<input type="file" id="admin-photo-file" accept="image/*" multiple hidden></label> ' +
      '<a class="chip" href="#/produit/' + h(p.id) + '">Voir la fiche</a></p>' +
      '</div>'
    );
  }

  function colorRow(color) {
    return (
      '<div class="color-row">' +
      '<input type="color" value="' + h(color.hex || '#1b1b1f') + '" data-color-hex>' +
      '<input type="text" value="' + h(color.name || '') + '" placeholder="Nom de la couleur" data-color-name>' +
      '<button type="button" class="btn btn--tiny btn--danger-ghost" data-color-remove>Retirer</button>' +
      '</div>'
    );
  }

  function bindProductForm(root, ctx, product, subId) {
    const form = U.el('#product-form', root);
    if (!form) return;

    // Tailles : ajout rapide
    const sizesInput = U.el('#sizes-input', form);
    U.els('[data-size]', form).forEach(function (chip) {
      chip.addEventListener('click', function () {
        const value = chip.getAttribute('data-size');
        const list = U.parseList(sizesInput.value);
        if (list.indexOf(value) === -1) list.push(value);
        sizesInput.value = list.join(', ');
      });
    });
    const allChip = U.el('[data-size-all]', form);
    if (allChip) {
      allChip.addEventListener('click', function () {
        sizesInput.value = allChip.getAttribute('data-size-all');
      });
    }

    // Couleurs
    const rows = U.el('#colors-rows', form);
    U.el('#color-add', form).addEventListener('click', function () {
      rows.insertAdjacentHTML('beforeend', colorRow({ name: '', hex: '#1b1b1f' }));
    });
    U.els('[data-color-name][data-color-hex]', form).forEach(function (chip) {
      chip.addEventListener('click', function () {
        rows.insertAdjacentHTML(
          'beforeend',
          colorRow({
            name: chip.getAttribute('data-color-name'),
            hex: chip.getAttribute('data-color-hex')
          })
        );
      });
    });
    rows.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-color-remove]');
      if (!btn) return;
      const row = btn.closest('.color-row');
      if (row) row.remove();
    });

    // Photos depuis le formulaire admin
    const photoFile = U.el('#admin-photo-file', form);
    if (photoFile && product) {
      photoFile.addEventListener('change', function () {
        const files = Array.prototype.slice.call(photoFile.files || []);
        if (!files.length) return;
        Promise.all(
          files.map(function (f) {
            return U.readImageFile(f, 1000);
          })
        )
          .then(function (urls) {
            urls.forEach(function (url) {
              S.addProductImage(product.id, url);
            });
            U.toast(urls.length + ' photo(s) ajoutée(s).', 'success');
            ctx.rerender();
          })
          .catch(function (err) {
            U.toast(err.message || 'Image invalide.', 'error');
          });
      });
    }

    U.els('[data-admin-photo-remove]', form).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!product) return;
        S.removeProductImage(product.id, Number(btn.getAttribute('data-admin-photo-remove')));
        U.toast('Photo retirée.', 'success');
        ctx.rerender();
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      const fd = new FormData(form);
      const colors = U.els('.color-row', form)
        .map(function (row) {
          return {
            name: String(U.el('[data-color-name]', row).value || '').trim(),
            hex: U.el('[data-color-hex]', row).value
          };
        })
        .filter(function (c) {
          return c.name;
        });

      const payload = {
        id: String(fd.get('id') || '') || null,
        subcategoryId: String(fd.get('subcategoryId') || subId),
        name: String(fd.get('name') || '').trim(),
        brand: String(fd.get('brand') || '').trim(),
        collection: String(fd.get('collection') || '').trim(),
        price: Number(fd.get('price')) || 0,
        oldPrice: fd.get('oldPrice') ? Number(fd.get('oldPrice')) : null,
        reference: String(fd.get('reference') || '').trim(),
        material: String(fd.get('material') || '').trim(),
        cut: String(fd.get('cut') || '').trim(),
        care: String(fd.get('care') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        sizes: U.parseList(fd.get('sizes')),
        colors: colors,
        inStock: !!fd.get('inStock'),
        featured: !!fd.get('featured')
      };

      const saved = S.saveProduct(payload);
      if (!saved) {
        U.toast('Sous-catégorie introuvable.', 'error');
        return;
      }
      U.toast('Article enregistré.', 'success');
      ctx.navigate('#/admin?onglet=produits&sous=' + saved.subcategoryId);
    });
  }

  /* --------------------- Onglet : magasin et accès ------------------- */

  function tabStore(params) {
    const store = S.getStore();
    const editPlan = params.plan ? findPlan(store, params.plan) : null;

    const html =
      '<div class="panel">' +
      '<h2>Informations du magasin</h2>' +
      '<form id="store-form" class="form form--grid">' +
      logoField(store) +
      '<label>Nom<input type="text" name="name" value="' + h(store.name) + '" required></label>' +
      '<label>Accroche<input type="text" name="tagline" value="' + h(store.tagline) + '"></label>' +
      '<label>Adresse<input type="text" name="address" value="' + h(store.address) + '"></label>' +
      '<label>Code postal<input type="text" name="postalCode" value="' + h(store.postalCode) + '"></label>' +
      '<label>Ville<input type="text" name="city" value="' + h(store.city) + '"></label>' +
      '<label>Pays<input type="text" name="country" value="' + h(store.country) + '"></label>' +
      '<label>Téléphone<input type="text" name="phone" value="' + h(store.phone) + '"></label>' +
      '<label>E-mail<input type="email" name="email" value="' + h(store.email) + '"></label>' +
      '<label>Latitude<input type="number" step="0.000001" name="lat" value="' + h(store.lat) + '"></label>' +
      '<label>Longitude<input type="number" step="0.000001" name="lng" value="' + h(store.lng) + '"></label>' +
      '<label class="wide">Description de la boutique<textarea name="about" rows="4">' +
      h(store.about) + '</textarea><span class="field__hint">Affichée sur l’accueil et sur la ' +
      'page « La boutique ».</span></label>' +
      '<label class="wide">Histoire de la boutique<textarea name="history" rows="9">' +
      h(store.history || '') + '</textarea><span class="field__hint">Affichée en bas de la page ' +
      '« La boutique ». Laissez une ligne vide entre deux paragraphes. Videz le champ pour ' +
      'masquer la section.</span></label>' +
      '<label class="wide">Marques en boutique<textarea name="brands" rows="3" ' +
      'placeholder="Carhartt, Obey, Vans…">' + h((store.brands || []).join(', ')) +
      '</textarea><span class="field__hint">Séparées par des virgules. Laisser vide pour masquer ' +
      'la section.</span></label>' +
      '<div class="field wide"><span class="field__label">Réseaux sociaux</span>' +
      '<div id="social-rows">' +
      ((store.social || []).length
        ? store.social.map(socialRow).join('')
        : socialRow({ label: '', url: '' })) +
      '</div>' +
      '<p class="field__hint"><button type="button" class="chip" id="social-add">' +
      '+ Ajouter un réseau</button></p>' +
      '</div>' +
      '<div class="field wide"><span class="field__label">Horaires</span>' +
      '<div class="hours-edit">' +
      store.hours
        .map(function (row, i) {
          return (
            '<div class="hours-edit__row">' +
            '<input type="text" value="' + h(row.day) + '" data-hour-day="' + i + '">' +
            '<input type="text" value="' + h(row.value) + '" data-hour-value="' + i + '">' +
            '</div>'
          );
        })
        .join('') +
      '</div></div>' +
      '<div class="form__actions wide"><button type="submit" class="btn btn--primary">Enregistrer</button></div>' +
      '</form>' +
      '</div>' +

      '<div class="panel">' +
      '<h2>' + (editPlan ? 'Modifier le plan d’accès' : 'Ajouter un plan d’accès') + '</h2>' +
      '<form id="plan-form" class="form form--grid">' +
      '<input type="hidden" name="id" value="' + h(editPlan ? editPlan.id : '') + '">' +
      '<label class="small">Icône<input type="text" name="icon" maxlength="4" value="' +
      h(editPlan ? editPlan.icon : '📍') + '"></label>' +
      '<label>Titre<input type="text" name="title" required value="' +
      h(editPlan ? editPlan.title : '') + '"></label>' +
      '<label class="wide">Résumé<input type="text" name="summary" value="' +
      h(editPlan ? editPlan.summary : '') + '"></label>' +
      '<label class="wide">Étapes (une par ligne)<textarea name="steps" rows="4">' +
      h(editPlan ? (editPlan.steps || []).join('\n') : '') + '</textarea></label>' +
      '<div class="form__actions wide">' +
      '<button type="submit" class="btn btn--primary">' + (editPlan ? 'Enregistrer' : 'Ajouter') + '</button>' +
      (editPlan ? '<a class="btn btn--ghost" href="#/admin?onglet=magasin">Annuler</a>' : '') +
      '</div>' +
      '</form>' +
      '</div>' +

      '<div class="panel">' +
      '<h2>Plans d’accès publiés</h2>' +
      '<ul class="plan-list">' +
      store.access
        .map(function (plan) {
          return (
            '<li>' +
            '<span class="plan-list__title">' + h(plan.icon) + ' ' + h(plan.title) + '</span>' +
            '<span class="plan-list__summary">' + h(plan.summary) + '</span>' +
            '<span class="plan-list__tools">' +
            '<a class="btn btn--tiny btn--ghost" href="#/admin?onglet=magasin&plan=' + h(plan.id) + '">Modifier</a>' +
            '<button type="button" class="btn btn--tiny btn--danger-ghost" data-del-plan="' + h(plan.id) +
            '">Supprimer</button>' +
            '</span>' +
            '</li>'
          );
        })
        .join('') +
      (!store.access.length ? '<li class="muted">Aucun plan d’accès.</li>' : '') +
      '</ul>' +
      '<p><a class="btn btn--ghost btn--small" href="#/acces">Voir la page publique</a></p>' +
      '</div>';

    return {
      html: html,
      mount: function (root, ctx) {
        const storeForm = U.el('#store-form', root);

        // Logo : import d'un fichier, puis retrait éventuel.
        U.el('#logo-file', storeForm).addEventListener('change', function (event) {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          U.readLogoFile(file, 400)
            .then(function (dataUrl) {
              S.updateStore({ logo: dataUrl });
              U.toast('Logo mis à jour.', 'success');
              ctx.rerender();
            })
            .catch(function (err) {
              U.toast(err.message || 'Image invalide.', 'error');
            });
        });

        const logoRemove = U.el('#logo-remove', storeForm);
        if (logoRemove) {
          logoRemove.addEventListener('click', function () {
            if (!window.confirm('Retirer le logo ? Le monogramme sera réaffiché.')) return;
            S.updateStore({ logo: '' });
            U.toast('Logo retiré.', 'success');
            ctx.rerender();
          });
        }

        const socialRows = U.el('#social-rows', storeForm);
        U.el('#social-add', storeForm).addEventListener('click', function () {
          socialRows.insertAdjacentHTML('beforeend', socialRow({ label: '', url: '' }));
        });
        socialRows.addEventListener('click', function (event) {
          const btn = event.target.closest('[data-social-remove]');
          if (!btn) return;
          const row = btn.closest('.social-row');
          if (row) row.remove();
        });

        storeForm.addEventListener('submit', function (event) {
          event.preventDefault();
          const fd = new FormData(storeForm);
          const hours = S.getStore().hours.map(function (row, i) {
            return {
              day: U.el('[data-hour-day="' + i + '"]', storeForm).value,
              value: U.el('[data-hour-value="' + i + '"]', storeForm).value
            };
          });
          const social = U.els('.social-row', storeForm)
            .map(function (row) {
              return {
                label: String(U.el('[data-social-label]', row).value || '').trim(),
                url: String(U.el('[data-social-url]', row).value || '').trim()
              };
            })
            .filter(function (s) {
              return s.label && s.url;
            });
          S.updateStore({
            name: String(fd.get('name') || '').trim(),
            tagline: String(fd.get('tagline') || '').trim(),
            address: String(fd.get('address') || '').trim(),
            postalCode: String(fd.get('postalCode') || '').trim(),
            city: String(fd.get('city') || '').trim(),
            country: String(fd.get('country') || '').trim(),
            phone: String(fd.get('phone') || '').trim(),
            email: String(fd.get('email') || '').trim(),
            lat: Number(fd.get('lat')) || 0,
            lng: Number(fd.get('lng')) || 0,
            about: String(fd.get('about') || '').trim(),
            history: String(fd.get('history') || '').trim(),
            logoInitials: String(fd.get('logoInitials') || '').trim().toUpperCase(),
            hours: hours,
            brands: U.parseList(fd.get('brands')),
            social: social
          });
          U.toast('Informations du magasin enregistrées.', 'success');
          ctx.rerender();
        });

        const planForm = U.el('#plan-form', root);
        planForm.addEventListener('submit', function (event) {
          event.preventDefault();
          const fd = new FormData(planForm);
          S.saveAccessPlan({
            id: String(fd.get('id') || '') || null,
            icon: String(fd.get('icon') || '📍').trim(),
            title: String(fd.get('title') || '').trim(),
            summary: String(fd.get('summary') || '').trim(),
            steps: String(fd.get('steps') || '')
              .split('\n')
              .map(function (s) {
                return s.trim();
              })
              .filter(Boolean)
          });
          U.toast('Plan d’accès enregistré.', 'success');
          ctx.navigate('#/admin?onglet=magasin');
        });

        U.els('[data-del-plan]', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (!window.confirm('Supprimer ce plan d’accès ?')) return;
            S.deleteAccessPlan(btn.getAttribute('data-del-plan'));
            U.toast('Plan supprimé.', 'success');
            ctx.rerender();
          });
        });
      }
    };
  }

  // Bloc « Logo » : aperçu, import d'une image, et monogramme de repli.
  function logoField(store) {
    const initials = store.logoInitials || 'GL';
    return (
      '<div class="field wide logo-field">' +
      '<span class="field__label">Logo de la boutique</span>' +
      '<div class="logo-edit">' +
      '<div class="logo-edit__preview">' +
      (store.logo
        ? '<img src="' + h(store.logo) + '" alt="Logo actuel">'
        : '<span class="brand__mark">' + h(initials) + '</span>') +
      '</div>' +
      '<div class="logo-edit__tools">' +
      '<label class="btn btn--small btn--ghost">' +
      (store.logo ? 'Remplacer le logo' : 'Importer un logo') +
      '<input type="file" id="logo-file" accept="image/*" hidden></label>' +
      (store.logo
        ? '<button type="button" class="btn btn--small btn--danger-ghost" id="logo-remove">' +
          'Retirer le logo</button>'
        : '') +
      '<label class="logo-edit__initials">Monogramme de repli' +
      '<input type="text" name="logoInitials" maxlength="3" value="' + h(initials) + '"></label>' +
      '<p class="field__hint">PNG, JPEG ou SVG. La transparence est conservée et l’image est ' +
      'réduite à 400 px. Sans logo, le monogramme est affiché. Le logo sert aussi d’icône ' +
      'd’onglet du navigateur.</p>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function socialRow(social) {
    return (
      '<div class="social-row">' +
      '<input type="text" value="' + h(social.label || '') + '" placeholder="Instagram" data-social-label>' +
      '<input type="url" value="' + h(social.url || '') + '" placeholder="https://…" data-social-url>' +
      '<button type="button" class="btn btn--tiny btn--danger-ghost" data-social-remove>Retirer</button>' +
      '</div>'
    );
  }

  function findPlan(store, id) {
    return (
      store.access.filter(function (p) {
        return p.id === id;
      })[0] || null
    );
  }

  /* -------------------------- Onglet : textes ------------------------ */

  function tabTexts() {
    const current = S.getTexts();
    const defaults = D.defaultTexts();

    const html =
      '<div class="panel">' +
      '<h2>Textes du site</h2>' +
      '<p class="muted">Tous les libellés affichés aux visiteurs. Un champ vidé reprend ' +
      'automatiquement son texte d’origine.</p>' +
      '<form id="texts-form" class="form">' +
      D.TEXT_GROUPS.map(function (group) {
        return (
          '<fieldset class="texts-group">' +
          '<legend>' + h(group.label) + '</legend>' +
          group.keys
            .map(function (entry) {
              const value = current[entry.key];
              const modified = value !== defaults[entry.key];
              return (
                '<label class="texts-row' + (modified ? ' is-modified' : '') + '">' +
                '<span class="texts-row__label">' + h(entry.label) +
                (modified ? ' <em>modifié</em>' : '') + '</span>' +
                (entry.long
                  ? '<textarea name="' + h(entry.key) + '" rows="3">' + h(value) + '</textarea>'
                  : '<input type="text" name="' + h(entry.key) + '" value="' + h(value) + '">') +
                '</label>'
              );
            })
            .join('') +
          '</fieldset>'
        );
      }).join('') +
      '<div class="form__actions">' +
      '<button type="submit" class="btn btn--primary">Enregistrer les textes</button>' +
      '<button type="button" class="btn btn--danger-ghost" id="texts-reset">' +
      'Tout remettre à l’origine</button>' +
      '</div>' +
      '</form>' +
      '</div>';

    return {
      html: html,
      mount: function (root, ctx) {
        const form = U.el('#texts-form', root);
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          const values = {};
          U.els('[name]', form).forEach(function (field) {
            const value = String(field.value || '').trim();
            // Un champ vidé revient au texte d'origine.
            values[field.name] = value || defaults[field.name] || '';
          });
          S.saveTexts(values);
          U.toast('Textes enregistrés.', 'success');
          ctx.rerender();
        });

        U.el('#texts-reset', root).addEventListener('click', function () {
          if (!window.confirm('Remettre tous les textes du site à leur version d’origine ?')) return;
          S.resetTexts();
          U.toast('Textes réinitialisés.', 'success');
          ctx.rerender();
        });
      }
    };
  }

  /* ------------------------- Onglet : sécurité ----------------------- */

  function tabSecurity() {
    const info = S.adminInfo();
    return {
      html:
        '<div class="panel panel--narrow">' +
        '<h2>Changer le code administrateur</h2>' +
        '<p class="muted">L’ancien code est toujours demandé. Il n’existe aucune récupération : ' +
        'conservez le nouveau code en lieu sûr.</p>' +
        changeCodeForm('Changer le code') +
        '<ul class="checklist">' +
        '<li>Dernière modification : ' +
        (info.updatedAt ? h(U.formatDate(info.updatedAt)) : 'jamais') + '.</li>' +
        '<li>Compte créé le ' + h(U.formatDate(info.createdAt)) + '.</li>' +
        '<li>Le code est stocké haché (SHA-256 + sel aléatoire), jamais en clair.</li>' +
        '</ul>' +
        '<p class="warn"><b>À savoir :</b> cette application fonctionne entièrement dans le ' +
        'navigateur. Le code protège l’accès à l’interface de gestion sur cet appareil ; il ne ' +
        'remplace pas l’authentification d’un serveur.</p>' +
        '</div>',
      mount: function (root, ctx) {
        bindChangeCode(root, ctx);
      }
    };
  }

  /* -------------------------- Onglet : données ----------------------- */

  function tabData() {
    const st = S.stats();
    return {
      html:
        '<div class="panel">' +
        '<h2>Exporter</h2>' +
        '<p class="muted">Sauvegarde complète du catalogue, des avis et des informations du ' +
        'magasin (' + st.products + ' articles).</p>' +
        '<button type="button" class="btn btn--primary" id="data-export">Télécharger la sauvegarde JSON</button>' +
        '</div>' +
        '<div class="panel">' +
        '<h2>Importer</h2>' +
        '<p class="muted">Remplace l’intégralité des données actuelles par le contenu du fichier.</p>' +
        '<label class="btn btn--ghost">Choisir un fichier JSON' +
        '<input type="file" id="data-import" accept="application/json,.json" hidden></label>' +
        '</div>' +
        '<div class="panel">' +
        '<h2>Réinitialiser</h2>' +
        '<p class="muted">Restaure le catalogue d’origine. Le code administrateur n’est ' +
        'pas modifié.</p>' +
        '<button type="button" class="btn btn--danger-ghost" id="data-reset">Réinitialiser le catalogue</button>' +
        '<hr>' +
        '<p class="muted">Réinitialisation totale : catalogue <em>et</em> code administrateur ' +
        '(retour au code par défaut, à changer à la connexion suivante).</p>' +
        '<button type="button" class="btn btn--danger-ghost" id="data-reset-all">Tout réinitialiser</button>' +
        '</div>',
      mount: function (root, ctx) {
        U.el('#data-export', root).addEventListener('click', function () {
          const blob = new Blob([S.exportData()], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'globo-loco-shop-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 1000);
        });

        U.el('#data-import', root).addEventListener('change', function (event) {
          const file = event.target.files && event.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function () {
            const result = S.importData(String(reader.result));
            if (!result.ok) {
              U.toast(result.error, 'error');
              return;
            }
            U.toast('Données importées.', 'success');
            ctx.rerender();
          };
          reader.readAsText(file);
        });

        U.el('#data-reset', root).addEventListener('click', function () {
          if (!window.confirm('Restaurer le catalogue d’origine ? Vos modifications seront perdues.'))
            return;
          S.resetCatalog();
          U.toast('Catalogue réinitialisé.', 'success');
          ctx.rerender();
        });

        U.el('#data-reset-all', root).addEventListener('click', function () {
          if (
            !window.confirm(
              'Tout réinitialiser ?\nLe catalogue ET le code administrateur reviendront à leur ' +
                'état d’origine. Cette action est irréversible.'
            )
          )
            return;
          S.resetAll();
          window.location.hash = '#/';
          window.location.reload();
        });
      }
    };
  }

  return { view: view };
})(GLS_UTILS, GLS_STORE, GLS_DATA);
