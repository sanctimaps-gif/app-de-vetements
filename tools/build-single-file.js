#!/usr/bin/env node
/* =========================================================================
   Globo Loco Shop — Construction de la version « un seul fichier »
   -------------------------------------------------------------------------
   Assemble index.html, la feuille de style et les scripts en un unique
   fichier HTML autonome, qu'il suffit d'ouvrir d'un double-clic ou
   d'envoyer par mail. Aucune dépendance.

   Usage :  node tools/build-single-file.js
   Sortie :  globo-loco-shop.html
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'globo-loco-shop.html');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

let html = read('index.html');

// 1. Feuille de style : <link rel="stylesheet" href="..."> → <style>…</style>
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (match, href) {
  return '<style>\n' + read(href) + '\n    </style>';
});

// 2. Scripts : <script src="..."></script> → <script>…</script>
//    On passe par une fonction de remplacement : le code peut contenir des
//    séquences ($&, $1…) que String.replace interpréterait autrement.
html = html.replace(/<script src="([^"]+)"><\/script>/g, function (match, src) {
  return '<script>\n' + read(src) + '\n    </script>';
});

// 3. Repère de version, utile quand le fichier circule par mail.
html = html.replace(
  '</head>',
  '  <meta name="generator" content="Globo Loco Shop — fichier unique, généré le ' +
    new Date().toISOString().slice(0, 10) +
    '">\n  </head>'
);

const remaining = html.match(/(?:src|href)="assets\//g);
if (remaining) {
  console.error('Références externes non inlinées : ' + remaining.join(', '));
  process.exit(1);
}

fs.writeFileSync(output, html, 'utf8');
console.log(
  'Écrit : ' + path.relative(root, output) + ' (' + Math.round(html.length / 1024) + ' Ko)'
);
