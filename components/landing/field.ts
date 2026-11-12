import * as THREE from 'three';

/**
 * The landing-page "field": real-time glossy spheres (Three.js, MeshPhysicalMaterial)
 * that follow scroll progress:
 *   0 float in a cluster → 1 fall and bounce → 2 gather into a map pin → 3 rush into the lens.
 * Colours morph emerald → jade → Jaipur gold. The cursor pushes spheres away.
 * Physics adapted from the "Gravity" reference: Verlet-style integration, 4 collision sub-steps.
 */

export interface FieldControl {
  progress: number;
  started: boolean;
}
export interface Pointer {
  x: number;
  y: number;
  isDown: boolean;
}

type Role = 'pastel' | 'light' | 'medium' | 'deep' | 'glass';
type Palette = Record<Role, THREE.Color>;
const ROLES: Role[] = ['pastel', 'light', 'medium', 'deep', 'glass'];

const pal = (p: Record<Role, string>): Palette =>
  Object.fromEntries(ROLES.map((r) => [r, new THREE.Color(p[r])])) as Palette;

const EMERALD = pal({ pastel: '#A8EDCB', light: '#7FE3B6', medium: '#2FBF85', deep: '#0E6B47', glass: '#5FF0B2' });
const JADE = pal({ pastel: '#A6EFE3', light: '#6FE0CD', medium: '#1FAF98', deep: '#0B5E54', glass: '#4FE3CC' });
const GOLD = pal({ pastel: '#F3DFA6', light: '#F2D489', medium: '#D9B45A', deep: '#9A7425', glass: '#F5D37A' });

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Map-pin silhouette: a round head with a hole, tapering to a point. Unit box x∈[-1,1], y∈[-1.55,1.45]. */
export function inPin(x: number, y: number): boolean {
  const hx = x;
  const hy = y - 0.45;
  const inHead = hx * hx + hy * hy <= 1;
  const inHole = hx * hx + hy * hy < 0.42 * 0.42;
  const inTail = y >= -1.55 && y <= 0.45 && Math.abs(x) <= 0.9 * ((y + 1.55) / 2.0);
  return (inHead || inTail) && !inHole;
}

interface Ball {
  id: number;
  radius: number;
  mass: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  meshGroup: THREE.Group;
  sphere: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  role: Role;
  isGlass: boolean;
  visualScale: number;
  shapeTarget: THREE.Vector3;
}

export function createField(opts: {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  control: FieldControl;
  pointer: Pointer;
  onReady: () => void;
}): () => void {
  const { canvas, container, control, pointer, onReady } = opts;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemiLight = new THREE.HemisphereLight(0xffffff, EMERALD.medium.clone(), 1.6);
  scene.add(hemiLight);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(-6, 10, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { near: 0.5, far: 30, left: -8, right: 8, top: 8, bottom: -8 });
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.radius = 12;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.25);
  rimLight.position.set(8, 7, -8);
  scene.add(rimLight);
  const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
  frontLight.position.set(0, 0, 11);
  scene.add(frontLight);
  const sideBounceLight = new THREE.DirectionalLight(0xffffff, 0.3);
  sideBounceLight.position.set(-9, -2, 4);
  scene.add(sideBounceLight);

  let viewportWidth = 10;
  let viewportHeight = 6;
  const updateFrustumBounds = () => {
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    viewportHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
    viewportWidth = viewportHeight * (container.clientWidth / container.clientHeight);
  };
  updateFrustumBounds();

  const ballCount = window.innerWidth < 768 ? 54 : 96;
  const palette = EMERALD;
  const curPal: Palette = { pastel: new THREE.Color(), light: new THREE.Color(), medium: new THREE.Color(), deep: new THREE.Color(), glass: new THREE.Color() };

  const sphereGeometry = new THREE.SphereGeometry(1, 36, 36);
  const balls: Ball[] = [];
  for (let i = 0; i < ballCount; i++) {
    const rand = Math.random();
    const radius = rand < 0.3 ? 0.27 + Math.random() * 0.12 : rand < 0.8 ? 0.42 + Math.random() * 0.18 : 0.66 + Math.random() * 0.21;
    const isGlass = Math.random() < 0.22;
    let role: Role = 'medium';
    let material: THREE.MeshPhysicalMaterial;
    if (isGlass) {
      role = 'glass';
      material = new THREE.MeshPhysicalMaterial({
        color: palette.glass, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
        transmission: 0.95, ior: 1.485, thickness: 2.2, specularColor: new THREE.Color('#ffffff'), specularIntensity: 1,
        attenuationColor: palette.pastel, attenuationDistance: 1, emissive: palette.glass, emissiveIntensity: 0.18, transparent: true,
      });
    } else {
      const c = Math.random();
      role = c < 0.25 ? 'pastel' : c < 0.55 ? 'light' : c < 0.85 ? 'medium' : 'deep';
      material = new THREE.MeshPhysicalMaterial({
        color: palette[role], roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3,
        emissive: palette[role], emissiveIntensity: 0.1, transparent: true,
      });
    }
    const group = new THREE.Group();
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.scale.setScalar(radius);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    group.add(sphere);
    scene.add(group);
    balls.push({
      id: i, radius, mass: Math.pow(radius, 3), position: new THREE.Vector3(), velocity: new THREE.Vector3(),
      meshGroup: group, sphere, material, role, isGlass, visualScale: radius, shapeTarget: new THREE.Vector3(),
    });
  }
  const meanRadius = balls.reduce((s, b) => s + b.radius, 0) / balls.length;
  let shapeScale = 1;

  const assignPinTargets = () => {
    const S = Math.min(viewportWidth * 0.3, viewportHeight * 0.235);
    const baseCY = -viewportHeight * 0.02;
    shapeScale = Math.max(0.3, Math.min(1, (S * 0.33 / 2.3) / meanRadius));
    for (const b of balls) {
      let x = 0;
      let y = 0;
      let tries = 0;
      do {
        x = (Math.random() * 2 - 1) * 1.02;
        y = Math.random() * 3.05 - 1.58;
        tries++;
      } while (!inPin(x, y) && tries < 80);
      b.shapeTarget.set(x * S, (y + 0.05) * S + baseCY, (Math.random() - 0.5) * 0.35);
    }
  };
  assignPinTargets();

  const scatterFar = (inward: boolean) => {
    const R = Math.max(viewportWidth, viewportHeight) * 1.5;
    for (const b of balls) {
      const a = Math.random() * Math.PI * 2;
      const px = Math.cos(a) * R * 1.25;
      const py = Math.sin(a) * R * 0.85;
      const pz = (Math.random() - 0.5) * 4;
      b.position.set(px, py, pz);
      b.meshGroup.position.copy(b.position);
      if (inward) b.velocity.set(-px, -py, -pz).normalize().multiplyScalar(0.08 + Math.random() * 0.05);
      else b.velocity.set(0, 0, 0);
    }
  };
  scatterFar(false);

  const params = { rebound: -0.3, mouseRepelForce: 0.05, mouseRepelRadius: 4.4, centerAttractForce: 0.0035, bounciness: 0.02 };

  const mouseProjVec = new THREE.Vector3();
  const mouseWorld3D = new THREE.Vector3();
  const updateMouse3D = () => {
    mouseProjVec.set(pointer.x, pointer.y, 0.5).unproject(camera);
    const dir = mouseProjVec.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    mouseWorld3D.copy(camera.position).add(dir.multiplyScalar(distance));
  };

  let frame = 0;
  const clock = new THREE.Clock();
  let localStarted = false;
  let entranceStart = 0;
  let reportedReady = false;
  const diffVec = new THREE.Vector3();
  const collideDiff = new THREE.Vector3();
  const relVel = new THREE.Vector3();
  const deltaPos = new THREE.Vector3();
  const rotAxis = new THREE.Vector3();
  const prevMouseWorld = new THREE.Vector3();

  // Adaptive quality: if frames are slow, step down (resolution → shadows → glass) so the motion stays smooth.
  let quality = 3;
  let frames = 0;
  let windowStart = performance.now();
  const stepDown = () => {
    quality--;
    if (quality === 2) renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    if (quality === 1) {
      renderer.shadowMap.enabled = false;
      balls.forEach((b) => (b.material.needsUpdate = true));
    }
    if (quality === 0) {
      renderer.setPixelRatio(0.75);
      balls.forEach((b) => {
        if (b.isGlass) {
          b.material.transmission = 0;
          b.material.opacity = 0.85;
          b.material.needsUpdate = true;
        }
      });
    }
  };
  const watchSpeed = () => {
    frames++;
    const elapsed = performance.now() - windowStart;
    if (elapsed < 1000 || frames < 5) return;
    const ms = elapsed / frames;
    if (ms > 22 && quality > 0) stepDown();
    frames = 0;
    windowStart = performance.now();
  };

  const tick = () => {
    frame = requestAnimationFrame(tick);
    watchSpeed();
    const time = clock.getElapsedTime();
    updateMouse3D();

    if (control.started && !localStarted) {
      localStarted = true;
      entranceStart = time;
      scatterFar(true);
    }
    if (!localStarted) {
      renderer.render(scene, camera);
      if (!reportedReady) {
        reportedReady = true;
        onReady();
      }
      return;
    }

    const progress = control.progress;
    const heroF = 1 - smoothstep(0.3, 0.8, progress);
    const dropRaw = smoothstep(0.4, 0.95, progress);
    const flyF = smoothstep(2.7, 3.45, progress);
    const shapeF = smoothstep(1.4, 2.05, progress) * (1 - smoothstep(2.55, 3.0, progress));
    const dropF = dropRaw * (1 - smoothstep(1.25, 1.75, progress));

    const bJade = smoothstep(0.55, 1.05, progress);
    const bGold = smoothstep(1.4, 1.95, progress);
    for (const role of ROLES) curPal[role].copy(EMERALD[role]).lerp(JADE[role], bJade).lerp(GOLD[role], bGold);
    hemiLight.groundColor.copy(curPal.medium);

    const entranceT = easeOutCubic(clamp01((time - entranceStart) / 2.2));
    const attractionBoost = lerp(7.5, 1, entranceT);
    const interacting = Math.abs(pointer.x) < 0.99 || Math.abs(pointer.y) < 0.99;
    let mouseSpeed = interacting ? mouseWorld3D.distanceTo(prevMouseWorld) : 0;
    if (mouseSpeed > 3) mouseSpeed = 3;
    prevMouseWorld.copy(mouseWorld3D);

    let damping = 0.91;
    damping = lerp(damping, 0.992, dropF);
    damping = lerp(damping, 0.9, shapeF);
    damping = lerp(damping, 0.985, flyF);
    const camZ = camera.position.z;
    const clusterActive = Math.max(heroF, entranceT < 1 ? 1 : 0);

    for (const b of balls) {
      if (heroF > 0.01) {
        b.velocity.x += Math.sin(time * 0.4 + b.id * 1.5) * 0.0004 * b.radius * heroF;
        b.velocity.y += Math.cos(time * 0.5 + b.id * 1.2) * 0.0004 * b.radius * heroF;
        b.velocity.z += Math.sin(time * 0.35 + b.id) * 0.0001 * heroF;
      }
      const cs = params.centerAttractForce * attractionBoost * clusterActive;
      if (cs > 0.00001) {
        b.velocity.x += -b.position.x * cs * 0.38;
        b.velocity.y += -b.position.y * cs * 1.85;
        b.velocity.z += -b.position.z * cs * 1.8;
      }
      if (dropF > 0.001) b.velocity.y -= 0.011 * dropF;
      if (shapeF > 0.001) {
        const k = 0.06 * shapeF;
        b.velocity.x += (b.shapeTarget.x - b.position.x) * k;
        b.velocity.y += (b.shapeTarget.y - b.position.y) * k;
        b.velocity.z += (b.shapeTarget.z - b.position.z) * k;
      }
      if (flyF > 0.001) {
        const stagger = (b.id * 0.6180339887) % 1;
        const local = smoothstep(stagger * 0.55, stagger * 0.55 + 0.45, flyF);
        b.velocity.z += 0.05 * local;
        b.velocity.x += b.position.x * 0.006 * local;
        b.velocity.y += b.position.y * 0.006 * local;
      }
      if (interacting) {
        diffVec.subVectors(b.position, mouseWorld3D);
        const rawDist = diffVec.length();
        const radius = pointer.isDown ? params.mouseRepelRadius * 1.4 : params.mouseRepelRadius;
        const force = pointer.isDown ? params.mouseRepelForce * 1.7 : params.mouseRepelForce;
        if (rawDist < radius && rawDist > 0.0001) {
          const ratio = rawDist / radius;
          const smooth = 1 - ratio * ratio * (3 - 2 * ratio);
          const push = smooth * force * (1 + mouseSpeed * 3.2);
          diffVec.normalize();
          diffVec.z *= 0.12;
          diffVec.normalize();
          b.velocity.addScaledVector(diffVec, push);
        }
      }
      b.velocity.multiplyScalar(damping);
      b.position.add(b.velocity);

      const c = curPal[b.role];
      b.material.color.copy(c);
      b.material.emissive.copy(c);
      b.material.opacity = flyF > 0.001 ? 1 - smoothstep(camZ - 2.6, camZ - 0.3, b.position.z) : 1;
      const targetVis = b.radius * (1 - (1 - shapeScale) * shapeF);
      b.visualScale += (targetVis - b.visualScale) * 0.12;
      b.sphere.scale.setScalar(b.visualScale);
    }

    const collideScale = 0.28 * (1 - 0.93 * shapeF) * (1 - flyF);
    for (let step = 0; step < 4; step++) {
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];
          collideDiff.subVectors(b2.position, b1.position);
          const dist = collideDiff.length();
          const minDist = b1.visualScale + b2.visualScale;
          if (dist < minDist && dist > 0.001) {
            const overlap = minDist - dist;
            collideDiff.multiplyScalar(1 / dist);
            const total = b1.mass + b2.mass;
            b1.position.addScaledVector(collideDiff, -overlap * (b2.mass / total) * collideScale);
            b2.position.addScaledVector(collideDiff, overlap * (b1.mass / total) * collideScale);
            relVel.subVectors(b2.velocity, b1.velocity);
            const vn = relVel.dot(collideDiff);
            if (vn < -0.0001) {
              const impulse = (-(1 + params.bounciness) * vn) / (1 / b1.mass + 1 / b2.mass);
              b1.velocity.addScaledVector(collideDiff, -impulse / b1.mass);
              b2.velocity.addScaledVector(collideDiff, impulse / b2.mass);
            }
          }
        }
      }
    }

    const xBound = viewportWidth / 2 - 0.2;
    const topY = viewportHeight / 2 - 0.05;
    const floorY = -viewportHeight / 2 + 0.05;
    const restitution = 0.3 + 0.35 * dropF;
    const contain = flyF < 0.5;
    const zContain = flyF < 0.02;
    for (const b of balls) {
      const r = b.visualScale;
      if (contain) {
        if (b.position.x < -xBound - r) { b.position.x = -xBound - r; b.velocity.x *= params.rebound; }
        else if (b.position.x > xBound + r) { b.position.x = xBound + r; b.velocity.x *= params.rebound; }
        if (b.position.y - r < floorY) {
          b.position.y = floorY + r;
          if (b.velocity.y < 0) b.velocity.y = -b.velocity.y * restitution;
          if (dropF > 0.3) { b.velocity.x *= 0.86; b.velocity.z *= 0.86; }
        }
        if (b.position.y + r > topY) {
          b.position.y = topY - r;
          if (b.velocity.y > 0) b.velocity.y *= params.rebound;
        }
      }
      if (zContain) {
        if (b.position.z < -2) { b.position.z = -2; b.velocity.z *= params.rebound; }
        else if (b.position.z > 2) { b.position.z = 2; b.velocity.z *= params.rebound; }
      }
      deltaPos.copy(b.position).sub(b.meshGroup.position);
      if (deltaPos.lengthSq() > 0.000001) {
        rotAxis.set(deltaPos.y, -deltaPos.x, 0).normalize();
        b.meshGroup.rotateOnWorldAxis(rotAxis, (deltaPos.length() / b.radius) * 0.95);
      }
      b.meshGroup.position.copy(b.position);
    }

    renderer.render(scene, camera);
    if (!reportedReady) {
      reportedReady = true;
      onReady();
    }
  };
  tick();

  const handleResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    updateFrustumBounds();
    assignPinTargets();
  };
  const ro = new ResizeObserver(handleResize);
  ro.observe(container);

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    sphereGeometry.dispose();
    balls.forEach((b) => b.material.dispose());
    renderer.dispose();
  };
}
