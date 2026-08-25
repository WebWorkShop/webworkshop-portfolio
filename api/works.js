'use strict';

/* POST /api/works — exchanges the viewing code for an httpOnly cookie.
   Never returns anything about the works themselves. */

const { safeEqual, COOKIE_NAME, HINT_COOKIE_NAME, MAX_AGE } = require('./_lib/auth.js');

const FAIL_DELAY_MS = 300;

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
  }
  return new Promise(function (resolve) {
    let raw = '';
    req.on('data', function (chunk) {
      raw += chunk;
      if (raw.length > 4096) { raw = raw.slice(0, 4096); }
    });
    req.on('end', function () {
      try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); }
    });
    req.on('error', function () { resolve({}); });
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false });
    return;
  }

  // Trim the configured values: a viewing code never meaningfully starts or ends
  // with whitespace, and a stray newline from pasting one into the dashboard would
  // otherwise reject every correct entry.
  const expected = (process.env.WORKS_PASSWORD || '').trim();
  const key = (process.env.WORKS_KEY || '').trim();
  if (!expected || !key) {
    // Distinct from 401 so a missing environment variable is not mistaken for a
    // wrong code. Says nothing about the code itself.
    res.status(503).json({ ok: false, error: 'not_configured' });
    return;
  }

  const body = await readBody(req);
  const password = typeof body.password === 'string' ? body.password.trim() : '';

  if (!safeEqual(password, expected)) {
    await sleep(FAIL_DELAY_MS);
    res.status(401).json({ ok: false });
    return;
  }

  const common = 'Path=/; Max-Age=' + MAX_AGE + '; SameSite=Lax; Secure';
  res.setHeader('Set-Cookie', [
    COOKIE_NAME + '=' + encodeURIComponent(key) + '; HttpOnly; ' + common,
    // Non-secret marker so the page knows whether it is worth asking for the content.
    HINT_COOKIE_NAME + '=1; ' + common
  ]);
  res.status(200).json({ ok: true });
};
