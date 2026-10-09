import * as THREE from "three";
import type { MaterialModeId } from "../types/peanut";

export interface CowboyHatHandle {
  group: THREE.Group;
  setVisible: (visible: boolean) => void;
  toggle: () => boolean;
  setMaterialMode: (mode: MaterialModeId) => void;
  update: (deltaSeconds: number, jumpProgress?: number) => void;
  dispose: () => void;
  readonly isVisible: boolean;
}

/**
 * Calculates aerodynamic inertia lift and tilt for the cowboy hat during a jump.
 * Hat lifts up slightly above the head during ascent/apex, then falls back down
 * into seated rest position as peanut lands.
 */
export function getHatJumpOffset(p: number): { liftY: number; tiltX: number; tiltZ: number } {
  if (p <= 0 || p >= 1.0) {
    return { liftY: 0, tiltX: 0, tiltZ: 0 };
  }

  let liftY = 0;
  let tiltX = 0;
  let tiltZ = 0;

  if (p < 0.12) {
    // Crouch anticipation - hat dips down minutely
    const t = p / 0.12;
    liftY = -0.02 * Math.sin(t * Math.PI);
  } else if (p < 0.45) {
    // Launch: hat lifts up into the air above the head
    const t = (p - 0.12) / (0.45 - 0.12);
    const s = t * t * (3 - 2 * t);
    liftY = s * 0.48;
    tiltX = -0.16 * s;
    tiltZ = 0.08 * s;
  } else if (p < 0.65) {
    // Apex float: hat hovers slightly above head with subtle aerodynamic flutter
    const t = (p - 0.45) / (0.65 - 0.45);
    const floatWobble = Math.sin(t * Math.PI) * 0.04;
    liftY = 0.48 + floatWobble;
    tiltX = -0.16 + Math.sin(t * Math.PI) * 0.03;
    tiltZ = 0.08 - Math.sin(t * Math.PI) * 0.02;
  } else if (p < 0.88) {
    // Fall: hat accelerates downward towards head
    const t = (p - 0.65) / (0.88 - 0.65);
    const s = t * t * (3 - 2 * t);
    liftY = 0.48 * (1 - s);
    tiltX = -0.16 * (1 - s);
    tiltZ = 0.08 * (1 - s);
  } else {
    // Landing settle: gentle cushion bounce back into seated position
    const t = (p - 0.88) / (1.0 - 0.88);
    const settle = Math.sin(t * Math.PI) * 0.04 * (1 - t);
    liftY = settle;
    tiltX = settle * -0.5;
    tiltZ = settle * 0.3;
  }

  return { liftY, tiltX, tiltZ };
}

/**
 * Creates the curved western brim with upturned side curls and gentle front/back dip.
 * Dual-layered with stitched outer edge for solid manifold volume and soft shadow catching.
 */
function createBrimGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 48;
  const ringSegments = 10;
  const thickness = 0.026;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const rxIn = 0.8;
  const rzIn = 0.86;
  const rxOut = 1.48;
  const rzOut = 1.58;

  function getPoint(t: number, u: number, layerOffset: number) {
    const theta = u * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    const rx = rxIn + t * (rxOut - rxIn);
    const rz = rzIn + t * (rzOut - rzIn);
    const x = sinT * rx;
    const z = cosT * rz;

    // Side curl (+Y) on left/right and subtle front/back dip (-Y)
    const tCurve = Math.pow(t, 1.75);
    const ySide = sinT * sinT * 0.38 * tCurve;
    const yDip = -cosT * cosT * 0.07 * t;
    const y = ySide + yDip + layerOffset;

    return { x, y, z };
  }

  const ringStride = radialSegments + 1;

  // 1. Top surface
  for (let j = 0; j <= ringSegments; j++) {
    const t = j / ringSegments;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const pt = getPoint(t, u, thickness * 0.5);
      vertices.push(pt.x, pt.y, pt.z);
      uvs.push(u, t);
    }
  }

  for (let j = 0; j < ringSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * ringStride + i;
      const b = (j + 1) * ringStride + i;
      const c = (j + 1) * ringStride + (i + 1);
      const d = j * ringStride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // 2. Bottom surface
  const bottomOffset = vertices.length / 3;
  for (let j = 0; j <= ringSegments; j++) {
    const t = j / ringSegments;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const pt = getPoint(t, u, -thickness * 0.5);
      vertices.push(pt.x, pt.y, pt.z);
      uvs.push(u, t);
    }
  }

  for (let j = 0; j < ringSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = bottomOffset + j * ringStride + i;
      const b = bottomOffset + (j + 1) * ringStride + i;
      const c = bottomOffset + (j + 1) * ringStride + (i + 1);
      const d = bottomOffset + j * ringStride + (i + 1);
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  // 3. Stitched outer rim
  const topOuterStart = ringSegments * ringStride;
  const bottomOuterStart = bottomOffset + ringSegments * ringStride;
  for (let i = 0; i < radialSegments; i++) {
    const t1 = topOuterStart + i;
    const t2 = topOuterStart + i + 1;
    const b1 = bottomOuterStart + i;
    const b2 = bottomOuterStart + i + 1;
    indices.push(t1, t2, b1);
    indices.push(t2, b2, b1);
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the tapered crown with a cattleman crease along the top center and side pinch dents.
 */
function createCrownGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 48;
  const heightSegments = 24;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const crownHeight = 0.72;
  const baseRx = 0.8;
  const baseRz = 0.86;
  const topRx = 0.62;
  const topRz = 0.68;

  const ringStride = radialSegments + 1;

  // 1. Crown cylinder wall with side pinch depressions
  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    const yBase = v * crownHeight;

    const rx = baseRx + (topRx - baseRx) * Math.pow(v, 0.85);
    const rz = baseRz + (topRz - baseRz) * Math.pow(v, 0.85);

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let px = sinT * rx;
      let py = yBase;
      let pz = cosT * rz;

      // Pinch dents on front-left and front-right (z > 0.05, theta around +- 40-75 degrees)
      if (v > 0.25 && v < 0.95 && pz > 0.04) {
        const pinchHeightWeight = Math.sin(((v - 0.25) / 0.7) * Math.PI);
        const pinchAngleWeight = Math.pow(Math.abs(sinT), 1.6) * Math.max(0, cosT);
        const pinchAmount = 0.07 * pinchHeightWeight * pinchAngleWeight;
        px *= 1.0 - pinchAmount;
        pz *= 1.0 - pinchAmount * 0.75;
      }

      // Cattleman crease top profile transition near upper wall
      if (v >= 0.82) {
        const topWeight = (v - 0.82) / 0.18;
        const centerCrease = Math.exp(-Math.pow(px / 0.16, 2)) * 0.09 * topWeight;
        const ridgeLeft = Math.exp(-Math.pow((px + 0.22) / 0.11, 2)) * 0.035 * topWeight;
        const ridgeRight = Math.exp(-Math.pow((px - 0.22) / 0.11, 2)) * 0.035 * topWeight;
        py = py - centerCrease + ridgeLeft + ridgeRight;
      }

      vertices.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * ringStride + i;
      const b = (j + 1) * ringStride + i;
      const c = (j + 1) * ringStride + (i + 1);
      const d = j * ringStride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // 2. Top cap with center cattleman valley and parallel ridges
  const capRings = 8;
  const topWallStart = heightSegments * ringStride;
  const capOffset = vertices.length / 3;

  for (let j = 1; j <= capRings; j++) {
    const ringFrac = 1.0 - j / capRings;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const px = sinT * topRx * ringFrac;
      const pz = cosT * topRz * ringFrac;
      let py = crownHeight;

      const normZ = Math.min(1.0, Math.abs(pz) / topRz);
      const zFade = Math.sqrt(Math.max(0, 1.0 - Math.pow(normZ, 2)));
      const centerCrease = Math.exp(-Math.pow(px / 0.16, 2)) * 0.09 * zFade;
      const ridgeLeft = Math.exp(-Math.pow((px + 0.22) / 0.11, 2)) * 0.035 * zFade;
      const ridgeRight = Math.exp(-Math.pow((px - 0.22) / 0.11, 2)) * 0.035 * zFade;

      py = py - centerCrease + ridgeLeft + ridgeRight;

      vertices.push(px, py, pz);
      uvs.push(u, ringFrac);
    }
  }

  // Connect wall top to cap ring 1
  for (let i = 0; i < radialSegments; i++) {
    const w1 = topWallStart + i;
    const w2 = topWallStart + i + 1;
    const c1 = capOffset + i;
    const c2 = capOffset + i + 1;
    indices.push(w1, c1, w2);
    indices.push(w2, c1, c2);
  }

  // Connect cap rings together
  for (let j = 0; j < capRings - 1; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = capOffset + j * ringStride + i;
      const b = capOffset + (j + 1) * ringStride + i;
      const c = capOffset + (j + 1) * ringStride + (i + 1);
      const d = capOffset + j * ringStride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the ribbon hatband wrapping the base of the crown.
 */
function createHatbandGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 48;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const yLow = 0.014;
  const yHigh = 0.115;
  const rxBottom = 0.815;
  const rzBottom = 0.875;
  const rxTop = 0.795;
  const rzTop = 0.855;

  for (let i = 0; i <= radialSegments; i++) {
    const u = i / radialSegments;
    const theta = u * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    // bottom vertex
    vertices.push(sinT * rxBottom, yLow, cosT * rzBottom);
    uvs.push(u, 0);

    // top vertex
    vertices.push(sinT * rxTop, yHigh, cosT * rzTop);
    uvs.push(u, 1);
  }

  for (let i = 0; i < radialSegments; i++) {
    const b1 = i * 2;
    const t1 = i * 2 + 1;
    const b2 = (i + 1) * 2;
    const t2 = (i + 1) * 2 + 1;
    indices.push(b1, t1, b2);
    indices.push(b2, t1, t2);
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates a western gold star concho mounted on the hatband.
 */
function createStarConcho(): THREE.Mesh {
  const points = 5;
  const outerRadius = 0.042;
  const innerRadius = 0.021;
  const shape = new THREE.Shape();

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.007,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });

  const mat = new THREE.MeshStandardMaterial({
    color: 0xdeb841,
    roughness: 0.25,
    metalness: 0.88,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Smooth cubic overshoot easing for bouncy pop-in.
 */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function createCowboyHat(): CowboyHatHandle {
  const hatRoot = new THREE.Group();
  hatRoot.name = "CowboyHatRoot";

  // Base rest transform on peanut's head (sits jaunty over top tuft nub)
  const restY = 2.68;
  const restZ = 0.01;
  const restRotX = -0.06; // slight tilt back so cute eyes are fully visible
  const restRotZ = -0.04; // jaunty western cocked swagger

  hatRoot.position.set(0, restY, restZ);
  hatRoot.rotation.x = restRotX;
  hatRoot.rotation.z = restRotZ;

  // 1. Materials
  // Rich saddle brown plush felt
  const hatFeltMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x78401b,
    roughness: 0.82,
    metalness: 0.04,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xb57a4a),
    sheenRoughness: 0.65,
    side: THREE.DoubleSide,
  });

  const hatSmoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x824922,
    roughness: 0.32,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  const hatWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc87532,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  // Dark stitched chocolate hatband
  const bandFeltMaterial = new THREE.MeshStandardMaterial({
    color: 0x241309,
    roughness: 0.7,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const bandWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x5a2d12,
    wireframe: true,
  });

  // 2. Geometries & Meshes
  const brimGeom = createBrimGeometry();
  const brimMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    brimGeom,
    hatFeltMaterial,
  );
  brimMesh.castShadow = true;
  brimMesh.receiveShadow = true;
  hatRoot.add(brimMesh);

  const crownGeom = createCrownGeometry();
  const crownMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    crownGeom,
    hatFeltMaterial,
  );
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  hatRoot.add(crownMesh);

  const bandGeom = createHatbandGeometry();
  const bandMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    bandGeom,
    bandFeltMaterial,
  );
  bandMesh.castShadow = true;
  bandMesh.receiveShadow = true;
  hatRoot.add(bandMesh);

  // Decorative Star Concho Badge mounted on the left side of the hatband
  const conchoMesh = createStarConcho();
  // Place on left side facing slightly forward
  conchoMesh.position.set(-0.82, 0.065, 0.14);
  conchoMesh.rotation.y = -Math.PI / 2 + 0.16;
  conchoMesh.scale.setScalar(1.3);

  // Initially hidden
  let isVisible = false;
  hatRoot.visible = false;

  // Animation interpolation state
  let animProgress = 0; // 0 = off, 1 = fully on
  const animSpeed = 4.2; // ~0.24s transition duration

  function setMaterialMode(mode: MaterialModeId) {
    if (mode === "fleece") {
      brimMesh.material = hatFeltMaterial;
      crownMesh.material = hatFeltMaterial;
      bandMesh.material = bandFeltMaterial;
    } else if (mode === "smooth") {
      brimMesh.material = hatSmoothMaterial;
      crownMesh.material = hatSmoothMaterial;
      bandMesh.material = bandFeltMaterial;
    } else {
      brimMesh.material = hatWireframeMaterial;
      crownMesh.material = hatWireframeMaterial;
      bandMesh.material = bandWireframeMaterial;
    }
  }

  function setVisible(visible: boolean) {
    isVisible = visible;
    if (visible) {
      hatRoot.visible = true;
    }
  }

  function toggle(): boolean {
    isVisible = !isVisible;
    if (isVisible) hatRoot.visible = true;
    return isVisible;
  }

  function update(deltaSeconds: number, jumpProgress = 0) {
    const dt = Math.min(deltaSeconds, 0.1);

    if (isVisible) {
      if (animProgress < 1.0) {
        animProgress = Math.min(1.0, animProgress + dt * animSpeed);
      }
    } else {
      if (animProgress > 0.0) {
        animProgress = Math.max(0.0, animProgress - dt * animSpeed * 1.2);
        if (animProgress === 0.0) {
          hatRoot.visible = false;
        }
      }
    }

    if (!hatRoot.visible) return;

    if (animProgress >= 1.0) {
      if (jumpProgress > 0 && jumpProgress <= 1.0) {
        const { liftY, tiltX, tiltZ } = getHatJumpOffset(jumpProgress);
        hatRoot.position.set(0, restY + liftY, restZ);
        hatRoot.scale.set(1, 1, 1);
        hatRoot.rotation.x = restRotX + tiltX;
        hatRoot.rotation.z = restRotZ + tiltZ;
      } else {
        // Normal rest state
        hatRoot.position.set(0, restY, restZ);
        hatRoot.scale.set(1, 1, 1);
        hatRoot.rotation.x = restRotX;
        hatRoot.rotation.z = restRotZ;
      }
    } else {
      // Animated pop-in or lift-off
      const eased = easeOutBack(animProgress);
      const scale = Math.max(0.001, eased);
      hatRoot.scale.set(scale, scale, scale);

      // Dropping in from slightly above with a playful tip
      const dropHeight = (1.0 - animProgress) * 0.45;
      hatRoot.position.set(0, restY + dropHeight, restZ);
      hatRoot.rotation.x = restRotX + (1.0 - animProgress) * 0.25;
      hatRoot.rotation.z = restRotZ - (1.0 - animProgress) * 0.15;
    }
  }
  function dispose() {
    brimGeom.dispose();
    crownGeom.dispose();
    bandGeom.dispose();
    conchoMesh.geometry.dispose();

    hatFeltMaterial.dispose();
    hatSmoothMaterial.dispose();
    hatWireframeMaterial.dispose();
    bandFeltMaterial.dispose();
    bandWireframeMaterial.dispose();
    if (Array.isArray(conchoMesh.material)) {
      conchoMesh.material.forEach((m) => m.dispose());
    } else {
      conchoMesh.material.dispose();
    }
  }

  return {
    group: hatRoot,
    setVisible,
    toggle,
    setMaterialMode,
    update,
    dispose,
    get isVisible() {
      return isVisible;
    },
  };
}
