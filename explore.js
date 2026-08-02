/* RoomExplorer — 360° VR room exploration with content hotspots.
   Usage: RoomExplorer.open({ title, pano, hotspots:[{yaw,pitch,title,text,link,linkLabel}] })
   yaw: degrees 0..360 (0 = pano center), pitch: degrees -85..85 (up positive). */
(() => {
  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.min.js';
  let three = null;
  const loadThree = () => new Promise(res => {
    if (window.THREE) return res();
    const s = document.createElement('script');
    s.src = THREE_SRC; s.onload = () => res(); document.head.appendChild(s);
  });

  let ui = null, renderer = null, scene = null, camera = null, rafId = 0;
  let lon = 0, lat = 0, fov = 78, dragging = false, px = 0, py = 0, vlon = 0, vlat = 0;
  let gyroOn = false, gyroBase = null, spots = [];

  function buildUI() {
    ui = document.createElement('div');
    ui.className = 'rx';
    ui.innerHTML =
      '<canvas class="rx-canvas"></canvas>' +
      '<div class="rx-top">' +
        '<span class="rx-title"></span>' +
        '<span class="rx-actions">' +
          '<button class="rx-gyro" title="ג\'ירוסקופ">🧭</button>' +
          '<button class="rx-exit" title="חזרה לסיור">✕</button>' +
        '</span>' +
      '</div>' +
      '<div class="rx-hint">גררו כדי להסתכל סביב · לחצו על הנקודות</div>' +
      '<div class="rx-spots"></div>' +
      '<div class="rx-card" hidden><button class="rx-card__close">✕</button><img class="rx-card__img" alt="" hidden><h3></h3><p></p><a target="_blank" rel="noopener" hidden></a></div>' +
      '<div class="rx-load">טוען חדר…</div>';
    document.body.appendChild(ui);

    ui.querySelector('.rx-exit').addEventListener('click', close);
    ui.querySelector('.rx-card__close').addEventListener('click', () => card(false));
    ui.querySelector('.rx-gyro').addEventListener('click', toggleGyro);

    const cv = ui.querySelector('.rx-canvas');
    const start = (x, y) => { dragging = true; px = x; py = y; };
    const move = (x, y) => {
      if (!dragging) return;
      vlon = (px - x) * 0.16; vlat = (y - py) * 0.16;
      lon += vlon; lat = Math.max(-80, Math.min(80, lat + vlat));
      px = x; py = y;
    };
    cv.addEventListener('pointerdown', e => { start(e.clientX, e.clientY); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => move(e.clientX, e.clientY));
    cv.addEventListener('pointerup', () => dragging = false);
    cv.addEventListener('pointercancel', () => dragging = false);
    ui.addEventListener('wheel', e => { fov = Math.max(55, Math.min(95, fov + e.deltaY * 0.04)); }, { passive: true });
    addEventListener('keydown', escClose);
  }

  function escClose(e) { if (e.key === 'Escape') close(); }

  function card(show, h) {
    const c = ui.querySelector('.rx-card');
    if (!show) { c.hidden = true; return; }
    c.querySelector('h3').textContent = h.title;
    c.querySelector('p').textContent = h.text || '';
    const im = c.querySelector('.rx-card__img');
    if (h.img) { im.src = h.img; im.hidden = false; } else { im.hidden = true; im.removeAttribute('src'); }
    const a = c.querySelector('a');
    if (h.link) { a.href = h.link; a.textContent = h.linkLabel || 'פתחו ←'; a.hidden = false; }
    else a.hidden = true;
    c.hidden = false;
  }

  function toggleGyro() {
    if (gyroOn) { gyroOn = false; gyroBase = null; ui.querySelector('.rx-gyro').classList.remove('on'); return; }
    const enable = () => {
      gyroOn = true; ui.querySelector('.rx-gyro').classList.add('on');
      addEventListener('deviceorientation', onGyro);
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission)
      DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') enable(); }).catch(() => {});
    else enable();
  }
  function onGyro(e) {
    if (!gyroOn || e.alpha == null) return;
    if (!gyroBase) gyroBase = { a: e.alpha, b: e.beta };
    lon = (gyroBase.a - e.alpha);
    lat = Math.max(-80, Math.min(80, (e.beta - gyroBase.b) * -1 + 0));
  }

  function open(room) {
    loadThree().then(() => {
      if (!ui) buildUI();
      ui.classList.add('rx-on');
      document.documentElement.classList.add('rx-lock');
      ui.querySelector('.rx-title').textContent = room.title || '';
      ui.querySelector('.rx-load').style.display = 'grid';
      card(false);
      lon = 0; lat = 0; fov = innerWidth < 861 ? 86 : 78;

      const cv = ui.querySelector('.rx-canvas');
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(innerWidth, innerHeight);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 110);

      new THREE.TextureLoader().load(room.pano, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const geo = new THREE.SphereGeometry(60, 72, 52);
        geo.scale(-1, 1, 1);
        scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })));
        ui.querySelector('.rx-load').style.display = 'none';
      });

      /* hotspot DOM */
      const layer = ui.querySelector('.rx-spots');
      layer.innerHTML = '';
      spots = (room.hotspots || []).map(h => {
        const d = document.createElement('button');
        d.className = 'rx-spot';
        d.innerHTML = '<i></i><span>' + h.title + '</span>';
        d.addEventListener('click', () => card(true, h));
        layer.appendChild(d);
        const yaw = THREE.MathUtils.degToRad(h.yaw || 0);
        const pitch = THREE.MathUtils.degToRad(h.pitch || 0);
        const v = new THREE.Vector3(
          Math.cos(pitch) * Math.sin(yaw),
          Math.sin(pitch),
          -Math.cos(pitch) * Math.cos(yaw)
        ).multiplyScalar(55);
        return { el: d, v };
      });

      const onResize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
      };
      addEventListener('resize', onResize);
      ui._onResize = onResize;

      const tick = () => {
        rafId = requestAnimationFrame(tick);
        if (!dragging && !gyroOn) { lon += 0.015; } /* idle slow orbit */
        camera.fov += (fov - camera.fov) * 0.12; camera.updateProjectionMatrix();
        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);
        camera.lookAt(
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi),
          -Math.sin(phi) * Math.cos(theta)
        );
        renderer.render(scene, camera);
        const half = { w: innerWidth / 2, h: innerHeight / 2 };
        for (const s of spots) {
          const p = s.v.clone().project(camera);
          const behind = p.z > 1;
          s.el.style.display = behind ? 'none' : 'flex';
          if (!behind) {
            s.el.style.left = (p.x * half.w + half.w) + 'px';
            s.el.style.top = (-p.y * half.h + half.h) + 'px';
          }
        }
      };
      tick();
    });
  }

  function close() {
    if (!ui) return;
    cancelAnimationFrame(rafId);
    if (ui._onResize) removeEventListener('resize', ui._onResize);
    removeEventListener('deviceorientation', onGyro);
    gyroOn = false; gyroBase = null;
    if (renderer) { renderer.dispose(); renderer = null; }
    scene = null; camera = null;
    ui.classList.remove('rx-on');
    document.documentElement.classList.remove('rx-lock');
  }

  window.RoomExplorer = { open, close };
})();
