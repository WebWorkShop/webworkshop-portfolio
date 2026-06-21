/* WebWorkShop Portfolio — standalone runtime
   Reimplements the behaviours the claude.ai/design support.js provided:
   loader, three.js floating spheres, scroll waves, scroll-in animations,
   count-up numbers, the password gate, and style-hover / style-focus. */
(function () {
  'use strict';

  /* ---------- loader ---------- */
  function hideLoader() {
    var MIN = 1500;
    setTimeout(function () {
      var el = document.getElementById('loader');
      if (!el) return;
      el.style.opacity = '0';
      setTimeout(function () { el.style.display = 'none'; }, 650);
    }, MIN);
  }

  /* ---------- scroll waves ---------- */
  function initWaves() {
    var waves = Array.prototype.slice.call(document.querySelectorAll('[data-wave]'));
    if (!waves.length) return;
    var queued = false;
    function update() {
      queued = false;
      var vh = window.innerHeight || 800;
      waves.forEach(function (el) {
        var isTop = el.getAttribute('data-wave') === 'top';
        var path = el.querySelector('path');
        if (!path) return;
        var r = el.getBoundingClientRect();
        var prog = ((r.top + r.height / 2) / vh - 0.5) * 2;
        prog = Math.max(-1.3, Math.min(1.3, prog));
        var slope = prog * 46 * (isTop ? 1 : -1);
        var y1 = (50 - slope).toFixed(1);
        var y2 = (50 + slope).toFixed(1);
        path.setAttribute('d', isTop
          ? 'M0,' + y1 + ' L1440,' + y2 + ' L1440,100 L0,100 Z'
          : 'M0,' + y1 + ' L1440,' + y2 + ' L1440,0 L0,0 Z');
      });
    }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- scroll-in animations + count-up ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-countup') || el.textContent, 10) || 0;
    var dur = 1100, start = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    }
    requestAnimationFrame(tick);
  }

  function initScrollAnims() {
    var doc = document;

    // pop cards
    var cards = Array.prototype.slice.call(doc.querySelectorAll('[data-anim="pop"]'));
    cards.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.65s cubic-bezier(.2,.7,.2,1)';
      el.style.willChange = 'opacity, transform';
    });
    var popIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, i = 0;
        if (el.parentElement) i = Array.prototype.indexOf.call(el.parentElement.children, el);
        setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, Math.max(0, i) * 100);
        popIO.unobserve(el);
      });
    }, { threshold: 0.16 });
    cards.forEach(function (el) { popIO.observe(el); });

    // roll-in logo + fadeUp label + typed name
    var rollers = Array.prototype.slice.call(doc.querySelectorAll('[data-anim="roll"]'));
    rollers.forEach(function (el) { el.style.opacity = '0'; el.style.willChange = 'transform, opacity'; });
    var label = doc.querySelector('[data-anim="fadeUp"]');
    var nameEl = doc.querySelector('[data-anim="typechars"]');
    var nameChars = nameEl ? Array.prototype.slice.call(nameEl.children) : [];
    var rollIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.style.animation = 'rollIn 2.1s cubic-bezier(.22,.7,.3,1) forwards';
        rollIO.unobserve(el);
        setTimeout(function () {
          if (label) {
            label.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            label.style.transform = 'translateY(0)';
            label.style.opacity = '1';
          }
          setTimeout(function () {
            nameChars.forEach(function (ch, i) {
              setTimeout(function () {
                ch.style.transition = 'opacity 0.18s ease';
                ch.style.opacity = '1';
              }, i * 85);
            });
          }, 520);
        }, 2150);
      });
    }, { threshold: 0.3 });
    rollers.forEach(function (el) { rollIO.observe(el); });

    // count-up
    var nums = Array.prototype.slice.call(doc.querySelectorAll('[data-countup]'));
    var numIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        numIO.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { numIO.observe(el); });
  }

  /* ---------- password gate ---------- */
  var PASSWORD = 'portfolio';
  function initGate() {
    var input = document.getElementById('pw-input');
    var btn = document.getElementById('pw-btn');
    var overlay = document.getElementById('lock-overlay');
    var content = document.getElementById('works-content');
    var error = document.getElementById('pw-error');
    if (!input || !btn) return;
    function tryUnlock() {
      var v = (input.value || '').trim().toLowerCase();
      if (v === PASSWORD) {
        if (content) content.classList.add('is-unlocked');
        if (overlay) overlay.style.display = 'none';
        if (error) error.style.display = 'none';
      } else {
        if (error) error.style.display = 'block';
      }
    }
    btn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
    input.addEventListener('input', function () { if (error) error.style.display = 'none'; });
  }

  /* ---------- three.js floating wireframe spheres ---------- */
  var ROTATE_SPEED = 1, REPEL_STRENGTH = 1;
  function waitThree() {
    if (window.THREE) initThree();
    else setTimeout(waitThree, 60);
  }
  function initThree() {
    var THREE = window.THREE;
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    var host = canvas.parentElement;
    var w = host.clientWidth, h = host.clientHeight;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    var lightDir = new THREE.Vector3(0.72, 0.86, 0.5).normalize();
    var objs = [];
    var defs = [
      { geo: new THREE.OctahedronGeometry(1.95, 0), pos: [2.4, 0.2, 0], op: 0.8, spin: [0.05, 0.13, 0.03], R: 3.4 },
      { geo: new THREE.OctahedronGeometry(0.62, 0), pos: [4.7, 1.7, -0.4], op: 0.72, spin: [0.1, 0.22, 0.06], R: 2.1 },
      { geo: new THREE.OctahedronGeometry(0.82, 0), pos: [1.0, -1.9, 0.6], op: 0.72, spin: [0.08, 0.18, 0.05], R: 2.3 }
    ];
    defs.forEach(function (d) {
      var eg = new THREE.EdgesGeometry(d.geo);
      var cnt = eg.attributes.position.count;
      eg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
      var mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: d.op });
      var mesh = new THREE.LineSegments(eg, mat);
      mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
      mesh.rotation.set(0.4, 0.6, 0);
      scene.add(mesh);
      objs.push({
        mesh: mesh, geo: eg,
        localPos: eg.attributes.position.array.slice(),
        base: new THREE.Vector3(d.pos[0], d.pos[1], d.pos[2]),
        pos: new THREE.Vector3(d.pos[0], d.pos[1], d.pos[2]),
        vel: new THREE.Vector3(),
        spin: d.spin, R: d.R
      });
    });

    var ndc = new THREE.Vector2(-10, -10);
    var mouseActive = false;
    var ray = new THREE.Raycaster();
    var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    host.addEventListener('mousemove', function (e) {
      var r = host.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      mouseActive = true;
    });
    host.addEventListener('mouseleave', function () { mouseActive = false; });

    new ResizeObserver(function () {
      var nw = host.clientWidth, nh = host.clientHeight;
      if (!nw || !nh) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    }).observe(host);

    var start = performance.now(), last = start;
    var tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), col3 = new THREE.Color();
    function animate() {
      var now = performance.now();
      var t = (now - start) * 0.001;
      var dt = Math.min(0.05, (now - last) * 0.001); last = now;

      var mouse = null;
      if (mouseActive) {
        ray.setFromCamera(ndc, camera);
        if (ray.ray.intersectPlane(plane, tmp)) mouse = tmp;
      }

      objs.forEach(function (o) {
        o.vel.x += (o.base.x - o.pos.x) * 4.2 * dt;
        o.vel.y += (o.base.y - o.pos.y) * 4.2 * dt;
        o.vel.z += (o.base.z - o.pos.z) * 4.2 * dt;
        o.vel.y += Math.sin(t * 0.6 + o.base.x) * 0.18 * dt;
        if (mouse) {
          var dx = o.pos.x - mouse.x, dy = o.pos.y - mouse.y;
          var dist = Math.hypot(dx, dy);
          if (dist < o.R && dist > 0.0001) {
            var push = (1 - dist / o.R) * 62 * REPEL_STRENGTH;
            o.vel.x += (dx / dist) * push * dt;
            o.vel.y += (dy / dist) * push * dt;
          }
        }
        o.vel.multiplyScalar(0.90);
        o.pos.addScaledVector(o.vel, dt);
        o.mesh.position.copy(o.pos);
        o.mesh.rotation.x += o.spin[0] * ROTATE_SPEED * dt;
        o.mesh.rotation.y += o.spin[1] * ROTATE_SPEED * dt;
        o.mesh.rotation.z += o.spin[2] * ROTATE_SPEED * dt;
        o.mesh.updateMatrixWorld();
        var q = o.mesh.quaternion;
        var lp = o.localPos, col = o.geo.attributes.color.array, ld = lightDir;
        for (var i = 0; i < lp.length; i += 3) {
          tmp2.set(lp[i], lp[i + 1], lp[i + 2]).normalize().applyQuaternion(q);
          var hue = Math.atan2(tmp2.y, tmp2.x) / (Math.PI * 2) + 0.5 + t * 0.05;
          hue -= Math.floor(hue);
          var k = Math.pow((tmp2.dot(ld) + 1) / 2, 0.85);
          col3.setHSL(hue, 0.85, 0.42 + k * 0.36);
          col[i] = col3.r; col[i + 1] = col3.g; col[i + 2] = col3.b;
        }
        o.geo.attributes.color.needsUpdate = true;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ---------- boot ---------- */
  function boot() {
    hideLoader();
    // Scroll-driven wave-angle animation disabled — dividers stay static.
    requestAnimationFrame(function () { requestAnimationFrame(initScrollAnims); });
    initGate();
    waitThree();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
