'use strict';

/* GET /works/assets/<file> (rewritten to /api/works-asset?f=<file>) — gated images.
   Anything that is not an authenticated request for a known file is a plain 404,
   so no browser auth dialog is ever triggered and nothing is leaked by the status. */

const fs = require('fs');
const path = require('path');
const { isUnlocked } = require('./_lib/auth.js');

const ASSET_DIR = path.join(process.cwd(), 'works-private', 'assets');
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml'
};

function notFound(res) {
  res.status(404).end();
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'private, max-age=600, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'GET' && req.method !== 'HEAD') return notFound(res);
  if (!isUnlocked(req)) return notFound(res);

  const raw = req.query && req.query.f;
  const name = Array.isArray(raw) ? raw[0] : raw;
  if (typeof name !== 'string' || !SAFE_NAME.test(name) || name.indexOf('..') !== -1) {
    return notFound(res);
  }

  const ext = path.extname(name).toLowerCase();
  const type = TYPES[ext];
  if (!type) return notFound(res);

  const file = path.join(ASSET_DIR, name);
  if (path.dirname(file) !== ASSET_DIR) return notFound(res);

  let stat;
  try {
    stat = fs.statSync(file);
  } catch (e) {
    return notFound(res);
  }
  if (!stat.isFile()) return notFound(res);

  res.setHeader('Content-Type', type);
  res.setHeader('Content-Length', String(stat.size));
  if (req.method === 'HEAD') {
    res.status(200).end();
    return;
  }
  res.status(200);
  fs.createReadStream(file).pipe(res);
};
