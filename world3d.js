/* Corewise — floating neon 3D objects + travel particle field, scroll-driven */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.152.2/three.min.js';
  const LIME = 0xc6f24e, AMBER = 0xff8a3c;

  addEventListener('load', () => {
    const s = document.createElement('script');
    s.src = THREE_SRC;
    s.onload = init;
    document.head.appendChild(s);
  });

  function init() {
    if (!window.THREE) return;
    const canvas = document.getElementById('world3d');
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return; }

    let dpr = Math.min(devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    const CAM_Z = 10;
    camera.position.z = CAM_Z;

    const lineMat = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
    const fillMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false });
    const edges = (geo, c, o = 1) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(c, o));
    const wire = (geo, c, o = 1) => new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat(c, o));

    /* ---------- object builders (all ~1 unit tall, neon wireframe) ---------- */

    function phoneObj() {
      const g = new THREE.Group();
      g.add(edges(new THREE.BoxGeometry(0.55, 1.05, 0.06), LIME));
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.9), fillMat(LIME, 0.08));
      screen.position.z = 0.035; g.add(screen);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const app = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), fillMat(r === 0 && c === 1 ? AMBER : LIME, 0.5));
        app.position.set(-0.14 + c * 0.14, 0.32 - r * 0.2, 0.04);
        g.add(app);
      }
      const orbiter = new THREE.Group();
      const neuron = wire(new THREE.IcosahedronGeometry(0.1, 1), AMBER, 0.9);
      neuron.position.x = 0.62; orbiter.add(neuron);
      g.add(orbiter);
      g.userData.tick = (t) => { orbiter.rotation.y = t * 1.2; orbiter.rotation.z = 0.5; };
      return g;
    }

    function brainObj() {
      const g = new THREE.Group();
      const outer = new THREE.IcosahedronGeometry(0.52, 1);
      g.add(wire(outer, LIME, 0.85));
      const nodes = new THREE.Points(outer, new THREE.PointsMaterial({ color: LIME, size: 0.045, transparent: true, opacity: 0.95 }));
      g.add(nodes);
      const inner = wire(new THREE.IcosahedronGeometry(0.3, 0), AMBER, 0.8);
      g.add(inner);
      g.userData.tick = (t) => {
        inner.rotation.y = -t * 0.8; inner.rotation.x = t * 0.5;
        const p = 1 + Math.sin(t * 2.2) * 0.04;
        nodes.scale.setScalar(p);
      };
      return g;
    }

    function blueprintObj() {
      const g = new THREE.Group();
      g.add(edges(new THREE.BoxGeometry(0.72, 0.72, 0.72), LIME));
      const corners = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        const c = edges(new THREE.BoxGeometry(0.13, 0.13, 0.13), AMBER, 0.9);
        c.userData.dir = new THREE.Vector3(sx, sy, sz).normalize();
        c.userData.base = new THREE.Vector3(sx, sy, sz).multiplyScalar(0.36);
        g.add(c); corners.push(c);
      }
      g.userData.tick = (t) => {
        const d = 0.1 + Math.sin(t * 1.4) * 0.09;
        corners.forEach(c => c.position.copy(c.userData.base).addScaledVector(c.userData.dir, d));
      };
      return g;
    }

    function codeObj() {
      const g = new THREE.Group();
      const chevron = (dir) => {
        const pts = [new THREE.Vector3(0.16 * dir, 0.22, 0), new THREE.Vector3(-0.16 * dir, 0, 0), new THREE.Vector3(0.16 * dir, -0.22, 0)];
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(LIME));
      };
      const l = chevron(1); l.position.x = -0.42; g.add(l);
      const r = chevron(-1); r.position.x = 0.42; g.add(r);
      const slash = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.1, 0.26, 0), new THREE.Vector3(-0.1, -0.26, 0)]), lineMat(AMBER));
      g.add(slash);
      [l, r, slash].forEach((el, i) => el.userData.ph = i * 1.1);
      g.userData.tick = (t) => { [l, r, slash].forEach(el => { el.position.y = Math.sin(t * 1.6 + el.userData.ph) * 0.06; }); };
      g.scale.setScalar(1.5);
      return g;
    }

    function micObj() {
      const g = new THREE.Group();
      const head = wire(new THREE.SphereGeometry(0.22, 8, 6), LIME, 0.9);
      head.position.y = 0.28; g.add(head);
      const body = edges(new THREE.CylinderGeometry(0.09, 0.07, 0.42, 8), LIME);
      body.position.y = -0.06; g.add(body);
      const waves = [];
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, 0.34 + i * 0.14, 0.34 + i * 0.14, -0.7, 0.7).getPoints(24).map(p => new THREE.Vector3(p.x, p.y, 0))
        ), lineMat(AMBER, 0.7));
        w.position.set(0.05, 0.28, 0); w.userData.ph = i * 0.9;
        g.add(w); waves.push(w);
      }
      g.userData.tick = (t) => waves.forEach(w => { w.material.opacity = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.8 - w.userData.ph)); });
      return g;
    }

    function rocketObj() {
      const g = new THREE.Group();
      const nose = edges(new THREE.ConeGeometry(0.16, 0.3, 8), AMBER);
      nose.position.y = 0.35; g.add(nose);
      const body = edges(new THREE.CylinderGeometry(0.16, 0.19, 0.45, 8), LIME);
      body.position.y = -0.02; g.add(body);
      for (let i = 0; i < 3; i++) {
        const fin = edges(new THREE.BoxGeometry(0.02, 0.18, 0.14), LIME, 0.8);
        const a = i * Math.PI * 2 / 3;
        fin.position.set(Math.cos(a) * 0.2, -0.26, Math.sin(a) * 0.2);
        fin.rotation.y = -a; g.add(fin);
      }
      const exN = 40, exPos = new Float32Array(exN * 3);
      const exGeo = new THREE.BufferGeometry();
      exGeo.setAttribute('position', new THREE.BufferAttribute(exPos, 3));
      const exhaust = new THREE.Points(exGeo, new THREE.PointsMaterial({ color: AMBER, size: 0.035, transparent: true, opacity: 0.85 }));
      g.add(exhaust);
      g.userData.tick = (t) => {
        for (let i = 0; i < exN; i++) {
          const life = (t * 0.9 + i / exN) % 1;
          exPos[i * 3] = Math.sin(i * 12.9) * 0.06 * life;
          exPos[i * 3 + 1] = -0.32 - life * 0.5;
          exPos[i * 3 + 2] = Math.cos(i * 7.7) * 0.06 * life;
        }
        exGeo.attributes.position.needsUpdate = true;
        g.position.y += 0; g.rotation.z = Math.sin(t * 1.1) * 0.06;
      };
      return g;
    }

    function pcbObj() {
      const g = new THREE.Group();
      const grid = new THREE.Group();
      for (let i = -2; i <= 2; i++) {
        const h = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.6, i * 0.3, 0), new THREE.Vector3(0.6, i * 0.3, 0)]), lineMat(LIME, 0.22));
        const v = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 0.3, -0.6, 0), new THREE.Vector3(i * 0.3, 0.6, 0)]), lineMat(LIME, 0.22));
        grid.add(h, v);
      }
      g.add(grid);
      const tracePts = [new THREE.Vector3(-0.6, -0.45, 0.01), new THREE.Vector3(-0.3, -0.45, 0.01), new THREE.Vector3(-0.3, 0, 0.01), new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(0, 0.3, 0.01), new THREE.Vector3(0.45, 0.3, 0.01), new THREE.Vector3(0.45, 0.55, 0.01)];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tracePts), lineMat(AMBER, 0.9)));
      const chip = edges(new THREE.BoxGeometry(0.28, 0.28, 0.07), LIME);
      chip.position.z = 0.04; g.add(chip);
      const chip2 = edges(new THREE.BoxGeometry(0.16, 0.16, 0.05), AMBER, 0.9);
      chip2.position.set(-0.42, 0.36, 0.03); g.add(chip2);
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), fillMat(AMBER, 1));
      g.add(pulse);
      const curve = new THREE.CatmullRomCurve3(tracePts);
      g.userData.tick = (t) => { pulse.position.copy(curve.getPoint((t * 0.25) % 1)); };
      g.rotation.x = -0.5;
      g.scale.setScalar(1.6);
      return g;
    }

    /* ---------- particle travel field ---------- */
    const P = 650, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 44;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 2] = -4 - Math.random() * 20;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: LIME, size: 0.05, transparent: true, opacity: 0.32, sizeAttenuation: true }));
    scene.add(particles);
    const pA = 90, paGeo = new THREE.BufferGeometry(), paPos = new Float32Array(pA * 3);
    for (let i = 0; i < pA; i++) {
      paPos[i * 3] = (Math.random() - 0.5) * 44;
      paPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
      paPos[i * 3 + 2] = -4 - Math.random() * 20;
    }
    paGeo.setAttribute('position', new THREE.BufferAttribute(paPos, 3));
    scene.add(new THREE.Points(paGeo, new THREE.PointsMaterial({ color: AMBER, size: 0.06, transparent: true, opacity: 0.3 })));

    /* ---------- anchor objects to their slots ---------- */
    const builders = { phone: phoneObj, brain: brainObj, blueprint: blueprintObj, code: codeObj, mic: micObj, rocket: rocketObj, pcb: pcbObj };
    /* spin = free rotation (symmetric objects); sway = oscillate around front face */
    const ROT = { phone: 'sway', brain: 'spin', blueprint: 'spin', code: 'sway', mic: 'sway', rocket: 'sway', pcb: 'sway' };
    const anchors = [];
    document.querySelectorAll('[data-obj]').forEach(host => {
      const build = builders[host.dataset.obj];
      const slot = host.querySelector('.obj-slot');
      if (!build || !slot) return;
      const obj = build();
      obj.visible = false;
      obj.scale.setScalar(0.0001);
      scene.add(obj);
      const a = { host, slot, obj, cur: 0, spin: 0, hover: 0, phase: Math.random() * 6.28 };
      host.addEventListener('mouseenter', () => a.hover = 1);
      host.addEventListener('mouseleave', () => a.hover = 0);
      anchors.push(a);
    });

    /* ---------- scroll + mouse state ---------- */
    let scrollV = 0, lastY = scrollY, mx = 0, my = 0;
    addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    const worldPerPx = () => (2 * Math.tan(camera.fov * Math.PI / 360) * CAM_Z) / innerHeight;

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    /* ---------- main loop ---------- */
    const clock = new THREE.Clock();
    let frames = 0, slowFrames = 0, degraded = false, lastTick = 0;

    const tick = () => {
      lastTick = performance.now();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      const v = (scrollY - lastY); lastY = scrollY;
      scrollV += (v - scrollV) * Math.min(1, dt * 8);

      /* travel feel: particles slide opposite scroll, streak with velocity */
      particles.position.y = (particles.position.y + scrollV * 0.012) % 26;
      particles.rotation.z += dt * 0.006;

      camera.position.x += (mx * 0.35 - camera.position.x) * dt * 2;
      camera.position.y += (-my * 0.25 - camera.position.y) * dt * 2;
      camera.lookAt(0, 0, 0);

      const ppu = worldPerPx();
      for (const a of anchors) {
        const r = a.slot.getBoundingClientRect();
        const inView = r.bottom > -140 && r.top < innerHeight + 140;
        const target = inView ? 1 : 0;
        a.cur += (target - a.cur) * Math.min(1, dt * 5);
        if (a.cur < 0.01) { a.obj.visible = false; continue; }
        a.obj.visible = true;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        a.obj.position.x = (cx - innerWidth / 2) * ppu;
        a.obj.position.y = -(cy - innerHeight / 2) * ppu + Math.sin(t * 1.2 + a.phase) * 0.05;
        const base = Math.min(r.height, 190) * ppu * 0.95;
        a.obj.scale.setScalar(base * (0.6 + 0.4 * a.cur));
        a.spin += (a.hover * 2.4 - a.spin) * dt * 3;
        if (ROT[a.host.dataset.obj] === 'spin') {
          a.obj.rotation.y = t * 0.45 + scrollY * 0.0018 + a.phase + a.spin;
        } else {
          a.obj.rotation.y = Math.sin(t * 0.6 + a.phase) * 0.5 + scrollV * 0.004 + a.spin * 0.5;
        }
        a.obj.rotation.x = Math.sin(t * 0.7 + a.phase) * 0.1 + scrollV * 0.0012;
        if (a.obj.userData.tick) a.obj.userData.tick(t);
      }

      renderer.render(scene, camera);

      /* perf guard: too many slow frames → drop DPR once */
      if (!degraded && ++frames <= 240) {
        if (dt > 0.03) slowFrames++;
        if (frames === 240 && slowFrames > 90) {
          degraded = true;
          renderer.setPixelRatio(1);
        }
      }
    };

    renderer.setAnimationLoop(tick);
    /* battery-saver / throttled-rAF safety: keep rendering on scroll */
    addEventListener('scroll', () => { if (performance.now() - lastTick > 250) tick(); }, { passive: true });

    canvas.classList.add('on');
    document.documentElement.classList.add('w3d-on');
    window.__w3d = { anchors, renderer, fps: () => 1 / clock.getDelta() };
  }
})();
