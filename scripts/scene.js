/* 3D hero scene (three.js). Loaded lazily by main.js; the page looks complete
   without it. Modes: "orbit" (home hero — rings, satellites, floating tags)
   and "ambient" (inner-page banners — lighter, calmer).

   Performance guardrails: capped pixel ratio, pauses when off-screen or the tab
   is hidden, draws a single still frame for prefers-reduced-motion, and drops
   resolution automatically if frames run slow. */
import * as THREE from "../assets/three.module.min.js";

const ORANGE = [1.0, 0.54, 0.17];
const CYAN = [0.22, 0.82, 1.0];
const BLUE = [0.36, 0.55, 1.0];
const WHITE = [0.9, 0.95, 1.0];

const POINT_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPx;
  uniform float uScale;
  uniform float uTwinkle;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = mix(1.0, 0.55 + 0.45 * sin(uTime * (0.5 + aPhase * 1.4) + aPhase * 40.0), uTwinkle);
    vColor = aColor;
    vAlpha = aAlpha * tw;
    gl_PointSize = max(aSize * uPx * (uScale / -mv.z), 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(1.0, 0.0, d);
    float a = core * core;
    gl_FragColor = vec4(vColor * (0.65 + 0.6 * core), a * vAlpha * uOpacity);
  }
`;

function pointMaterial({ scale, twinkle = 0, opacity = 1 }) {
  return new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPx: { value: 1 },
      uScale: { value: scale },
      uTwinkle: { value: twinkle },
      uOpacity: { value: opacity }
    }
  });
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function buildPoints({ count, place, size, alpha, color, material }) {
  const position = new Float32Array(count * 3);
  const aSize = new Float32Array(count);
  const aAlpha = new Float32Array(count);
  const aPhase = new Float32Array(count);
  const aColor = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    place(position, i * 3);
    aSize[i] = size();
    aAlpha[i] = alpha();
    aPhase[i] = Math.random();
    const c = color();
    aColor.set(c, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(aColor, 3));
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

/* A glowing head plus a fading trail, updated on the CPU each frame. */
function createBody({ material, trailCount, headSize, color }) {
  const count = trailCount + 1;
  const position = new Float32Array(count * 3);
  const aSize = new Float32Array(count);
  const aAlpha = new Float32Array(count);
  const aPhase = new Float32Array(count);
  const aColor = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const t = i / trailCount;
    const head = i === 0;
    aSize[i] = head ? headSize : headSize * 0.55 * (1 - t) + 1.5;
    aAlpha[i] = head ? 1 : Math.pow(1 - t, 2.2) * 0.6;
    aColor.set(head ? WHITE : color, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(aAlpha, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(aColor, 3));
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, position: geometry.attributes.position, count };
}

export function mountScene(host) {
  const orbitMode = host.dataset.scene === "orbit";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(pointer: coarse)");
  const section = host.closest("section") || host.parentElement;
  const card = section.querySelector(".hero-profile");
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch {
    return;
  }

  let maxPixelRatio = lowPower ? 1.25 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 0, 11);

  /* ----- starfield + dust ----- */
  const starMaterial = pointMaterial({ scale: 46, twinkle: 1 });
  const starColors = [WHITE, WHITE, WHITE, BLUE, CYAN, ORANGE];
  const stars = buildPoints({
    count: orbitMode ? (lowPower ? 700 : 1100) : 520,
    place: (arr, o) => {
      const r = rand(28, 90);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(rand(-1, 1));
      arr[o] = r * Math.sin(phi) * Math.cos(theta);
      arr[o + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      arr[o + 2] = -Math.abs(r * Math.cos(phi)) - 6;
    },
    size: () => rand(1.6, 6),
    alpha: () => rand(0.35, 1),
    color: () => starColors[(Math.random() * starColors.length) | 0],
    material: starMaterial
  });
  scene.add(stars);

  const dustMaterial = pointMaterial({ scale: 9, twinkle: 0.6, opacity: 0.9 });
  const dust = buildPoints({
    count: orbitMode ? 46 : 22,
    place: (arr, o) => {
      arr[o] = rand(-12, 12);
      arr[o + 1] = rand(-6, 6);
      arr[o + 2] = rand(-6, 5);
    },
    size: () => rand(12, 42),
    alpha: () => rand(0.03, 0.11),
    color: () => (Math.random() > 0.5 ? ORANGE : BLUE),
    material: dustMaterial
  });
  scene.add(dust);

  /* ----- core: wire planet, rings, satellites ----- */
  const core = new THREE.Group();
  scene.add(core);

  const wireMaterial = new THREE.LineBasicMaterial({
    color: 0x5b8cff,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.75, 2)), wireMaterial);
  core.add(wire);

  const wireInnerMaterial = wireMaterial.clone();
  wireInnerMaterial.color.set(0xff8a2b);
  wireInnerMaterial.opacity = 0.2;
  const wireInner = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.OctahedronGeometry(1.15, 1)),
    wireInnerMaterial
  );
  core.add(wireInner);

  const halo = buildPoints({
    count: 1,
    place: (arr, o) => {
      arr[o] = arr[o + 1] = arr[o + 2] = 0;
    },
    size: () => 340,
    alpha: () => 0.16,
    color: () => ORANGE,
    material: pointMaterial({ scale: 11, opacity: 1 })
  });
  core.add(halo);

  const ringDefs = orbitMode
    ? [
        { radius: 2.75, rot: [1.15, 0.15, 0.3], speed: 0.42, color: 0xff8a2b, vec: ORANGE, opacity: 0.55, tag: "GNC" },
        { radius: 3.55, rot: [1.35, -0.3, -0.55], speed: -0.3, color: 0x38d0ff, vec: CYAN, opacity: 0.42, tag: "Systems" },
        { radius: 4.15, rot: [0.95, 0.4, 0.9], speed: 0.2, color: 0x8fb0ff, vec: BLUE, opacity: 0.3, tag: "CFD" }
      ]
    : [
        { radius: 2.9, rot: [1.2, 0.2, 0.4], speed: 0.32, color: 0xff8a2b, vec: ORANGE, opacity: 0.5 },
        { radius: 3.9, rot: [1.0, -0.35, -0.6], speed: -0.22, color: 0x5b8cff, vec: BLUE, opacity: 0.32 }
      ];

  const bodyMaterial = pointMaterial({ scale: 10.5, opacity: 1 });
  const bodies = ringDefs.map((def) => {
    const group = new THREE.Group();
    group.rotation.set(def.rot[0], def.rot[1], def.rot[2]);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius, 0.0055, 6, 320),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: def.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      })
    );
    group.add(ring);
    const body = createBody({ material: bodyMaterial, trailCount: 46, headSize: 26, color: def.vec });
    group.add(body.points);
    core.add(group);
    return { def, group, body, angle: Math.random() * Math.PI * 2 };
  });

  /* ----- flight arc with a travelling marker ----- */
  const arcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7.5, -3.2, 1.5),
    new THREE.Vector3(-3.2, -1.2, 3),
    new THREE.Vector3(1.8, 0.6, 2.5),
    new THREE.Vector3(7.2, 3.4, -1)
  ]);
  const arcLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcCurve.getPoints(140)),
    new THREE.LineDashedMaterial({
      color: 0xff8a2b,
      dashSize: 0.16,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    })
  );
  arcLine.computeLineDistances();
  core.add(arcLine);
  const marker = createBody({ material: bodyMaterial, trailCount: 30, headSize: 22, color: ORANGE });
  core.add(marker.points);

  /* ----- floating labels pinned to satellites (orbit mode) ----- */
  const tags = [];
  if (orbitMode) {
    ringDefs.forEach((def, i) => {
      const el = document.createElement("span");
      el.className = "orbit-tag";
      el.setAttribute("aria-hidden", "true");
      el.textContent = def.tag;
      host.append(el);
      tags.push({ el, index: i });
    });
  }

  /* ----- layout: pin the core behind the portrait card ----- */
  const tmp = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  let unitsPerPx = 0.01;
  let width = 1;
  let height = 1;

  function layout() {
    const hb = host.getBoundingClientRect();
    width = Math.max(hb.width, 1);
    height = Math.max(hb.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    unitsPerPx = (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z) / height;

    let cx = 0.58;
    let cy = 0.05;
    let scale = (height * 0.85 * unitsPerPx) / 7.1;

    if (card) {
      const cb = card.getBoundingClientRect();
      if (cb.width > 0) {
        cx = ((cb.left + cb.width / 2 - hb.left) / width) * 2 - 1;
        cy = -(((cb.top + cb.height / 2 - hb.top) / height) * 2 - 1);
        scale = (cb.height * 1.42 * unitsPerPx) / 7.1;
      }
    } else {
      cx = width > 900 ? 0.55 : 0.2;
      cy = 0.1;
    }
    tmp.set(cx, cy, 0.5).unproject(camera);
    tmpDir.copy(tmp).sub(camera.position).normalize();
    const t = -camera.position.z / tmpDir.z;
    core.position.copy(camera.position).addScaledVector(tmpDir, t);
    core.scale.setScalar(Math.min(Math.max(scale, 0.35), 1.6));
    core.userData.base = core.position.clone();
  }

  /* ----- interaction ----- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function onPointerMove(event) {
    if (reduced.matches || coarse.matches) {
      return;
    }
    const hb = host.getBoundingClientRect();
    pointer.tx = ((event.clientX - hb.left) / hb.width) * 2 - 1;
    pointer.ty = ((event.clientY - hb.top) / hb.height) * 2 - 1;
  }
  section.addEventListener("pointermove", onPointerMove);

  /* ----- frame loop ----- */
  const uniforms = [starMaterial, dustMaterial, bodyMaterial, halo.material].map((m) => m.uniforms);
  let raf = 0;
  let visible = true;
  let time = 0;
  let last = performance.now();
  let sampled = 0;
  let frameSum = 0;

  function place(bodyDef, angle) {
    const { def, body } = bodyDef;
    const dir = Math.sign(def.speed);
    for (let i = 0; i < body.count; i += 1) {
      const a = angle - dir * (i / (body.count - 1)) * 0.95 * (i === 0 ? 0 : 1);
      body.position.setXYZ(i, Math.cos(a) * def.radius, Math.sin(a) * def.radius, 0);
    }
    body.position.needsUpdate = true;
  }

  function placeMarker(progress) {
    for (let i = 0; i < marker.count; i += 1) {
      const p = arcCurve.getPoint(Math.max(progress - i * 0.006, 0));
      marker.position.setXYZ(i, p.x, p.y, p.z);
    }
    marker.position.needsUpdate = true;
  }

  const world = new THREE.Vector3();

  function updateTags() {
    if (!tags.length) {
      return;
    }
    const show = width > 760 && !reduced.matches;
    tags.forEach(({ el, index }) => {
      if (!show) {
        el.style.opacity = "0";
        return;
      }
      const bodyDef = bodies[index];
      const head = bodyDef.body.position;
      world.set(head.getX(0), head.getY(0), head.getZ(0));
      bodyDef.group.localToWorld(world);
      const depth = (world.z - core.position.z) / (4.6 * core.scale.x);
      world.project(camera);
      const x = (world.x * 0.5 + 0.5) * width;
      const y = (-world.y * 0.5 + 0.5) * height;
      const front = Math.min(Math.max((depth + 0.15) / 0.7, 0), 1);
      const room = Math.min(x - 24, width - 120 - x, y - 100, height - 60 - y);
      const inside = Math.min(Math.max(room / 60, 0), 1);
      el.style.opacity = String((front * inside * 0.95).toFixed(2));
      el.style.transform = `translate3d(${(x + 16).toFixed(1)}px, ${(y - 12).toFixed(1)}px, 0)`;
    });
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    const frameMs = now - last;
    last = now;
    const still = reduced.matches;
    if (!still) {
      time += dt;
    }

    /* auto quality: if the first ~90 frames are slow, drop resolution once */
    if (sampled < 90 && !still) {
      sampled += 1;
      frameSum += frameMs;
      if (sampled === 90) {
        const average = frameSum / sampled;
        if (average > 30 && maxPixelRatio > 1) {
          maxPixelRatio = 1;
          renderer.setPixelRatio(1);
          layout();
        }
      }
    }

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const scrollTilt = Math.min(window.scrollY, window.innerHeight) * 0.0009;

    bodies.forEach((b) => {
      b.angle += b.def.speed * dt;
      place(b, b.angle);
    });
    placeMarker(((time * 0.11) % 1.25) - 0.05);

    core.rotation.y = time * 0.05 + pointer.x * 0.35;
    core.rotation.x = -pointer.y * 0.22 + scrollTilt;
    wire.rotation.y = time * 0.12;
    wire.rotation.x = time * 0.05;
    wireInner.rotation.y = -time * 0.18;
    wireInner.rotation.z = time * 0.07;
    stars.rotation.y = time * 0.004 + pointer.x * 0.03;
    stars.rotation.x = pointer.y * 0.015;
    dust.position.x = -pointer.x * 0.5;
    dust.position.y = pointer.y * 0.3;
    camera.position.x = pointer.x * 0.25;
    camera.position.y = -pointer.y * 0.18;
    camera.lookAt(0, 0, 0);

    uniforms.forEach((u) => {
      u.uTime.value = time;
      u.uPx.value = renderer.getPixelRatio();
    });

    renderer.render(scene, camera);
    updateTags();

    if (!still && visible && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  }

  function schedule() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    layout();
    schedule();
  });
  resizeObserver.observe(host);
  if (card) {
    resizeObserver.observe(card);
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) {
      schedule();
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(host);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!document.hidden && visible) {
      schedule();
    }
  });

  reduced.addEventListener("change", schedule);

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    host.classList.remove("is-ready");
  });

  layout();
  time = reduced.matches ? 4 : 0;
  schedule();
  requestAnimationFrame(() => host.classList.add("is-ready"));
}
