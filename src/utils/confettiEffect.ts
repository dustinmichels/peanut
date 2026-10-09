import * as THREE from "three";

export interface ConfettiConfig {
  particleCount?: number;
  origin?: THREE.Vector3;
  gravity?: number;
  burstDuration?: number;
  collisionBody?: THREE.Object3D;
}

export interface ConfettiEffectHandle {
  readonly mesh: THREE.InstancedMesh;
  burst: (origin?: THREE.Vector3) => void;
  update: (deltaSeconds: number) => void;
  reset: () => void;
  dispose: () => void;
  readonly isPlaying: boolean;
}

interface ParticleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  age: number;
  lifetime: number;
  flutterFreq: number;
  flutterPhase: number;
  flutterAmp: number;
  landed: boolean;
  groundAge: number;
  groundLifetime: number;
  active: boolean;
}

// Festive funfetti confetti colors matching birthday hat sprinkles & theme
const CONFETTI_COLORS: number[] = [
  0xff2a70, // hot pink / magenta
  0xff4081, // vibrant candy pink
  0x00e5ff, // electric cyan
  0x00b0ff, // bright sky blue
  0xffd600, // sunny festive gold
  0xffea00, // bright yellow
  0xb388ff, // lavender lilac
  0x7c4dff, // royal purple
  0x76ff03, // neon lime green
  0x00e676, // vibrant mint
  0xff6d00, // celebratory tangerine
  0xff1744, // festive red
];
const BODY_BASE_Y = 0.75;
const BODY_HEIGHT = 2.45;
const BODY_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.06, 0.58],
  [0.18, 0.82],
  [0.32, 0.88],
  [0.5, 0.7],
  [0.7, 0.82],
  [0.85, 0.65],
  [0.92, 0.35],
  [0.97, 0.22],
  [1, 0],
];

function getBodyRadius(y: number): number {
  const v = (y - BODY_BASE_Y) / BODY_HEIGHT;
  if (v <= 0 || v >= 1) return 0;

  for (let i = 0; i < BODY_PROFILE.length - 1; i++) {
    const from = BODY_PROFILE[i];
    const to = BODY_PROFILE[i + 1];
    if (v >= from[0] && v <= to[0]) {
      const t = (v - from[0]) / (to[0] - from[0]);
      return THREE.MathUtils.lerp(from[1], to[1], t);
    }
  }
  return 0;
}

/**
 * Creates a high-performance, modular 3D confetti burst particle system.
 * Uses a single InstancedMesh (1 draw call) with zero per-frame allocations,
 * making it smooth and battery-friendly for mobile devices (e.g. iPhone 13 mini).
 */
export function createConfettiEffect(config: ConfettiConfig = {}): ConfettiEffectHandle {
  const particleCount = config.particleCount ?? 110;
  const gravity = config.gravity ?? -3.8;
  const collisionBody = config.collisionBody;

  // Single rectangular confetti paper ribbon geometry
  // Sized appropriately for Peanut's scale (~3 units tall)
  const geom = new THREE.PlaneGeometry(0.065, 0.11);

  // Double-sided physical/standard material for realistic paper flutter in scene lighting
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.38,
    metalness: 0.08,
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });

  const mesh = new THREE.InstancedMesh(geom, material, particleCount);
  mesh.name = "BirthdayConfettiMesh";
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.visible = false;
  mesh.frustumCulled = false;

  // Pre-assign colors across instances
  const color = new THREE.Color();
  for (let i = 0; i < particleCount; i++) {
    const hex = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    color.setHex(hex);
    mesh.setColorAt(i, color);
  }
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }

  // Pre-allocated particle pool
  const particles: ParticleState[] = new Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    particles[i] = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      vRotX: 0,
      vRotY: 0,
      vRotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      age: 0,
      lifetime: 10,
      flutterFreq: 8.0,
      flutterPhase: 0,
      flutterAmp: 0.25,
      active: false,
      landed: false,
      groundAge: 0,
      groundLifetime: 3,
    };
  }

  // Scratch objects for matrix updates to avoid garbage collection
  const dummyMatrix = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyQuat = new THREE.Quaternion();
  const dummyEuler = new THREE.Euler();
  const dummyScale = new THREE.Vector3();
  const bodyWorldInverse = new THREE.Matrix4();
  const bodyNormalMatrix = new THREE.Matrix3();
  const collisionLocal = new THREE.Vector3();
  const collisionNormal = new THREE.Vector3();
  const collisionWorld = new THREE.Vector3();

  // Hide all instances initially
  dummyMatrix.makeScale(0, 0, 0);
  for (let i = 0; i < particleCount; i++) {
    mesh.setMatrixAt(i, dummyMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  let isPlaying = false;

  function burst(origin?: THREE.Vector3) {
    const ox = origin ? origin.x : 0;
    const oy = origin ? origin.y : 0.34;
    const oz = origin ? origin.z : 0;

    isPlaying = true;
    mesh.visible = true;

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.active = true;
      p.age = 0;
      p.lifetime = 10;
      p.landed = false;
      p.groundAge = 0;
      p.groundLifetime = 2.5 + Math.random() * 1.5;

      // Slight emitter jitter around hat tip
      p.x = ox + (Math.random() - 0.5) * 0.05;
      p.y = oy + Math.random() * 0.04;
      p.z = oz + (Math.random() - 0.5) * 0.05;

      // Upward celebratory fountain velocity with conical spread
      const angle = Math.random() * Math.PI * 2;
      // Spread outwards radially
      const speedHoriz = 1.6 + Math.random() * 2.4;
      p.vx = Math.cos(angle) * speedHoriz;
      p.vz = Math.sin(angle) * speedHoriz;
      // A broad fountain clears Peanut's shoulders before fluttering down.
      p.vy = 1.5 + Math.random() * 1.8;

      // Randomized initial rotations
      p.rotX = Math.random() * Math.PI * 2;
      p.rotY = Math.random() * Math.PI * 2;
      p.rotZ = Math.random() * Math.PI * 2;

      // Fast 3D tumbling rotation speeds (fluttering paper ribbons)
      p.vRotX = (Math.random() - 0.5) * 22;
      p.vRotY = (Math.random() - 0.5) * 18;
      p.vRotZ = (Math.random() - 0.5) * 20;

      // Subtle varying dimensions for each confetti strip
      p.scaleX = 0.85 + Math.random() * 0.35;
      p.scaleY = 0.85 + Math.random() * 0.45;
      p.scaleZ = 1.0;

      // Aerodynamic lateral flutter oscillation
      p.flutterFreq = 6.0 + Math.random() * 6.0;
      p.flutterPhase = Math.random() * Math.PI * 2;
      p.flutterAmp = 0.2 + Math.random() * 0.35;
    }
  }

  function update(deltaSeconds: number) {
    if (!isPlaying) return;

    const dt = Math.min(deltaSeconds, 0.05);
    let anyActive = false;
    if (collisionBody) {
      collisionBody.updateWorldMatrix(true, false);
      bodyWorldInverse.copy(collisionBody.matrixWorld).invert();
      bodyNormalMatrix.getNormalMatrix(collisionBody.matrixWorld);
    }

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      if (!p.active) {
        dummyMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, dummyMatrix);
        continue;
      }

      p.age += dt;
      if (p.landed) {
        p.groundAge += dt;
      } else if (p.age >= p.lifetime) {
        p.active = false;
        dummyMatrix.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, dummyMatrix);
        continue;
      }

      anyActive = true;

      if (!p.landed) {
        // 1. Gravity and velocity damping (air resistance)
        p.vy += gravity * dt;
        const drag = Math.pow(0.96, dt * 60);
        p.vx *= drag;
        p.vz *= drag;
        if (p.vy < -1.8) {
          p.vy = -1.8;
        }

        // 2. Lateral flutter motion
        const flutterOffset = Math.sin(p.age * p.flutterFreq + p.flutterPhase) * p.flutterAmp * dt;

        // 3. Position update
        p.x += p.vx * dt + flutterOffset;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        // 4. Rotation tumbling update
        p.rotX += p.vRotX * dt;
        p.rotY += p.vRotY * dt;
        p.rotZ += p.vRotZ * dt;

        if (collisionBody) {
          collisionLocal.set(p.x, p.y, p.z).applyMatrix4(bodyWorldInverse);
          const radius = getBodyRadius(collisionLocal.y) + 0.035;
          const radialDistance = Math.hypot(collisionLocal.x, collisionLocal.z);

          if (radius > 0.035 && radialDistance < radius) {
            const radialX = radialDistance > 0.0001 ? collisionLocal.x / radialDistance : 1;
            const radialZ = radialDistance > 0.0001 ? collisionLocal.z / radialDistance : 0;
            const radiusBelow = getBodyRadius(collisionLocal.y - 0.01);
            const radiusAbove = getBodyRadius(collisionLocal.y + 0.01);
            const radiusSlope = (radiusAbove - radiusBelow) / 0.02;

            collisionLocal.x = radialX * radius;
            collisionLocal.z = radialZ * radius;
            collisionWorld.copy(collisionLocal).applyMatrix4(collisionBody.matrixWorld);
            p.x = collisionWorld.x;
            p.y = collisionWorld.y;
            p.z = collisionWorld.z;

            collisionNormal
              .set(radialX, -radiusSlope, radialZ)
              .normalize()
              .applyNormalMatrix(bodyNormalMatrix);
            const inwardSpeed =
              p.vx * collisionNormal.x + p.vy * collisionNormal.y + p.vz * collisionNormal.z;
            if (inwardSpeed < 0) {
              p.vx -= inwardSpeed * 1.12 * collisionNormal.x;
              p.vy -= inwardSpeed * 1.12 * collisionNormal.y;
              p.vz -= inwardSpeed * 1.12 * collisionNormal.z;
            }
            p.vx *= 0.72;
            p.vy *= 0.72;
            p.vz *= 0.72;
            p.vRotX *= 0.45;
            p.vRotY *= 0.45;
            p.vRotZ *= 0.45;
          }
        }

        if (p.y <= 0.004) {
          p.y = 0.004;
          p.landed = true;
          p.vx = 0;
          p.vy = 0;
          p.vz = 0;
          p.rotX = -Math.PI / 2;
          p.rotY = 0;
          p.rotZ = Math.random() * Math.PI * 2;
        }
      }

      // 5. Quick pop-in, then shrink away only after resting on the ground.
      let scaleFactor = 1.0;
      if (p.age < 0.12) {
        scaleFactor = p.age / 0.12;
      } else if (p.landed) {
        const remaining = p.groundLifetime - p.groundAge;
        if (remaining <= 0) {
          p.active = false;
          dummyMatrix.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, dummyMatrix);
          continue;
        }
        if (remaining < 0.8) {
          scaleFactor = remaining / 0.8;
        }
      }

      dummyPos.set(p.x, p.y, p.z);
      dummyEuler.set(p.rotX, p.rotY, p.rotZ);
      dummyQuat.setFromEuler(dummyEuler);
      dummyScale.set(p.scaleX * scaleFactor, p.scaleY * scaleFactor, p.scaleZ * scaleFactor);

      dummyMatrix.compose(dummyPos, dummyQuat, dummyScale);
      mesh.setMatrixAt(i, dummyMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (!anyActive) {
      isPlaying = false;
      mesh.visible = false;
    }
  }

  function reset() {
    isPlaying = false;
    mesh.visible = false;
    dummyMatrix.makeScale(0, 0, 0);
    for (let i = 0; i < particleCount; i++) {
      particles[i].active = false;
      mesh.setMatrixAt(i, dummyMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  function dispose() {
    reset();
    geom.dispose();
    material.dispose();
    mesh.dispose();
  }

  return {
    mesh,
    burst,
    update,
    reset,
    dispose,
    get isPlaying() {
      return isPlaying;
    },
  };
}
