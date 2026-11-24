'use strict';

function build3D() {
  if (!window.THREE) throw new Error('three.js not loaded');
  const V = THREE.Vector3;
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020308);
  scene.fog = new THREE.FogExp2(0x020306, 0.02);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.04, 150);
  const SCREEN_C = new V(0, SCR.cy, SCR.z);

  const std = (c, r = 0.9, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); scene.add(m); return m; };
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };

  /* carpet */
  const carpetDraw = (g, w, h) => {
    g.fillStyle = '#1a1c2b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#242842'; g.lineWidth = 2;
    for (let i = -w; i < w * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
    g.fillStyle = '#3d2d2a'; for (let x = 16; x < w; x += 32) for (let y = 16; y < h; y += 32) g.fillRect(x - 2, y - 2, 4, 4);
  };
  const carpetFloor = canvasTex(128, 128, carpetDraw); carpetFloor.wrapS = carpetFloor.wrapT = THREE.RepeatWrapping; carpetFloor.repeat.set(14, 16);
  const carpetRiser = carpetFloor.clone(); carpetRiser.needsUpdate = true; carpetRiser.repeat.set(14, 1);
  const floorMat = new THREE.MeshStandardMaterial({ map: carpetFloor, roughness: 1 });
  const riserMat = new THREE.MeshStandardMaterial({ map: carpetRiser, roughness: 1 });

  /* shell */
  const floor = add(new THREE.PlaneGeometry(HALF_W * 2, RD), floorMat, 0, 0, RD / 2); floor.rotation.x = -Math.PI / 2;
  const wallMat = std(0x0d0f15, 0.95);
  const wl = add(new THREE.PlaneGeometry(RD, RH), wallMat, -HALF_W, RH / 2, RD / 2); wl.rotation.y = Math.PI / 2;
  const wr = add(new THREE.PlaneGeometry(RD, RH), wallMat, HALF_W, RH / 2, RD / 2); wr.rotation.y = -Math.PI / 2;
  add(new THREE.PlaneGeometry(HALF_W * 2, RH), std(0x07080c, 1), 0, RH / 2, 0);
  const back = add(new THREE.PlaneGeometry(HALF_W * 2, RH), std(0x0b0c12, 0.95), 0, RH / 2, RD); back.rotation.y = Math.PI;
  const ceil = add(new THREE.PlaneGeometry(HALF_W * 2, RD), std(0x0b0c12, 1), 0, RH, RD / 2); ceil.rotation.x = Math.PI / 2;

  /* stadium risers */
  for (let ri = 0; ri < 12; ri++) {
    const h = rowFloor(ri); if (h <= 0) continue;
    const zf = rowZ(ri) - 0.625, zb = ri === 11 ? RD : rowZ(ri) + 0.625;
    add(new THREE.BoxGeometry(HALF_W * 2, h, zb - zf), riserMat, 0, h / 2, (zf + zb) / 2);
  }
  /* stage */
  add(new THREE.BoxGeometry(15, 0.7, 2.6), std(0x0d0e14, 0.8), 0, 0.35, 1.3);
  add(new THREE.BoxGeometry(15, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x6a4a22 }), 0, 0.68, 2.61);

  /* screen (slightly curved) */
  const SC = document.createElement('canvas'); SC.width = 2048; SC.height = 856; const sg = SC.getContext('2d');
  const screenTex = new THREE.CanvasTexture(SC); screenTex.encoding = THREE.sRGBEncoding; screenTex.anisotropy = 8;
  const sgeo = new THREE.PlaneGeometry(SCR.w, SCR.h, 48, 1);
  const sp = sgeo.attributes.position; for (let i = 0; i < sp.count; i++) { const x = sp.getX(i); sp.setZ(i, (x / (SCR.w / 2)) ** 2 * 0.45); }
  add(sgeo, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), 0, SCR.cy, SCR.z);
  add(new THREE.PlaneGeometry(SCR.w + 1.0, SCR.h + 0.8), new THREE.MeshBasicMaterial({ color: 0x010101 }), 0, SCR.cy, SCR.z - 0.05);

  /* curtains */
  const velvet = new THREE.MeshStandardMaterial({ color: 0x420a13, roughness: 0.88, side: THREE.DoubleSide });
  [-1, 1].forEach(s => {
    const cw = HALF_W - (SCR.w / 2 + 0.5), g = new THREE.PlaneGeometry(cw, RH - 0.7, 40, 1);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * Math.PI * 2 / 0.32) * 0.09);
    g.computeVertexNormals();
    add(g, velvet, s * (SCR.w / 2 + 0.5 + cw / 2), 0.7 + (RH - 0.7) / 2, 0.55);
  });
  add(new THREE.BoxGeometry(HALF_W * 2, 1.1, 0.3), velvet, 0, RH - 0.55, 0.7);

  /* acoustic wall panels */
  const panelGeo = new THREE.BoxGeometry(0.12, 2.0, 2.4);
  const panelZ = [5.6, 8.2, 10.8, 13.4, 16.0, 18.6], panelY = [2.6, 4.8, 7.0];
  const panels = new THREE.InstancedMesh(panelGeo, std(0xffffff, 1), panelZ.length * panelY.length * 2);
  const dmy = new THREE.Object3D(); let k = 0; const cA = new THREE.Color(0x14171f), cB = new THREE.Color(0x1b1521);
  [-1, 1].forEach(s => panelZ.forEach((z, zi) => panelY.forEach((y, yi) => { dmy.position.set(s * (HALF_W - 0.06), y, z); dmy.rotation.set(0, 0, 0); dmy.scale.set(1, 1, 1); dmy.updateMatrix(); panels.setMatrixAt(k, dmy.matrix); panels.setColorAt(k++, (zi + yi) % 2 ? cA : cB); })));
  scene.add(panels);

  /* sconces, speakers, cove lights */
  const glowTex = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
  const sconceMat = new THREE.MeshBasicMaterial({ color: 0xffc98a });
  const sconceGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffb066, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const spkMat = std(0x050507, 0.6);
  [-1, 1].forEach(s => [6.9, 10.8, 14.7, 18.6].forEach(z => {
    add(new THREE.BoxGeometry(0.14, 0.55, 0.22), sconceMat, s * (HALF_W - 0.1), 8.7, z);
    const sp = new THREE.Sprite(sconceGlowMat); sp.position.set(s * (HALF_W - 0.15), 7.9, z); sp.scale.set(1.3, 5.2, 1); scene.add(sp);
    add(new THREE.BoxGeometry(0.4, 0.55, 0.42), spkMat, s * (HALF_W - 0.22), 9.9, z);
  }));
  const coveMat = new THREE.MeshBasicMaterial({ color: 0xffb066 });
  [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.08, 0.06, RD - 1), coveMat, s * (HALF_W - 0.1), RH - 0.15, RD / 2 + 0.5));

  /* exits */
  const exitTex = canvasTex(128, 48, (g, w, h) => { g.fillStyle = '#062e14'; g.fillRect(0, 0, w, h); g.fillStyle = '#4dff86'; g.font = '700 30px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EXIT', w / 2, h / 2 + 1); });
  const exitMat = new THREE.MeshBasicMaterial({ map: exitTex, toneMapped: false });
  const doorMat = std(0x0a0b10, 0.7);
  [-1, 1].forEach(s => {
    const d = add(new THREE.PlaneGeometry(1.4, 2.2), doorMat, s * (HALF_W - 0.02), 1.1, 3.9); d.rotation.y = -s * Math.PI / 2;
    const e = add(new THREE.PlaneGeometry(0.62, 0.24), exitMat, s * (HALF_W - 0.03), 2.55, 3.9); e.rotation.y = -s * Math.PI / 2;
    const bf = rowFloor(11);
    const bd = add(new THREE.PlaneGeometry(1.4, 2.2), doorMat, s * 7.6, bf + 1.1, RD - 0.02); bd.rotation.y = Math.PI;
    const be = add(new THREE.PlaneGeometry(0.62, 0.24), exitMat, s * 7.6, bf + 2.55, RD - 0.03); be.rotation.y = Math.PI;
  });

  /* row letters on side walls + aisle step lights */
  const stepLights = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.035, 0.02), new THREE.MeshBasicMaterial({ color: 0xc98a3c }), 12 * 4);
  const aisleX = [(seatX(4) + seatX(5)) / 2, (seatX(12) + seatX(13)) / 2, -7.6, 7.6];
  let si = 0;
  for (let ri = 0; ri < 12; ri++) {
    const lt = canvasTex(64, 64, (g, w) => { g.fillStyle = '#0d0f18'; g.fillRect(0, 0, w, w); g.fillStyle = '#c9a36a'; g.font = '700 40px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ROWS[ri], 32, 34); });
    const lm = new THREE.MeshBasicMaterial({ map: lt, toneMapped: false, color: 0x888888 });
    [-1, 1].forEach(s => { const p = add(new THREE.PlaneGeometry(0.3, 0.3), lm, s * (HALF_W - 0.13), rowFloor(ri) + 1.25, rowZ(ri)); p.rotation.y = -s * Math.PI / 2; });
    const h = rowFloor(ri);
    aisleX.forEach(x => { dmy.position.set(x, Math.max(0.02, h - 0.03), rowZ(ri) - 0.635); dmy.updateMatrix(); stepLights.setMatrixAt(si++, dmy.matrix); });
  }
  scene.add(stepLights);

  /* fibre-optic star ceiling */
  const starMats = [0, 1].map(() => new THREE.PointsMaterial({ size: 0.06, color: 0xc4d4ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  starMats.forEach(m => { const pts = []; for (let i = 0; i < 260; i++) pts.push((Math.random() * 2 - 1) * (HALF_W - 0.4), RH - 0.03, 1.5 + Math.random() * (RD - 2)); const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); scene.add(new THREE.Points(gg, m)); });
  /* soft screen spill behind the screen */
  const haloMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  add(new THREE.PlaneGeometry(SCR.w * 1.9, SCR.h * 2.4), haloMat, 0, SCR.cy, SCR.z - 0.03);
  /* phone glows during pre-show */
  const phoneMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x8fb8ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
  const phones = [0, 1, 2, 3, 4].map(() => { const s = new THREE.Sprite(phoneMat); s.scale.set(0.35, 0.35, 1); s.visible = false; scene.add(s); return s; });

  /* seats (instanced) */
  const N = 12 * PER_ROW;
  function rbox(w, h, d, r) {
    const bs = r * 0.9, x = w / 2 - bs, y = h / 2 - bs, cr = Math.min(r * 0.6, x, y), sh = new THREE.Shape();
    sh.moveTo(-x + cr, -y); sh.lineTo(x - cr, -y); sh.quadraticCurveTo(x, -y, x, -y + cr); sh.lineTo(x, y - cr); sh.quadraticCurveTo(x, y, x - cr, y);
    sh.lineTo(-x + cr, y); sh.quadraticCurveTo(-x, y, -x, y - cr); sh.lineTo(-x, -y + cr); sh.quadraticCurveTo(-x, -y, -x + cr, -y);
    const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - 2 * bs), bevelEnabled: true, bevelThickness: bs, bevelSize: bs, bevelSegments: 3, curveSegments: 4 });
    g.center(); g.computeVertexNormals(); return g;
  }
  const velvetSeat = std(0xffffff, 0.92);
  const cushion = new THREE.InstancedMesh(rbox(0.5, 0.13, 0.5, 0.05), velvetSeat, N);
  const backrest = new THREE.InstancedMesh(rbox(0.52, 0.6, 0.11, 0.045), velvetSeat, N);
  const baseM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.4, 0.34), std(0x0d0e13, 0.7), N);
  const arms = new THREE.InstancedMesh(rbox(0.08, 0.09, 0.58, 0.035), std(0x17181f, 0.5, 0.2), N + 36);
  let ai = 0;
  const seatIndex = (ri, n) => ri * PER_ROW + n - 1;
  for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) {
    const x = seatX(n), y = rowFloor(ri), z = rowZ(ri), rec = ri >= 10, i = seatIndex(ri, n);
    dmy.rotation.set(0, 0, 0);
    dmy.position.set(x, y + 0.45, z - 0.02); dmy.scale.set(rec ? 1.08 : 1, rec ? 1.5 : 1, rec ? 1.2 : 1); dmy.updateMatrix(); cushion.setMatrixAt(i, dmy.matrix);
    dmy.position.set(x, y + (rec ? 0.78 : 0.75), z + (rec ? 0.33 : 0.27)); dmy.rotation.set(rec ? 0.24 : 0.15, 0, 0); dmy.scale.set(rec ? 1.08 : 1, rec ? 1.1 : 1, rec ? 1.6 : 1); dmy.updateMatrix(); backrest.setMatrixAt(i, dmy.matrix);
    dmy.rotation.set(0, 0, 0); dmy.scale.set(1, 1, 1);
    dmy.position.set(x, y + 0.2, z); dmy.updateMatrix(); baseM.setMatrixAt(i, dmy.matrix);
    dmy.position.set(x - 0.31, y + 0.66, z + 0.02); dmy.updateMatrix(); arms.setMatrixAt(ai++, dmy.matrix);
    if (n === 4 || n === 12 || n === 16) { dmy.position.set(x + 0.31, y + 0.66, z + 0.02); dmy.updateMatrix(); arms.setMatrixAt(ai++, dmy.matrix); }
  }
  arms.count = ai;
  const cups = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 10), new THREE.MeshBasicMaterial({ color: 0x2f6bff, toneMapped: false }), ai);
  const am = new THREE.Matrix4();
  for (let i = 0; i < ai; i++) { arms.getMatrixAt(i, am); am.elements[13] += 0.05; am.elements[14] -= 0.18; cups.setMatrixAt(i, am); }
  scene.add(cups);
  scene.add(cushion, backrest, baseM, arms);

  /* audience silhouettes */
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.105, 14, 10), std(0xffffff, 0.85), N);
  const torsos = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.17, 0.32, 4, 10), std(0xffffff, 0.95), N);
  scene.add(heads, torsos);

  /* projector booth + beam + dust */
  const boothY = 8.9, bz = RD - 0.04;
  add(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0x1d2030 }), 0, boothY, bz).rotation.y = Math.PI;
  const lens = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1d6, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  lens.position.set(0, boothY, bz - 0.05); lens.scale.set(1.6, 1.6, 1); scene.add(lens);
  const bc = [[-0.22, boothY - 0.12], [0.22, boothY - 0.12], [0.22, boothY + 0.12], [-0.22, boothY + 0.12]];
  const sc = [[-SCR.w / 2, SCR.bottom], [SCR.w / 2, SCR.bottom], [SCR.w / 2, SCR.bottom + SCR.h], [-SCR.w / 2, SCR.bottom + SCR.h]];
  const bpos = [], bt = [];
  for (let q = 0; q < 4; q++) {
    const a = bc[q], b = bc[(q + 1) % 4], c = sc[(q + 1) % 4], d = sc[q];
    const A = [a[0], a[1], bz - 0.1], B = [b[0], b[1], bz - 0.1], C = [c[0], c[1], SCR.z + 0.5], D = [d[0], d[1], SCR.z + 0.5];
    bpos.push(...A, ...B, ...C, ...A, ...C, ...D); bt.push(0, 0, 1, 0, 1, 1);
  }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.Float32BufferAttribute(bpos, 3)); bgeo.setAttribute('aT', new THREE.Float32BufferAttribute(bt, 1));
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1, 0.95, 0.85) }, uOp: { value: 0 } },
    vertexShader: 'attribute float aT; varying float vT; void main(){ vT=aT; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uColor; uniform float uOp; varying float vT; void main(){ gl_FragColor=vec4(uColor*uOp*(1.0-0.75*vT),1.0); }',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  scene.add(new THREE.Mesh(bgeo, beamMat));
  const DUST = 700, dpos = new Float32Array(DUST * 3), dseed = [];
  for (let i = 0; i < DUST; i++) dseed.push([Math.random() * 2 - 1, Math.random() * 2 - 1, 0.05 + Math.random() * 0.9, Math.random() * 6.28, 0.2 + Math.random()]);
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.014, color: 0xfff3dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(dgeo, dustMat));

  /* lights */
  scene.add(new THREE.HemisphereLight(0x1a2238, 0x050506, 0.1));
  const amb = new THREE.AmbientLight(0xffd9a8, 0);
  scene.add(amb);
  const house = [];
  [[-5, 6], [5, 6], [-5, 15], [5, 15], [0, 10.5]].forEach(([x, z]) => { const l = new THREE.PointLight(0xffd2a0, 0, 26, 1.4); l.position.set(x, RH - 1.2, z); scene.add(l); house.push(l); });
  const screenLight = new THREE.SpotLight(0xffffff, 0, 48, 1.25, 1, 1);
  screenLight.position.set(0, SCR.cy, SCR.z + 0.8); screenLight.target.position.set(0, 2.5, 16);
  scene.add(screenLight, screenLight.target);
  const screenFill = new THREE.PointLight(0xffffff, 0, 16, 1.6); screenFill.position.set(0, SCR.cy, 3); scene.add(screenFill);

  /* ---------- on-screen "film" ---------- */
  /* ---------- one still image on the screen (your image, or built-in art) ---------- */
  const DISP = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif';
  const W = SC.width = 2048, H = SC.height = 856;
  const art = document.createElement('canvas'); art.width = W; art.height = H;
  function makeArt() {
    const g = art.getContext('2d');
    drawCity(g, W, H, 4);
    g.fillStyle = 'rgba(3,16,10,.45)'; g.fillRect(0, 0, W, H);
    const v = g.createLinearGradient(0, 0, W * 0.6, 0); v.addColorStop(0, 'rgba(0,0,0,.75)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    drawFigure(g, W * 0.7, H * 1.03, H / 400 * 0.98, 0, 1);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = '14px';
    g.fillStyle = '#e8ebf1'; g.font = `900 200px ${DISP}`; g.fillText('AVENGERS', W * 0.06, H * 0.5);
    g.shadowColor = '#3dff9e'; g.shadowBlur = 30; g.fillStyle = '#7dffc4'; g.font = `800 104px ${DISP}`; g.fillText('DOOMSDAY', W * 0.065, H * 0.5 + 118);
    g.shadowBlur = 0; g.fillStyle = 'rgba(236,234,228,.75)'; g.font = `700 44px ${DISP}`; g.fillText('18 DECEMBER 2026 · ONLY IN CINEMAS', W * 0.066, H * 0.5 + 196);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }
  let screenSrc = art, glowBase = [0.3, 0.35, 0.32, 0.3];
  function paintScreen() {
    const sw = screenSrc.naturalWidth || screenSrc.width, sh = screenSrc.naturalHeight || screenSrc.height;
    const k = Math.max(W / sw, H / sh), dw = sw * k, dh = sh * k;
    sg.fillStyle = '#000'; sg.fillRect(0, 0, W, H);
    sg.drawImage(screenSrc, (W - dw) / 2, (H - dh) / 2, dw, dh);
    screenTex.needsUpdate = true;
    const c = document.createElement('canvas'); c.width = c.height = 1; const cg = c.getContext('2d'); cg.drawImage(SC, 0, 0, 1, 1);
    try { const d = cg.getImageData(0, 0, 1, 1).data, r = d[0] / 255, gg = d[1] / 255, b = d[2] / 255, m = Math.max(r, gg, b, 0.05); glowBase = [r / m, gg / m, b / m, Math.min(0.8, 0.15 + (0.3 * r + 0.55 * gg + 0.15 * b) * 1.6)]; } catch (e) { /* keep default glow */ }
  }
  function setScreenImage(img) { screenSrc = img; paintScreen(); }
  function drawStill(t) { const f = 1 + Math.sin(t * 7.3) * 0.015 + Math.sin(t * 13.1) * 0.01; return [glowBase[0], glowBase[1], glowBase[2], glowBase[3] * f]; }
  makeArt(); paintScreen();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { makeArt(); if (screenSrc === art) paintScreen(); });
  function loadUserImage(src, save) {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 2048 / im.naturalWidth), c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      setScreenImage(c);
      if (save) { try { localStorage.setItem('sv-screen', c.toDataURL('image/jpeg', 0.85)); } catch (e) { /* storage full or blocked: image still shows this visit */ } }
    };
    im.src = src;
  }
  let saved = null; try { saved = localStorage.getItem('sv-screen'); } catch (e) { saved = null; }
  if (saved) loadUserImage(saved, false); else loadUserImage('screen.jpg', false);
  $('pvImg').addEventListener('click', () => $('pvFile').click());
  $('pvFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader(); rd.onload = () => loadUserImage(rd.result, true); rd.readAsDataURL(f); e.target.value = '';
  });

  /* ---------- sound (Web Audio, synthesized) ---------- */
  const Snd = {
    ctx: null, on: false,
    init() {
      if (this.ctx) return;
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const ctx = this.ctx = new C();
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); this.pan.connect(this.master);
      const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 420; lp.Q.value = 0.6;
      this.murmur = ctx.createGain(); this.murmur.gain.value = 0; src.connect(lp); lp.connect(this.murmur); this.murmur.connect(ctx.destination); src.start();
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 43; const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 140;
      this.drone = ctx.createGain(); this.drone.gain.value = 0; o.connect(of); of.connect(this.drone); this.drone.connect(this.pan); o.start();
    },
    toggle(v) { this.init(); if (!this.ctx) return; this.on = v; if (v) this.ctx.resume(); this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.2); this.murmur.gain.setTargetAtTime(v ? this._m || 0 : 0, this.ctx.currentTime, 0.3); },
    frame(houseLvl, lum, x) {
      if (!this.ctx || !this.on) return;
      const t = this.ctx.currentTime; this._m = houseLvl * 0.22;
      this.murmur.gain.setTargetAtTime(this._m, t, 0.5);
      this.drone.gain.setTargetAtTime((1 - houseLvl) * (0.05 + lum * 0.22), t, 0.15);
      if (this.pan.pan) this.pan.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, -x / 7)), t, 0.3);
    },
    boom(s) {
      if (!this.ctx || !this.on) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * s, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g); g.connect(this.pan); o.start(t); o.stop(t + 2.3);
    }
  };

  /* ---------- seats/people colouring ---------- */
  const COL = { velvet: new THREE.Color(0x6e1420), velvetBack: new THREE.Color(0x5a0f1a), leather: new THREE.Color(0x4b3024), leatherBack: new THREE.Color(0x3d271e), mine: new THREE.Color(0xc98526) };
  const hairCols = [0x15100e, 0x1e1612, 0x2b1d14, 0x0e0e10, 0x3a2a1c, 0x4a4a4e].map(c => new THREE.Color(c));
  const shirtCols = [0x1c2233, 0x2a1d22, 0x18261f, 0x2b2b30, 0x33261a, 0x141418, 0x3a1f2a].map(c => new THREE.Color(c));
  let current = null;
  function refreshSeats() {
    for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) {
      const id = idOf(ri, n), i = seatIndex(ri, n), rec = ri >= 10, mine = state.selected.includes(id) && id !== current;
      cushion.setColorAt(i, mine ? COL.mine : rec ? COL.leather : COL.velvet);
      backrest.setColorAt(i, mine ? COL.mine : rec ? COL.leatherBack : COL.velvetBack);
    }
    cushion.instanceColor.needsUpdate = backrest.instanceColor.needsUpdate = true;
    let c = 0;
    for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) {
      const id = idOf(ri, n); if (!state.sold.has(id) || id === current) continue;
      const r = rng(ri * 131 + n * 17 + 5), sc = 0.95 + r() * 0.1, lean = (r() - 0.5) * 0.08;
      const x = seatX(n) + lean, y = rowFloor(ri), z = rowZ(ri) + 0.08, rec = ri >= 10;
      dmy.rotation.set(rec ? 0.12 : 0, 0, lean); dmy.scale.set(1.15, sc, 0.75);
      dmy.position.set(x, y + 0.8 * sc, z + (rec ? 0.06 : 0)); dmy.updateMatrix(); torsos.setMatrixAt(c, dmy.matrix);
      dmy.scale.set(1, 1.15, 1); dmy.position.set(x + lean * 2, y + 1.15 * sc - (rec ? 0.03 : 0), z + (rec ? 0.1 : 0)); dmy.updateMatrix(); heads.setMatrixAt(c, dmy.matrix);
      heads.setColorAt(c, hairCols[Math.floor(r() * hairCols.length)]); torsos.setColorAt(c, shirtCols[Math.floor(r() * shirtCols.length)]);
      c++;
    }
    heads.count = torsos.count = c;
    let pi = 0; phones.forEach(s => { s.visible = false; });
    for (let j = 0; j < c && pi < phones.length; j++) { if (((j * 7919) % 13) !== 3) continue; heads.getMatrixAt(j, am); phones[pi].position.set(am.elements[12], am.elements[13] - 0.32, am.elements[14] - 0.28); phones[pi++].visible = true; }
    heads.instanceMatrix.needsUpdate = torsos.instanceMatrix.needsUpdate = true;
    if (c) heads.instanceColor.needsUpdate = torsos.instanceColor.needsUpdate = true;
    renderMini(); updateBookBtn();
  }
  // make sure instanceColor buffers exist before first use
  heads.setColorAt(0, hairCols[0]); torsos.setColorAt(0, shirtCols[0]); cushion.setColorAt(0, COL.velvet); backrest.setColorAt(0, COL.velvet);

  /* ---------- HUD ---------- */
  function renderMini() {
    let h = '';
    for (let ri = 11; ri >= 0; ri--) {
      h += '<div class="mrow">';
      for (let n = 1; n <= PER_ROW; n++) {
        if (n === 5 || n === 13) h += '<i></i>';
        const id = idOf(ri, n);
        h += `<button class="mseat${state.sold.has(id) ? ' sold' : ''}${state.selected.includes(id) ? ' sel' : ''}${id === current ? ' cur' : ''}" data-id="${id}" aria-label="Preview row ${ROWS[ri]} seat ${n}"></button>`;
      }
      h += '</div>';
    }
    $('mini').innerHTML = h + '<div class="mscreen"></div>';
  }
  $('mini').addEventListener('click', e => { const b = e.target.closest('.mseat'); if (b) goTo(b.dataset.id); });
  function updateHud(id) {
    const [ri, n] = parseId(id), tr = TIERS[tierOf(ri)], m = metrics(ri, n);
    $('pvSeat').textContent = `Row ${ROWS[ri]} · Seat ${n}`;
    $('pvTier').textContent = `${tr.name} · ₹${tr.price}${state.sold.has(id) ? ' · sold for this show' : ''}`;
    const card = $('pvCard'); card.style.setProperty('--q', scoreColor(m.s)); card.style.setProperty('--v', m.s);
    $('pvScore').textContent = m.s; $('pvVerdict').textContent = m.verdict;
    $('mDist').textContent = m.dist.toFixed(1) + ' m';
    $('mFill').textContent = Math.round(m.fill) + '° wide';
    $('mTilt').textContent = Math.abs(m.tilt) < 1 ? 'level' : `${Math.round(Math.abs(m.tilt))}° ${m.tilt > 0 ? 'up' : 'down'}`;
    $('mOff').textContent = Math.round(m.off) + '°';
    $('pvTip').textContent = m.tip;
    updateBookBtn();
  }
  function updateBookBtn() {
    if (!current) return;
    const b = $('pvBook');
    if (state.sold.has(current)) { b.textContent = 'Sold for this show'; b.disabled = true; b.classList.remove('primary'); }
    else { b.disabled = false; const on = state.selected.includes(current); b.textContent = on ? `${current} selected ✓` : `Select ${current}`; b.classList.toggle('primary', !on); }
  }
  $('pvBook').addEventListener('click', () => { if (current) { toggleSeat(current); renderMini(); } });

  /* ---------- camera / flight ---------- */
  const look = { yaw: 0, pitch: 0, tYaw: 0, tPitch: 0, fov: 55, tFov: 55, base: 55 };
  let eye = new V(), flight = null;
  const baseQuat = p => { const m = new THREE.Matrix4().lookAt(p, SCREEN_C, new V(0, 1, 0)); return new THREE.Quaternion().setFromRotationMatrix(m); };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function fly(toPos, toQuat, dur, ctrl, done) {
    flight = { p0: camera.position.clone(), q0: camera.quaternion.clone(), p1: toPos.clone(), q1: toQuat.clone(), c: ctrl, t0: performance.now(), dur: reduce ? 250 : dur, done };
  }
  const toast = $('pvToast'); let toastTimer;
  function showToast(html, ms) { toast.innerHTML = html; toast.classList.remove('hide'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add('hide'), ms); }

  let houseT = 1, houseLvl = 1, autoDim;
  function setLights(on) { houseT = on ? 1 : 0; if (!on) Snd.boom(0.6); $('pvLights').setAttribute('aria-pressed', on); }
  $('pvLights').addEventListener('click', () => { clearTimeout(autoDim); setLights(houseT < 0.5); });
  $('pvSound').addEventListener('click', () => { const v = !Snd.on; Snd.toggle(v); $('pvSound').setAttribute('aria-pressed', v); });
  $('pvCenter').addEventListener('click', () => { look.tYaw = look.tPitch = 0; look.tFov = look.base; });

  function goTo(id, intro) {
    const [ri, n] = parseId(id); const e = eyeOf(ri, n);
    const prev = current; current = id; refreshSeats(); updateHud(id);
    const target = new V(e.x, e.y, e.z), q = baseQuat(target);
    look.tYaw = look.tPitch = look.yaw = look.pitch = 0;
    if (intro) {
      camera.position.set(0, 17, 31); camera.quaternion.copy(baseQuat.call(null, new V(0, 17, 31)));
      camera.lookAt(0, 1.5, 9);
      const ctrl = new V(e.x * 0.4, Math.max(e.y + 4, 9), e.z + 6);
      showToast(`Taking you to Row ${ROWS[ri]}, Seat ${n}<small>Avengers: Doomsday · Screen 3</small>`, 2600);
      fly(target, q, 3800, ctrl, () => { eye.copy(target); clearTimeout(autoDim); autoDim = setTimeout(() => { if (houseT > 0.5) setLights(false); }, 900); });
    } else {
      const d = camera.position.distanceTo(target);
      const mid = camera.position.clone().add(target).multiplyScalar(0.5); mid.y += 0.8 + d * 0.12;
      showToast(`Row ${ROWS[ri]} · Seat ${n}`, 1100);
      fly(target, q, Math.min(2600, 900 + d * 110), mid, () => eye.copy(target));
    }
    if (prev !== id) { document.querySelectorAll('.seat.viewing').forEach(b => b.classList.remove('viewing')); const b = document.querySelector(`.seat[data-id="${id}"]`); if (b) b.classList.add('viewing'); }
  }

  /* pointer look */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag || flight) return;
    look.tYaw = Math.max(-1.3, Math.min(1.3, look.tYaw + (e.clientX - drag.x) * 0.0042));
    look.tPitch = Math.max(-0.75, Math.min(0.7, look.tPitch + (e.clientY - drag.y) * 0.0042));
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); look.tFov = Math.max(28, Math.min(100, look.tFov + e.deltaY * 0.03)); }, { passive: false });
  addEventListener('keydown', e => {
    if (pv.hidden || !current) return;
    const [ri, n] = parseId(current);
    if (e.key === 'Escape') closePreview();
    else if (e.key === 'ArrowUp' && ri < 11) goTo(idOf(ri + 1, n));
    else if (e.key === 'ArrowDown' && ri > 0) goTo(idOf(ri - 1, n));
    else if (e.key === 'ArrowLeft' && n > 1) goTo(idOf(ri, n - 1));
    else if (e.key === 'ArrowRight' && n < PER_ROW) goTo(idOf(ri, n + 1));
    else if (e.key.toLowerCase() === 'l') { clearTimeout(autoDim); setLights(houseT < 0.5); }
    else return;
    e.preventDefault();
  });

  function resize() { const w = pv.clientWidth, h = pv.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; look.base = Math.max(55, Math.min(90, deg(2 * Math.atan(Math.tan(37.5 * Math.PI / 180) / camera.aspect)))); look.tFov = look.base; camera.updateProjectionMatrix(); }
  addEventListener('resize', () => { if (!pv.hidden) resize(); });

  /* ---------- loop ---------- */
  let running = false, last = 0, glow = [0.3, 0.3, 0.4, 0.3];
  const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(0, 0, 0, 'YXZ'), sCol = new THREE.Color(), b1 = new V(), b2 = new V();
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    houseLvl += (houseT - houseLvl) * Math.min(1, dt * 0.8);
    glow = drawStill(now / 1000);

    /* camera */
    if (flight) {
      const t = Math.min(1, (now - flight.t0) / flight.dur), e = ease(t), u = 1 - e;
      camera.position.set(
        u * u * flight.p0.x + 2 * u * e * flight.c.x + e * e * flight.p1.x,
        u * u * flight.p0.y + 2 * u * e * flight.c.y + e * e * flight.p1.y,
        u * u * flight.p0.z + 2 * u * e * flight.c.z + e * e * flight.p1.z);
      camera.quaternion.copy(flight.q0).slerp(flight.q1, e);
      if (t >= 1) { const d = flight.done; flight = null; d && d(); }
    } else if (current) {
      look.yaw += (look.tYaw - look.yaw) * Math.min(1, dt * 8);
      look.pitch += (look.tPitch - look.pitch) * Math.min(1, dt * 8);
      camera.position.copy(eye); camera.position.y += Math.sin(now / 1900) * 0.004;
      camera.quaternion.copy(baseQuat(eye)).multiply(tmpQ.setFromEuler(tmpE.set(look.pitch, look.yaw, 0)));
    }
    look.fov += (look.tFov - look.fov) * Math.min(1, dt * 6);
    if (Math.abs(camera.fov - look.fov) > 0.01) { camera.fov = look.fov; camera.updateProjectionMatrix(); }

    /* lights */
    const lum = glow[3];
    sCol.setRGB(glow[0], glow[1], glow[2]);
    screenLight.color.copy(sCol); screenLight.intensity = 0.15 + lum * 3.8;
    screenFill.color.copy(sCol); screenFill.intensity = lum * 1.4;
    house.forEach(l => { l.intensity = houseLvl * 0.9; }); amb.intensity = houseLvl * 0.14;
    sconceMat.color.setRGB(0.25 + houseLvl * 0.75, 0.18 + houseLvl * 0.6, 0.1 + houseLvl * 0.4);
    sconceGlowMat.opacity = 0.14 + houseLvl * 0.5;
    coveMat.color.setRGB(0.03 + houseLvl * 0.8, 0.05 + houseLvl * 0.5, 0.2 + houseLvl * 0.1);
    const beam = (1 - houseLvl) * (0.02 + lum * 0.05);
    beamMat.uniforms.uOp.value = beam; lens.material.opacity = 0.25 + (1 - houseLvl) * 0.75;
    dustMat.opacity = (1 - houseLvl) * (0.08 + lum * 0.2);
    if (dustMat.opacity > 0.01) {
      const tt = now / 1000;
      for (let i = 0; i < DUST; i++) {
        const s = dseed[i]; let f = (s[2] + tt * 0.004 * s[4]) % 1;
        const u = Math.max(-1, Math.min(1, s[0] + Math.sin(tt * 0.3 * s[4] + s[3]) * 0.08)), v = Math.max(-1, Math.min(1, s[1] + Math.cos(tt * 0.25 * s[4] + s[3]) * 0.08));
        b1.set(u * 0.22, boothY + v * 0.12, bz - 0.1); b2.set(u * SCR.w / 2, SCR.cy + v * SCR.h / 2, SCR.z + 0.5);
        dpos[i * 3] = b1.x + (b2.x - b1.x) * f; dpos[i * 3 + 1] = b1.y + (b2.y - b1.y) * f; dpos[i * 3 + 2] = b1.z + (b2.z - b1.z) * f;
      }
      dgeo.attributes.position.needsUpdate = true;
    }
    haloMat.color.copy(sCol); haloMat.opacity = lum * 0.4 * (1 - houseLvl * 0.6);
    const tw = now / 1000; starMats[0].opacity = 0.45 + 0.35 * Math.sin(tw * 1.3); starMats[1].opacity = 0.45 + 0.35 * Math.cos(tw * 1.1);
    phoneMat.opacity = houseLvl * 0.85;
    Snd.frame(houseLvl, lum, camera.position.x);
    renderer.render(scene, camera);
  }

  return {
    get current() { return current; },
    refreshSeats, updateBookBtn,
    enter(id) {
      resize(); houseT = houseLvl = 1; $('pvLights').setAttribute('aria-pressed', 'true');
      look.tFov = look.fov = look.base; camera.fov = look.base; camera.updateProjectionMatrix();
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
      goTo(id, true);
    },
    sightCheck(fillAll) {
      const keep = state.sold;
      if (fillAll) { state.sold = new Set(); for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) state.sold.add(idOf(ri, n)); }
      const rc = new THREE.Raycaster(), out = [], targets = [cushion, backrest, arms, heads, torsos];
      for (let ri = 0; ri < 12; ri++) for (let n = 1; n <= PER_ROW; n++) {
        current = idOf(ri, n); refreshSeats(); targets.forEach(t => t.updateMatrixWorld(true));
        const e = eyeOf(ri, n), o = new V(e.x, e.y, e.z); let blocked = 0;
        for (let k = 0; k <= 4; k++) {
          const p = new V(-SCR.w / 2 + SCR.w * k / 4, SCR.bottom + 0.1, SCR.z), d = p.clone().sub(o), L = d.length();
          rc.set(o, d.normalize()); rc.near = 0.35; rc.far = L;
          if (rc.intersectObjects(targets, false).length) blocked++;
        }
        if (blocked) out.push(current + ':' + blocked);
      }
      state.sold = keep; refreshSeats();
      return out;
    },
    exit() { clearTimeout(autoDim); if (Snd.ctx) Snd.toggle(false); $('pvSound').setAttribute('aria-pressed', 'false'); document.querySelectorAll('.seat.viewing').forEach(b => b.classList.remove('viewing')); },
    stop() { running = false; }
  };
}
