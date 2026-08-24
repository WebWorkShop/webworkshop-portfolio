'use strict';

const crypto = require('crypto');

/** Constant-time string comparison that does not leak length via early return. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a == null ? '' : a), 'utf8');
  const bufB = Buffer.from(String(b == null ? '' : b), 'utf8');
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB) && bufA.length === bufB.length;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(function (part) {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    if (!k) return;
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch (e) {
      out[k] = part.slice(i + 1).trim();
    }
  });
  return out;
}

/** True only when the request carries the works cookie matching WORKS_KEY. */
function isUnlocked(req) {
  const key = process.env.WORKS_KEY;
  if (!key) return false;
  const cookies = parseCookies(req.headers && req.headers.cookie);
  return safeEqual(cookies.works, key);
}

const COOKIE_NAME = 'works';
const HINT_COOKIE_NAME = 'works_hint';
const MAX_AGE = 60 * 60 * 24 * 30;

module.exports = { safeEqual, parseCookies, isUnlocked, COOKIE_NAME, HINT_COOKIE_NAME, MAX_AGE };
