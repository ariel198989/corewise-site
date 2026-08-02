/* Corewise World — free-roam 360 campus walk with an avatar companion.
   No scroll. You stand in a room, look around, and walk through doors. */
(() => {
  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.min.js';
  const WA = 'https://wa.me/972507594477';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let CFG = null, ROOMS = {}, cur = null;
  let renderer, scene, camera, sphereA, sphereB, rafId;
  let lon = 0, lat = 0, fov = 78, drag = false, px = 0, py = 0;
  let gyro = false, gbase = null, spots = [], doors = [], busy = false;
  let el = {}, avatar = 'male';

  const $ = (s, r = document) => r.querySelector(s);
  const deg = d => d * Math.PI / 180;

  /* ---------- boot ---------- */
  fetch('tour-content.json?v=' + Date.now()).then(r => r.json()).then(cfg => {
    CFG = cfg;
    cfg.departments.forEach(d => ROOMS[d.id] = d);
    buildDOM();
    loadThree().then(() => { intro(); });
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
      <div class="cw-avatar"><img alt=""></div>
      <div class="cw-spots"></div>
      <div class="cw-veil"></div>
      <header class="cw-top">
        <span class="cw-brand">corewise</span>
        <span class="cw-room"></span>
        <span class="cw-tools">
          <button class="cw-gyro" title="ג'ירוסקופ">🧭</button>
          <button class="cw-map" title="מפת הקמפוס">🗺️</button>
        </span>
      </header>
      <div class="cw-hint">גררו כדי להסתכל סביב · לכו דרך הדלתות</div>
      <a class="cw-wa" href="${WA}" target="_blank" rel="noopener" title="השאירו פרטים בוואטסאפ">
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.9.9.9-4.8-.3-.4C5 17.8 4.4 16 4.4 15 4.4 8.9 9.9 4.4 16 4.4S27.6 8.9 27.6 15 22.1 24.8 16 24.8zm6.5-8.3c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2-.2.4-.9 1.1-1.1 1.3-.2.2-.4.2-.8.1-2.1-.9-3.5-2.7-3.7-3.1-.2-.4 0-.6.2-.8l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.6-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.1 3.5 1.4 3.5.9 4.1.9.6-.1 2.1-.8 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.7-.5z"/></svg>
        <span>השאירו פרטים</span>
      </a>
      <div class="cw-card" hidden><button class="cw-card__x">✕</button><img hidden alt=""><h3></h3><p></p><a target="_blank" rel="noopener" hidden></a></div>
      <div class="cw-mapui" style="display:none"><div class="cw-mapui__in"><h3>מפת הקמפוס</h3><div class="cw-mapui__grid"></div><button class="cw-mapui__x">סגירה</button></div></div>
      <div class="cw-intro">
        <div class="cw-intro__in">
          <span class="cw-intro__brand">corewise</span>
          <h1>ברוכים הבאים לקמפוס</h1>
          <p>בחרו דמות והתחילו לטייל בין המחלקות שלנו — בלי גלילה, פשוט הולכים.</p>
          <div class="cw-pick">
            <button data-a="male"><img src="avatars/male.webp" alt=""><span>אורח</span></button>
            <button data-a="female"><img src="avatars/female.webp" alt=""><span>אורחת</span></button>
          </div>
          <button class="cw-start">התחילו את הסיור ←</button>
        </div>
      </div>
      <div class="cw-load" hidden><span></span></div>`;
    document.body.appendChild(root);
    el = {
      root, canvas: $('.cw-canvas', root), spots: $('.cw-spots', root), veil: $('.cw-veil', root),
      room: $('.cw-room', root), hint: $('.cw-hint', root), card: $('.cw-card', root),
      avatar: $('.cw-avatar img', root), avatarBox: $('.cw-avatar', root),
      intro: $('.cw-intro', root), load: $('.cw-load', root), mapui: $('.cw-mapui', root),
    };

    $('.cw-card__x', root).onclick = () => el.card.hidden = true;
    $('.cw-gyro', root).onclick = toggleGyro;
    $('.cw-map', root).onclick = () => openMap(true);
    $('.cw-mapui__x', root).onclick = () => openMap(false);
    root.querySelectorAll('.cw-pick button').forEach(b => b.onclick = () => {
      avatar = b.dataset.a;
      root.querySelectorAll('.cw-pick button').forEach(x => x.classList.toggle('on', x === b));
    });
    root.querySelector('.cw-pick button').classList.add('on');
    $('.cw-start', root).onclick = start;

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
    addEventListener('keydown', e => {
      if (e.key === 'Escape') { el.card.hidden = true; openMap(false); }
      if (e.key === 'ArrowLeft') lon += 6;
      if (e.key === 'ArrowRight') lon -= 6;
    });
    addEventListener('resize', onResize);
  }

  function start() {
    el.avatar.src = 'avatars/' + avatar + '.webp';
    el.intro.classList.add('gone');
    setTimeout(() => el.intro.remove(), 700);
    initGL();
    go('lobby', true);
  }
  function intro() { /* three ready; intro already visible */ }

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
  function doorsFor(id) {
    if (id === 'lobby') {
      const others = ORDER.filter(x => x !== 'lobby');
      const span = 300 / (others.length - 1);
      return others.map((to, i) => ({ to, yaw: -150 + i * span, pitch: -6 }));
    }
    const i = ORDER.indexOf(id);
    const out = [{ to: 'lobby', yaw: 180, pitch: -6, label: 'חזרה ללובי' }];
    if (i > 1) out.push({ to: ORDER[i - 1], yaw: -110, pitch: -6 });
    if (i < ORDER.length - 1) out.push({ to: ORDER[i + 1], yaw: 60, pitch: -6, next: true });
    return out;
  }

  /* Walk the avatar toward a door: turn to face it, stride away, shrink into the distance. */
  function walkTo(doorYaw, done) {
    if (reduce) { done(); return; }
    const box = el.avatarBox;
    /* how far off-centre the door is → which way the avatar drifts */
    let rel = ((doorYaw - lon) % 360 + 540) % 360 - 180;   /* -180..180 */
    const dx = Math.max(-1, Math.min(1, rel / 60));         /* screen-x drift */
    box.classList.remove('walk');
    box.classList.add('walking');
    box.style.setProperty('--dx', dx.toFixed(2));
    /* camera eases toward the door while he walks */
    const lon0 = lon, t0 = performance.now(), dur = 2000;
    const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      lon = lon0 + rel * ease(k) * 0.75;
      if (k < 1) requestAnimationFrame(step);
      else { box.classList.remove('walking'); done(); }
    };
    requestAnimationFrame(step);
  }

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
    cur = id;
    el.load.hidden = true;
    el.room.textContent = d.title;
    lat = 0; lon = 0;
    buildMarkers(d);
    busy = false;
    el.avatarBox.classList.remove('walk'); void el.avatarBox.offsetWidth; el.avatarBox.classList.add('walk');
    el.hint.classList.toggle('show', id === 'lobby');
  }

  function buildMarkers(d) {
    el.spots.innerHTML = '';
    spots = []; doors = [];
    (d.hotspots || []).forEach(h => {
      const b = document.createElement('button');
      b.className = 'cw-spot';
      b.innerHTML = '<i></i><span>' + h.title + '</span>';
      b.onclick = () => card(h);
      el.spots.appendChild(b);
      spots.push({ el: b, v: vec(h.yaw, h.pitch) });
    });
    doorsFor(d.id).forEach(dr => {
      const t = ROOMS[dr.to];
      const b = document.createElement('button');
      b.className = 'cw-door' + (dr.next ? ' is-next' : '');
      b.innerHTML = '<span class="cw-door__l">' + (dr.label || t.title) + '</span><i class="cw-door__a">↓</i>';
      b.onclick = () => go(dr.to, false, dr.yaw);
      el.spots.appendChild(b);
      doors.push({ el: b, v: vec(dr.yaw, dr.pitch) });
    });
  }
  const vec = (yaw, pitch) => {
    const y = deg(yaw || 0), p = deg(pitch || 0);
    return new THREE.Vector3(Math.cos(p) * Math.sin(y), Math.sin(p), -Math.cos(p) * Math.cos(y)).multiplyScalar(52);
  };

  function card(h) {
    const c = el.card;
    c.querySelector('h3').textContent = h.title;
    c.querySelector('p').textContent = h.text || '';
    const im = c.querySelector('img');
    if (h.img) { im.src = h.img; im.hidden = false; } else { im.hidden = true; im.removeAttribute('src'); }
    const a = c.querySelector('a');
    if (h.link) { a.href = h.link; a.textContent = h.linkLabel || 'פתחו ←'; a.hidden = false; } else a.hidden = true;
    c.hidden = false;
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
