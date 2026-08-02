/* Corewise World — free-roam 360 campus.
   No scroll: you stand in a room, look around, and walk through doors. */
(() => {
  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.min.js';
  const WA = 'https://wa.me/972507594477';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let CFG = null, ROOMS = {}, cur = null;
  let renderer, scene, camera, sphereA, sphereB, rafId;
  let lon = 0, lat = 0, fov = 78, drag = false, px = 0, py = 0;
  let gyro = false, gbase = null, spots = [], doors = [], busy = false;
  let el = {};

  const $ = (s, r = document) => r.querySelector(s);
  const deg = d => d * Math.PI / 180;

  /* ---------- boot ---------- */
  fetch('tour-content.json?v=' + Date.now()).then(r => r.json()).then(cfg => {
    CFG = cfg;
    cfg.departments.forEach(d => ROOMS[d.id] = d);
    buildDOM();
    loadThree().then(start);
  });

  const loadThree = () => new Promise(res => {
    if (window.THREE) return res();
    const s = document.createElement('script'); s.src = THREE_SRC; s.onload = () => res(); document.head.appendChild(s);
  });

  /* ---------- DOM ---------- */
  function buildDOM() {
    const root = document.createElement('div');
    root.className = 'cw';
    root.innerHTML = `
      <canvas class="cw-canvas"></canvas>
      <div class="cw-spots"></div>
      <div class="cw-veil"></div>
      <div class="cw-motes"></div>
      <div class="cw-title"><span></span></div>
      <header class="cw-top">
        <span class="cw-brand">corewise</span>
        <span class="cw-room"></span>
        <span class="cw-prog"></span>
        <span class="cw-tools">
          <button class="cw-gyro" title="ג'ירוסקופ">🧭</button>
          <button class="cw-map" title="מפת הקמפוס">🗺️</button>
        </span>
      </header>
      <div class="cw-hint">גררו או ← → כדי להסתכל · ↑ כדי ללכת קדימה</div>
      <div class="cw-pad">
        <button data-k="left" aria-label="שמאלה">←</button>
        <button data-k="up" class="cw-pad__up" aria-label="קדימה">↑</button>
        <button data-k="right" aria-label="ימינה">→</button>
      </div>
      <div class="cw-compass"><div class="cw-compass__ring"></div></div>
      <a class="cw-wa" href="${WA}" target="_blank" rel="noopener" title="השאירו פרטים בוואטסאפ">
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.9.9.9-4.8-.3-.4C5 17.8 4.4 16 4.4 15 4.4 8.9 9.9 4.4 16 4.4S27.6 8.9 27.6 15 22.1 24.8 16 24.8zm6.5-8.3c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.2-.8.1-2.1-.9-3.5-2.7-3.7-3.1-.2-.4 0-.6.2-.8l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.6-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.1 3.5 1.4 3.5.9 4.1.9.6-.1 2.1-.8 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.7-.5z"/></svg>
        <span>השאירו פרטים</span>
      </a>
      <div class="cw-card" hidden></div>
      <div class="cw-finale" hidden></div>
      <div class="cw-mapui" style="display:none"><div class="cw-mapui__in"><h3>מפת הקמפוס</h3><div class="cw-mapui__grid"></div><button class="cw-mapui__x">סגירה</button></div></div>
      <div class="cw-load"><span></span></div>`;
    document.body.appendChild(root);
    el = {
      root, canvas: $('.cw-canvas', root), spots: $('.cw-spots', root), veil: $('.cw-veil', root), title: $('.cw-title', root), motes: $('.cw-motes', root),
      room: $('.cw-room', root), prog: $('.cw-prog', root), hint: $('.cw-hint', root), card: $('.cw-card', root), finale: $('.cw-finale', root),
 load: $('.cw-load', root), mapui: $('.cw-mapui', root),
    };

    $('.cw-gyro', root).onclick = toggleGyro;
    $('.cw-map', root).onclick = () => openMap(true);
    $('.cw-mapui__x', root).onclick = () => openMap(false);

    /* look controls */
    const c = el.canvas;
    c.addEventListener('pointerdown', e => { drag = true; px = e.clientX; py = e.clientY; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => {
      if (!drag) return;
      lon += (px - e.clientX) * 0.17; lat = Math.max(-70, Math.min(70, lat + (e.clientY - py) * 0.17));
      px = e.clientX; py = e.clientY;
    });
    c.addEventListener('pointerup', () => drag = false);
    c.addEventListener('pointercancel', () => drag = false);
    addEventListener('wheel', e => { fov = Math.max(58, Math.min(92, fov + e.deltaY * 0.04)); }, { passive: true });
    const K = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { el.card.hidden = true; el.finale.hidden = true; openMap(false); return; }
      const k = K[e.key] || K[e.key.toLowerCase()];
      if (k) { keys[k] = true; keys.shift = e.shiftKey; e.preventDefault(); }
    });
    addEventListener('keyup', e => {
      const k = K[e.key] || K[e.key.toLowerCase()];
      if (k) { keys[k] = false; keys.shift = e.shiftKey; }
    });
    addEventListener('blur', () => { keys.left = keys.right = keys.up = keys.down = false; });
    /* on-screen pad (mobile + mouse) */
    const pad = $('.cw-pad', root);
    pad.querySelectorAll('button').forEach(b => {
      const k = b.dataset.k;
      const on = e => { e.preventDefault(); keys[k] = true; };
      const off = () => keys[k] = false;
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
    pump();
    addEventListener('resize', onResize);
  }

  function start() {
    seedMotes();
    initGL();
    go("lobby", true);
  }

  /* ---------- GL ---------- */
  function initGL() {
    renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 120);
    const geo = new THREE.SphereGeometry(60, 72, 52); geo.scale(-1, 1, 1);
    sphereA = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true }));
    sphereB = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    scene.add(sphereA); scene.add(sphereB);
    tick();
  }
  function onResize() {
    if (!renderer) return;
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  function tick() {
    rafId = requestAnimationFrame(tick);
    if (!drag && !gyro && !busy) lon += 0.012;
    camera.fov += (fov - camera.fov) * 0.1; camera.updateProjectionMatrix();
    const phi = deg(90 - lat), th = deg(lon);
    camera.lookAt(Math.sin(phi) * Math.sin(th), Math.cos(phi), -Math.sin(phi) * Math.cos(th));
    renderer.render(scene, camera);
    project();
    if (el.motes) el.motes.style.transform = 'translate3d(' + (-lon * 0.55 % 100).toFixed(1) + 'px,' + (lat * 0.5).toFixed(1) + 'px,0)';
    if (compassDots.length) {
      compassDots.forEach(c => {
        const rel = ((c.yaw - lon) % 360 + 540) % 360 - 180;
        c.el.style.transform = 'translate(-50%,-50%) rotate(' + rel + 'deg) translateY(-26px)';
        c.el.classList.toggle('near', Math.abs(rel) < 26);
      });
    }
  }
  let compassDots = [];
  function buildCompass(id) {
    const ring = $('.cw-compass__ring', el.root);
    ring.innerHTML = '';
    compassDots = [];
    if (id !== 'lobby') { el.root.querySelector('.cw-compass').style.display = 'none'; return; }
    el.root.querySelector('.cw-compass').style.display = 'block';
    WINGS.forEach(w => {
      const d = document.createElement('i');
      d.className = 'cw-compass__d';
      d.title = ROOMS[w].title;
      ring.appendChild(d);
      compassDots.push({ el: d, yaw: BEARING[w] });
    });
  }
  function project() {
    const hw = innerWidth / 2, hh = innerHeight / 2;
    for (const s of spots.concat(doors)) {
      const p = s.v.clone().project(camera);
      const back = p.z > 1;
      s.el.style.display = back ? 'none' : 'flex';
      if (!back) { s.el.style.left = (p.x * hw + hw) + 'px'; s.el.style.top = (-p.y * hh + hh) + 'px'; }
    }
  }

  /* ---------- rooms ---------- */
  const ORDER = ['lobby', 'video', 'apps', 'ai', 'stage', 'school', 'team'];
  /* The lobby is a hub: the 6 departments ring it, each at its own compass bearing.
     Turn in the lobby and you face a different department's door. */
  const WINGS = ['video', 'apps', 'ai', 'stage', 'school', 'team'];
  const BEARING = {};                       /* room -> yaw of its door, seen from the lobby */
  WINGS.forEach((id, i) => BEARING[id] = -150 + i * 60);   /* -150,-90,-30,30,90,150 */

  function doorsFor(id) {
    if (id === 'lobby') {
      return WINGS.map(to => ({ to, yaw: BEARING[to], pitch: -6 }));
    }
    /* inside a wing: the way back to the lobby sits opposite its own bearing,
       and the two neighbouring wings are reachable to either side. */
    const i = WINGS.indexOf(id);
    const prev = WINGS[(i - 1 + WINGS.length) % WINGS.length];
    const next = WINGS[(i + 1) % WINGS.length];
    return [
      { to: 'lobby', yaw: 180, pitch: -6, label: '← חזרה ללובי', home: true },
      { to: prev, yaw: -75, pitch: -6 },
      { to: next, yaw: 75, pitch: -6, next: true },
    ];
  }

  /* Walk toward a door: first TURN to face it, then walk straight ahead into it. */
  function walkTo(doorYaw, done) {
    if (reduce) { done(); return; }
    const lon0 = lon;
    const rel = ((doorYaw - lon0) % 360 + 540) % 360 - 180;   /* signed turn needed */
    const TURN = Math.min(900, 260 + Math.abs(rel) * 4);      /* longer turn for wider angles */
    const WALK = 2200;
    const easeIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const t0 = performance.now();

    /* phase 1: pivot the view to face the door */

    const turn = () => {
      const k = Math.min(1, (performance.now() - t0) / TURN);
      lon = lon0 + rel * easeIO(k);            /* face the door fully */
      if (k < 1) return requestAnimationFrame(turn);
      lon = lon0 + rel;
      const t1 = performance.now();
      const fov0 = fov;
      const fwd = () => {
        const k2 = Math.min(1, (performance.now() - t1) / WALK);
        fov = fov0 - 12 * easeIO(k2);          /* world creeps closer as he advances */
        if (k2 < 1) return requestAnimationFrame(fwd);
        fov = fov0;
        done();
      };
      requestAnimationFrame(fwd);
    };
    requestAnimationFrame(turn);
  }

  /* ---------- keyboard / on-screen movement (game style) ---------- */
  const keys = {};
  function nearestDoor() {
    let best = null, bestAbs = 999;
    doors.forEach((d, i) => {
      const yaw = doorYaws[i];
      const rel = Math.abs(((yaw - lon) % 360 + 540) % 360 - 180);
      if (rel < bestAbs) { bestAbs = rel; best = d; }
    });
    return bestAbs < 34 ? best : null;   /* only if you're actually facing it */
  }
  function pump() {
    requestAnimationFrame(pump);
    if (busy || !cur) return;
    const sp = (keys.shift ? 2.4 : 1.35);
    if (keys.left) lon += sp;
    if (keys.right) lon -= sp;
    if (keys.up) { fov = Math.max(58, fov - 0.55); }
    else if (keys.down) { fov = Math.min(92, fov + 0.55); }
    /* holding forward while facing a door walks you through it */
    if (keys.up) {
      const d = nearestDoor();
      if (d) { fwdHold += 1; if (fwdHold > 34) { fwdHold = 0; d.el.click(); } }
      else fwdHold = 0;
    } else fwdHold = 0;
  }
  let fwdHold = 0, doorYaws = [];

  function go(id, first, doorYaw) {
    if (busy || !ROOMS[id]) return;
    busy = true;
    const d = ROOMS[id];
    el.card.hidden = true;
    if (!first && doorYaw != null) { walkTo(doorYaw, () => enter(id, d, first)); return; }
    enter(id, d, first);
  }

  function enter(id, d, first) {
    el.load.hidden = false;
    new THREE.TextureLoader().load('world2-build/pano_' + id + '.webp', tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      if (first) {
        sphereA.material.map = tex; sphereA.material.opacity = 1; sphereA.material.needsUpdate = true;
        finish(id, d);
      } else {
        sphereB.material.map = tex; sphereB.material.opacity = 0; sphereB.material.needsUpdate = true;
        el.veil.classList.add('on');           /* walk-forward feel */
        const t0 = performance.now(), dur = reduce ? 1 : 700;
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / dur);
          sphereB.material.opacity = k; sphereA.material.opacity = 1 - k;
          fov = 78 - 14 * Math.sin(k * Math.PI);   /* push in, ease out */
          if (k < 1) requestAnimationFrame(step);
          else {
            const tmp = sphereA; sphereA = sphereB; sphereB = tmp;
            sphereB.material.map = null;
            el.veil.classList.remove('on');
            fov = 78;
            finish(id, d);
          }
        };
        requestAnimationFrame(step);
      }
    }, undefined, () => { busy = false; el.load.hidden = true; });
  }

  function finish(id, d) {
    const from = cur;
    cur = id;
    el.load.hidden = true;
    el.room.textContent = d.title;
    lat = 0;
    /* keep your bearings: entering a wing you face into it; returning to the
       lobby you arrive looking back at the door you came out of. */
    lon = (id === 'lobby' && from && BEARING[from] != null) ? BEARING[from] : 0;
    visited.add(id);
    buildMarkers(d);
    buildCompass(id);
    paintProgress();
    if (id === 'team') showFinale();
    busy = false;
    el.hint.classList.toggle('show', id === 'lobby');
    announce(d.title);
  }

  const seen = new Set(), visited = new Set();   /* discovered hotspots + rooms walked */

  /* The last wing closes the loop: what you saw, then three ways to start talking. */
  function showFinale() {
    const rooms = visited.size, found = seen.size;
    const line = 'ביקרת ב-' + rooms + ' מחלקות וגילית ' + found + ' נקודות בקמפוס.';
    const paths = [
      ['💡', 'יש לי רעיון למוצר', 'היי, סיירתי בקמפוס Corewise ויש לי רעיון למוצר — אשמח לדבר'],
      ['🏫', 'אני מבית ספר', 'היי, סיירתי בקמפוס Corewise — אשמח לשמוע על תוכניות AI ואלקטרוניקה לבית הספר שלנו'],
      ['🎤', 'רוצה הרצאה/סדנה', 'היי, סיירתי בקמפוס Corewise — אשמח לפרטים על הרצאה או סדנה לארגון שלנו'],
    ];
    const box = el.finale;
    box.innerHTML =
      '<button class="cw-fin__x" aria-label="סגירה">✕</button>' +
      '<span class="cw-fin__eyebrow">סוף הסיור</span>' +
      '<h3>נעים להכיר 👋</h3>' +
      '<p>' + line + ' מכאן זה כבר תלוי בכם — במה נתחיל?</p>' +
      '<div class="cw-fin__paths">' + paths.map(p =>
        '<a href="https://wa.me/972507594477?text=' + encodeURIComponent(p[2]) + '" target="_blank" rel="noopener">' +
        '<b>' + p[0] + '</b><span>' + p[1] + '</span></a>').join('') + '</div>';
    box.querySelector('.cw-fin__x').onclick = () => box.hidden = true;
    box.hidden = false;
  }
  function roomProgress(d) {
    const list = d.hotspots || [];
    const got = list.filter(h => seen.has(d.id + '|' + h.title)).length;
    return { got, total: list.length };
  }
  function paintProgress() {
    const d = ROOMS[cur]; if (!d) return;
    const { got, total } = roomProgress(d);
    el.prog.textContent = total ? 'גילית ' + got + ' מתוך ' + total : '';
    el.prog.classList.toggle('done', total > 0 && got === total);
    /* completing a room lights the way onward */
    el.root.classList.toggle('room-done', total > 0 && got === total);
  }

  function buildMarkers(d) {
    el.spots.innerHTML = '';
    spots = []; doors = [];
    (d.hotspots || []).forEach(h => {
      const kind = h.kind || 'story';
      const b = document.createElement('button');
      const key = d.id + '|' + h.title;
      b.className = 'cw-spot is-' + kind + (seen.has(key) ? ' is-seen' : '');
      b.style.setProperty('--ph', (Math.random() * 2).toFixed(2) + 's');   /* breathe out of sync */
      if (kind === 'product' && h.img) {
        b.innerHTML = '<span class="cw-spot__frame"><img src="' + h.img + '" alt="" decoding="async">' +
          '<span class="cw-spot__tag">' + h.title + '</span></span>';
      } else {
        b.innerHTML = '<i></i><span>' + h.title + '</span>';
      }
      b.onclick = () => { seen.add(key); b.classList.add('is-seen'); paintProgress(); card(h); };
      el.spots.appendChild(b);
      spots.push({ el: b, v: vec(h.yaw, h.pitch) });
    });
    doorYaws = [];
    doorsFor(d.id).forEach(dr => {
      doorYaws.push(dr.yaw);
      const t = ROOMS[dr.to];
      const b = document.createElement('button');
      b.className = 'cw-door' + (dr.next ? ' is-next' : '') + (dr.home ? ' is-home' : '');
      b.innerHTML = '<span class="cw-door__l">' + (dr.label || t.title) + '</span><i class="cw-door__a">' + (dr.home ? '⌂' : '↓') + '</i>';
      b.onclick = () => go(dr.to, false, dr.yaw);
      el.spots.appendChild(b);
      doors.push({ el: b, v: vec(dr.yaw, dr.pitch) });
    });
  }
  const vec = (yaw, pitch) => {
    const y = deg(yaw || 0), p = deg(pitch || 0);
    return new THREE.Vector3(Math.cos(p) * Math.sin(y), Math.sin(p), -Math.cos(p) * Math.cos(y)).multiplyScalar(52);
  };

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  function card(h) {
    const c = el.card, kind = h.kind || 'story';
    c.className = 'cw-card is-' + kind;
    c.innerHTML =
      '<button class="cw-card__x" aria-label="סגירה">✕</button>' +
      '<span class="cw-card__grab" aria-hidden="true"></span>' +
      (h.img ? '<img src="' + h.img + '" alt="" decoding="async">' : '') +
      '<div class="cw-card__body">' +
        (kind === 'product' ? '<span class="cw-card__kind">מוצר שבנינו</span>' : '') +
        '<h3>' + esc(h.title) + '</h3>' +
        (h.text ? '<p>' + esc(h.text) + '</p>' : '') +
        (h.metrics && h.metrics.length ? '<div class="cw-metrics">' + h.metrics.map(m =>
          '<div><b>' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></div>').join('') + '</div>' : '') +
        (h.tech && h.tech.length ? '<div class="cw-tech">' + h.tech.map(t =>
          '<span>' + esc(t) + '</span>').join('') + '</div>' : '') +
        (h.quote ? '<blockquote class="cw-quote">' + esc(h.quote) + '</blockquote>' : '') +
        (h.link ? '<a class="cw-card__cta" href="' + h.link + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.9.9.9-4.8-.3-.4C5 17.8 4.4 16 4.4 15 4.4 8.9 9.9 4.4 16 4.4S27.6 8.9 27.6 15 22.1 24.8 16 24.8z"/></svg>' +
          esc(h.linkLabel || 'השאירו פרטים ונשלח לכם לינק') + '</a>' : '') +
      '</div>';
    c.querySelector('.cw-card__x').onclick = () => c.hidden = true;
    c.hidden = false;
    /* mobile: allow swipe-down dismiss like a native sheet */
    let sy = null;
    c.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; sy = e.clientY; });
    c.addEventListener('pointerup', e => { if (sy != null && e.clientY - sy > 70) c.hidden = true; sy = null; });
  }

  function announce(name) {
    const t = el.title, s = t.firstElementChild;
    s.textContent = name;
    t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
    clearTimeout(announce._t);
    announce._t = setTimeout(() => t.classList.remove('on'), 2400);
  }
  function seedMotes() {
    if (reduce) return;
    const n = innerWidth < 861 ? 14 : 26;
    el.motes.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const m = document.createElement('i');
      m.style.left = (Math.random() * 100).toFixed(1) + '%';
      m.style.top = (Math.random() * 100).toFixed(1) + '%';
      m.style.setProperty('--s', (Math.random() * 2 + 1.4).toFixed(1) + 'px');
      m.style.setProperty('--d', (Math.random() * 9 + 9).toFixed(1) + 's');
      m.style.animationDelay = '-' + (Math.random() * 10).toFixed(1) + 's';
      el.motes.appendChild(m);
    }
  }

  function openMap(show) {
    if (!show) { el.mapui.style.display = 'none'; return; }
    if (!cur) return;
    const g = $('.cw-mapui__grid', el.root);
    g.innerHTML = ORDER.map(id => `<button data-r="${id}"${id === cur ? ' class="on"' : ''}>${ROOMS[id].title}</button>`).join('');
    g.querySelectorAll('button').forEach(b => b.onclick = () => { openMap(false); go(b.dataset.r); });
    el.mapui.style.display = 'grid';
  }

  function toggleGyro() {
    const btn = $('.cw-gyro', el.root);
    if (gyro) { gyro = false; gbase = null; btn.classList.remove('on'); removeEventListener('deviceorientation', onGyro); return; }
    const on = () => { gyro = true; btn.classList.add('on'); addEventListener('deviceorientation', onGyro); };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission)
      DeviceOrientationEvent.requestPermission().then(s => s === 'granted' && on()).catch(() => {});
    else on();
  }
  function onGyro(e) {
    if (!gyro || e.alpha == null) return;
    if (!gbase) gbase = { a: e.alpha, b: e.beta };
    lon = gbase.a - e.alpha;
    lat = Math.max(-70, Math.min(70, -(e.beta - gbase.b)));
  }
})();
