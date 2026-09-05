#!/usr/bin/env node
/* =========================================================================
   Globo Loco Shop — Construction de la version « page hébergée »
   -------------------------------------------------------------------------
   Certains hébergeurs de page fournissent eux-mêmes l'enveloppe du document
   (doctype, <html>, <head>, <body>) et n'acceptent que le contenu. Ce script
   produit exactement cela : le titre, le style, le contenu du <body> et les
   scripts, sans balises d'enveloppe.

   Usage :  node tools/build-artifact.js [fichier-de-sortie]
   Défaut :  dist/globo-loco-shop.page.html
   ========================================================================= */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const output = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'dist', 'globo-loco-shop.page.html');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

const index = read('index.html');

function extract(pattern, label) {
  const match = index.match(pattern);
  if (!match) {
    console.error('Introuvable dans index.html : ' + label);
    process.exit(1);
  }
  return match[1];
}

// Nom court de la page hébergée. Il sert d'identité dans la galerie de
// l'hébergeur ; le titre de l'onglet, lui, est fixé au chargement par app.js.
const title = 'Maquette Globo Loco';
const body = extract(/<body>([\s\S]*?)<\/body>/, 'le contenu du body');

// Feuille de style et scripts, dans l'ordre de déclaration d'index.html.
const styles = Array.from(index.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)).map(
  function (m) {
    return read(m[1]);
  }
);
const scripts = Array.from(index.matchAll(/<script src="([^"]+)"><\/script>/g)).map(function (m) {
  return read(m[1]);
});

// Le contenu du body est repris sans ses balises <script src>, remplacées
// plus bas par le code lui-même.
const markup = body.replace(/[ \t]*<script src="[^"]+"><\/script>\n?/g, '').trim();

const page =
  '<title>' + title + '</title>\n\n' +
  '<style>\n' + styles.join('\n') + '\n</style>\n\n' +
  markup + '\n\n' +
  scripts
    .map(function (code) {
      return '<script>\n' + code + '\n</script>';
    })
    .join('\n\n') +
  '\n';

// Balises d'enveloppe interdites. Le motif exige un séparateur après le nom,
// sans quoi « <header » serait pris pour « <head ».
const envelope = page.match(/<!DOCTYPE|<\/?(?:html|head|body)(?=[\s>])/i);
if (envelope) {
  console.error('Balise d’enveloppe présente dans la sortie : ' + envelope[0]);
  process.exit(1);
}
if (/(?:src|href)="assets\//.test(page)) {
  console.error('Référence externe non inlinée dans la sortie.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, page, 'utf8');
console.log('Écrit : ' + output + ' (' + Math.round(page.length / 1024) + ' Ko)');
