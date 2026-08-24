'use strict';

/* GET /works/content (rewritten to /api/works-content) — the works markup itself.
   Only ever leaves the server when the works cookie checks out. */

const fs = require('fs');
const path = require('path');
const { isUnlocked } = require('./_lib/auth.js');

const FRAGMENT = path.join(process.cwd(), 'works-private', 'content.html');

let cached = null;

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end();
    return;
  }

  if (!isUnlocked(req)) {
    res.status(401).end();
    return;
  }

  if (cached === null) {
    try {
      cached = fs.readFileSync(FRAGMENT, 'utf8');
    } catch (e) {
      res.status(500).end();
      return;
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(req.method === 'HEAD' ? '' : cached);
};
