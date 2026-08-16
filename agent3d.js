/* The Corewise agent, in three dimensions.
 *
 * A 36MB Meshy export is not a mascot, it is a download. This ships 297KB:
 * 8.8k triangles, one 768px colour map, positions and normals quantised to
 * int16 under KHR_mesh_quantization. That last choice is why there is a
 * hand-written loader here instead of GLTFLoader: quantised accessors are
 * just normalised integer BufferAttributes, which three reads natively, so
 * the whole thing costs one fetch and no CDN modules. Meshopt would have been
 * 50KB smaller and would have cost two.
 *
 * He lives in his own small canvas in the corner rather than in the hall's
 * sphere, so he is never occluded by a screen, never fights the panorama for
 * depth, and costs nothing when the tab is hidden.
 */
(() => {
  const MODEL = 'axis/agent.glb';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- a minimal GLB reader ----------
     One mesh, one material, one texture, no skinning, no animation. Anything
     more than that and this would be the wrong tool. */
  const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
  const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

  function parseGLB(buf) {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not a glb');
    let off = 12, json = null, bin = null;
    while (off < dv.byteLength) {
      const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true);
      const body = buf.slice(off + 8, off + 8 + len);
      if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(body));
      if (type === 0x004E4942) bin = body;
      off += 8 + len + ((4 - (len % 4)) % 4);
    }
    return { json, bin };
  }

  function readAccessor(j, bin, i) {
    const a = j.accessors[i], bv = j.bufferViews[a.bufferView];
    const T = COMP[a.componentType], n = SIZE[a.type];
    const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    if (bv.byteStride && bv.byteStride !== n * T.BYTES_PER_ELEMENT) {
      /* interleaved: walk it out into a tight array, because three would
         otherwise need an InterleavedBuffer per attribute for no gain here */
      const out = new T(a.count * n), stride = bv.byteStride / T.BYTES_PER_ELEMENT;
      const all = new T(bin, base - (base % T.BYTES_PER_ELEMENT), Math.floor((bv.byteLength - (a.byteOffset || 0)) / T.BYTES_PER_ELEMENT));
      for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = all[k * stride + c];
      return { array: out, itemSize: n, normalized: !!a.normalized };
    }
    return { array: new T(bin, base, a.count * n), itemSize: n, normalized: !!a.normalized };
  }

  async function loadModel(THREE) {
    const buf = await fetch(MODEL).then(r => {
      if (!r.ok) throw new Error('model ' + r.status);
      return r.arrayBuffer();
    });
    const { json: j, bin } = parseGLB(buf);
    const prim = j.meshes[0].primitives[0];
    const g = new THREE.BufferGeometry();
    const put = (name, acc) => {
      const d = readAccessor(j, bin, acc);
      g.setAttribute(name, new THREE.BufferAttribute(d.array, d.itemSize, d.normalized));
    };
    put('position', prim.attributes.POSITION);
    if (prim.attributes.NORMAL != null) put('normal', prim.attributes.NORMAL);
    if (prim.attributes.TEXCOORD_0 != null) put('uv', prim.attributes.TEXCOORD_0);
    if (prim.indices != null) {
      const d = readAccessor(j, bin, prim.indices);
      g.setIndex(new THREE.BufferAttribute(d.array, 1));
    }
    g.computeBoundingSphere();

    /* the colour map is a JPEG sitting inside the binary chunk */
    let map = null;
    const img = j.images && j.images[0];
    if (img && img.bufferView != null) {
      const bv = j.bufferViews[img.bufferView];
      const blob = new Blob([bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)], { type: img.mimeType || 'image/jpeg' });
      const bmp = await createImageBitmap(blob);
      map = new THREE.CanvasTexture(bmp);
      map.colorSpace = THREE.SRGBColorSpace;
      map.flipY = false;                    /* glTF UVs already run top-down */
      map.anisotropy = 4;
    }
    const mat = new THREE.MeshStandardMaterial({ map, metalness: 0.15, roughness: 0.62 });
    const mesh = new THREE.Mesh(g, mat);
    const node = j.nodes[(j.scenes[j.scene || 0].nodes || [0])[0]];
    if (node) {
      /* quantisation leaves its inverse on the node, so this is not optional */
      if (node.translation) mesh.position.fromArray(node.translation);
      if (node.scale) mesh.scale.fromArray(node.scale);
      if (node.rotation) mesh.quaternion.fromArray(node.rotation);
    }
    return mesh;
  }

  /* ---------- the corner stage ---------- */
  function mount(host, THREE) {
    const canvas = document.createElement('canvas');
    canvas.className = 'cw-agent__c';
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 0, 3.1);

    /* three lights, because one makes a white robot look like a paper cutout:
       a key from the front left, a lime rim from behind to tie him to the
       brand, and a soft fill so the underside is not a hole */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8c95a0, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(-1.4, 1.6, 2.4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xC6F24E, 1.7); rim.position.set(1.6, 0.6, -1.8); scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);

    let bot = null, raf = 0, t0 = performance.now(), nod = 0, live = true;

    function size() {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!live || !bot) return;
      const t = (performance.now() - t0) / 1000;
      if (!reduce) {
        pivot.position.y = Math.sin(t * 1.5) * 0.045;              /* hovering */
        pivot.rotation.y = Math.sin(t * 0.55) * 0.34;              /* looking about */
        pivot.rotation.z = Math.sin(t * 1.5 + 1) * 0.02;
      }
      if (nod > 0) {                                               /* a quick yes */
        nod = Math.max(0, nod - 0.045);
        pivot.rotation.x = Math.sin((1 - nod) * Math.PI * 2) * 0.28 * nod;
      } else pivot.rotation.x = 0;
      renderer.render(scene, camera);
    }

    /* he stops entirely when nobody can see him */
    const io = new IntersectionObserver(e => { live = e[0].isIntersecting; if (live) size(); }, { threshold: 0 });
    io.observe(host);
    /* the launcher is hidden until the visitor reaches the lobby, so the
       first measurement can legitimately be zero; watch instead of guess */
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    addEventListener('visibilitychange', () => { live = !document.hidden; });
    addEventListener('resize', size);

    size();
    loadModel(THREE).then(mesh => {
      /* frame him by his own bounds, so a different export still fits */
      const box = new THREE.Box3().setFromObject(mesh);
      const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
      mesh.position.sub(c);
      const k = 1.72 / Math.max(s.x, s.y, s.z);
      mesh.scale.multiplyScalar(k);
      mesh.position.multiplyScalar(k);
      pivot.add(mesh);
      bot = mesh;
      host.classList.add('is-ready');
      frame();
    }).catch(() => {
      /* no model, no drama: the button keeps its drawn glyph */
      host.classList.add('is-failed');
      cancelAnimationFrame(raf);
    });

    return { nod: () => { nod = 1; }, dispose: () => { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); } };
  }

  window.cwAgent3D = { mount };
})();
