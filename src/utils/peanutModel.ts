import * as THREE from "three";
import { fbm3D } from "./noise";
import {
  createFleeceTextures,
  createCorduroyTextures,
  createContactShadowTexture,
  type CorduroyTextureBundle,
} from "./textureGenerator";
import { createCowboyHat } from "./cowboyHat";
import { createCowboyBoots } from "./cowboyBoots";
import { createBirthdayHat } from "./birthdayHat";
import { createSillyMustache } from "./sillyMustache";
import { createYodelNotes } from "./yodelNotes";
import type { MaterialModeId } from "../types/peanut";
export interface PeanutModelHandle {
  group: THREE.Group;
  bodyMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  fleeceMaterial: THREE.MeshPhysicalMaterial;
  smoothMaterial: THREE.MeshStandardMaterial;
  wireframeMaterial: THREE.MeshBasicMaterial;
  setMaterialMode: (mode: MaterialModeId) => void;
  setFuzzIntensity: (factor: number) => void;
  setYodeling: (yodeling: boolean) => void;
  animate: (
    time: number,
    isBreathing: boolean,
    bounceProgress: number,
    deltaSeconds?: number,
    jumpProgress?: number,
  ) => void;
  setCowboyHat: (visible: boolean) => void;
  toggleCowboyHat: () => boolean;
  setCowboyBoots: (visible: boolean) => void;
  toggleCowboyBoots: () => boolean;
  setBirthdayHat: (visible: boolean) => void;
  toggleBirthdayHat: () => boolean;
  triggerConfetti: () => void;
  readonly isConfettiPlaying: boolean;
  setSillyMustache: (visible: boolean) => void;
  toggleSillyMustache: () => boolean;
  readonly isSillyMustacheVisible: boolean;
  setSitting: (visible: boolean) => void;
  toggleSitting: () => boolean;
  setLegsCrossed: (crossed: boolean) => void;
  toggleLegsCrossed: () => boolean;
  readonly isLegsCrossed: boolean;
  getCrossProgress: () => number;
  readonly isSitting: boolean;
  dispose: () => void;
}

// Standing & Sitting pose transform definitions
const STAND_BODY_POS = new THREE.Vector3(0, 0, 0);
const SIT_BODY_POS = new THREE.Vector3(0, -0.68, -0.05);

// Hip joint anchor locations in bodyContainer local space (embedded in the lower body bulb)
const HIP_RIGHT_LOCAL = new THREE.Vector3(0.2, 0.94, 0.04);
const HIP_LEFT_LOCAL = new THREE.Vector3(-0.2, 0.94, 0.04);

// Vector from foot/origin to hip joint in legGroup local space
const LEG_HIP_OFFSET = new THREE.Vector3(0, 0.95, -0.01);

const STAND_RIGHT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-0.02, 0.04, -0.02),
);
const STAND_LEFT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-0.02, -0.04, 0.02),
);

// Seated leg transforms (legs stretch forward and slightly splayed, matching Jellycat reference)
const SIT_RIGHT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.34, 0.18, -0.2, "YXZ"),
);
const SIT_LEFT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.34, -0.18, 0.2, "YXZ"),
);

const STAND_RIGHT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
const STAND_LEFT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));

// Seated foot angles: soles tilt up and face forward/outward, showing off the ribbed corduroy soles
const SIT_RIGHT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, 0.12, -0.08, "YXZ"),
);
const SIT_LEFT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, -0.12, 0.08, "YXZ"),
);

// Cross legs pose transform definitions (seated cross-legged in front of the body)
const CROSS_RIGHT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.36, -0.48, 0.38, "YXZ"),
);
const CROSS_LEFT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.36, 0.48, -0.38, "YXZ"),
);

const CROSS_RIGHT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, -0.28, 0.12, "YXZ"),
);
const CROSS_LEFT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, 0.28, -0.12, "YXZ"),
);

// Pike pose transform definitions (jump apex folded forward)
const PIKE_RIGHT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.54, 0.06, -0.06, "YXZ"),
);
const PIKE_LEFT_LEG_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-1.54, -0.06, 0.06, "YXZ"),
);

const PIKE_RIGHT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, 0.05, -0.05, "YXZ"),
);
const PIKE_LEFT_FOOT_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(0, -0.05, 0.05, "YXZ"),
);

const tempTargetHipR = new THREE.Vector3();
const tempTargetHipL = new THREE.Vector3();
const tempLegVecR = new THREE.Vector3();
const tempLegVecL = new THREE.Vector3();
const tempSitRightLegQuat = new THREE.Quaternion();
const tempSitLeftLegQuat = new THREE.Quaternion();
const tempSitRightFootQuat = new THREE.Quaternion();
const tempSitLeftFootQuat = new THREE.Quaternion();
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
const tempBounceEuler = new THREE.Euler();
const tempBounceQuat = new THREE.Quaternion();
// Generate organic peanut body geometry with surface lobe pinching and fluffy vertex displacements
function createPeanutBodyGeometry(radialSegments = 96, heightSegments = 120): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const bodyBaseY = 0.75;
  const bodyTotalHeight = 2.45; // up to ~3.20 at top of tuft

  // Smooth profile control points: [v, radius]
  const controls: Array<[number, number]> = [
    [0.0, 0.0], // bottom pole
    [0.06, 0.58], // rounded bottom dome
    [0.18, 0.82], // chubby lower base
    [0.32, 0.88], // lower bulb peak
    [0.5, 0.7], // waist indent (gentle, cozy pinch)
    [0.7, 0.82], // head bulb peak
    [0.85, 0.65], // head dome curves gracefully inward
    [0.92, 0.35], // head crest into tuft
    [0.97, 0.22], // tuft nub
    [1.0, 0.0], // tuft tip
  ];

  function getRadius(vn: number): number {
    if (vn <= 0) return 0;
    if (vn >= 1) return 0;
    const n = controls.length - 1;
    for (let k = 0; k < n; k++) {
      const p1 = controls[k];
      const p2 = controls[k + 1];
      if (vn >= p1[0] && vn <= p2[0]) {
        const p0 = controls[Math.max(0, k - 1)];
        const p3 = controls[Math.min(n, k + 2)];
        const span = p2[0] - p1[0];
        const t = span > 0 ? (vn - p1[0]) / span : 0;
        const t2 = t * t;
        const t3 = t2 * t;
        const val =
          0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        return Math.max(0, val);
      }
    }
    return 0;
  }

  // Eye anchor coordinates for soft socket depressions
  const eyeLeft = new THREE.Vector3(-0.26, 2.48, 0.8);
  const eyeRight = new THREE.Vector3(0.26, 2.48, 0.8);

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments; // 0 (bottom) to 1 (top tuft)
    const y = bodyBaseY + v * bodyTotalHeight;
    const r = getRadius(v);

    // Top tuft slight organic lean
    const tuftOffset = v > 0.88 ? Math.sin(((v - 0.88) / 0.12) * Math.PI) * 0.04 : 0;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const theta = u * Math.PI * 2;

      // Elliptical cross-section + subtle organic peanut longitudinal ridges
      const lateralAspect = 0.96;
      const sagittalAspect = 1.04;
      const longitudinalRidges = 1.0 + Math.cos(theta * 4) * 0.02 + Math.sin(theta * 2) * 0.015;

      let rx = r * lateralAspect * longitudinalRidges;
      let rz = r * sagittalAspect * longitudinalRidges;

      let px = Math.sin(theta) * rx + tuftOffset * 0.5;
      let py = y;
      let pz = Math.cos(theta) * rz;

      // Soft socket depression around eyes
      const distL = Math.hypot(px - eyeLeft.x, py - eyeLeft.y, pz - eyeLeft.z);
      const distR = Math.hypot(px - eyeRight.x, py - eyeRight.y, pz - eyeRight.z);
      if (distL < 0.2) {
        const factor = Math.cos((distL / 0.2) * (Math.PI / 2)) * 0.012;
        pz -= factor;
      }
      if (distR < 0.2) {
        const factor = Math.cos((distR / 0.2) * (Math.PI / 2)) * 0.012;
        pz -= factor;
      }

      // 3D physical noise displacement for genuine fluffy fleece silhouette
      // Reduced at the very tip and bottom pole for smooth closure
      const poleDamping = Math.sin(v * Math.PI);
      const fleeceFuzz = fbm3D(px * 4.2, py * 4.2, pz * 4.2, 3, 2.0, 0.5) * 0.042 * poleDamping;

      const normX = Math.sin(theta);
      const normZ = Math.cos(theta);
      px += normX * fleeceFuzz;
      pz += normZ * fleeceFuzz;

      vertices.push(px, py, pz);
      // Temporary initial normals along radius
      normals.push(normX, 0, normZ);
      uvs.push(u, v);
    }
  }

  // Generate face indices
  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * (radialSegments + 1) + i;
      const b = (j + 1) * (radialSegments + 1) + i;
      const c = (j + 1) * (radialSegments + 1) + (i + 1);
      const d = j * (radialSegments + 1) + (i + 1);

      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

// Create the 3D safety bead eyes (glossy black with specular catchlight)
function createBeadEye(x: number, y: number, z: number, rotationY: number): THREE.Group {
  const eyeGroup = new THREE.Group();
  eyeGroup.position.set(x, y, z);
  eyeGroup.rotation.y = rotationY;

  // Outer glossy black bead
  const eyeRadius = 0.078;
  const beadGeom = new THREE.SphereGeometry(eyeRadius, 32, 24);
  const beadMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c0b0b,
    roughness: 0.03,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    reflectivity: 0.95,
  });

  const beadMesh = new THREE.Mesh(beadGeom, beadMat);
  beadMesh.castShadow = true;
  eyeGroup.add(beadMesh);

  // Tiny dark felt backing ring behind the eye (gives realistic plush toy socket nesting)
  const socketRingGeom = new THREE.TorusGeometry(eyeRadius * 0.96, 0.02, 12, 24);
  const socketRingMat = new THREE.MeshStandardMaterial({
    color: 0x5a3d24,
    roughness: 0.95,
  });
  const ringMesh = new THREE.Mesh(socketRingGeom, socketRingMat);
  ringMesh.position.z = -0.02;
  eyeGroup.add(ringMesh);

  return eyeGroup;
}

// Create the embroidered plush thread smile
function createSmileMesh(threadMaterial: THREE.Material): THREE.Mesh {
  const smilePoints = [
    new THREE.Vector3(-0.13, 2.33, 0.8),
    new THREE.Vector3(-0.06, 2.27, 0.83),
    new THREE.Vector3(0.0, 2.26, 0.835),
    new THREE.Vector3(0.07, 2.29, 0.83),
    new THREE.Vector3(0.14, 2.35, 0.8),
  ];
  const curve = new THREE.CatmullRomCurve3(smilePoints);
  const geometry = new THREE.TubeGeometry(curve, 36, 0.016, 10, false);
  const smile = new THREE.Mesh(geometry, threadMaterial);
  smile.castShadow = false;
  return smile;
}

// Raised black lips form a complete O only while Peanut is yodeling.
function createYodelMouth(threadMaterial: THREE.Material): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(0.064, 0.016, 10, 32);
  const mouth = new THREE.Mesh(geometry, threadMaterial);
  mouth.position.set(0, 2.31, 0.9);
  mouth.castShadow = false;
  mouth.visible = false;
  return mouth;
}

// Helper to create the oval plush sole with straight parallel lengthwise corduroy UVs
function createBootieSoleGeometry(
  rx = 0.138,
  rz = 0.205,
  centerZ = 0.05,
  nx = 20,
  nz = 28,
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const grid: number[][] = [];
  let vertexCount = 0;

  for (let j = 0; j <= nz; j++) {
    const vz = -1.0 + (2.0 * j) / nz;
    const pz = centerZ + vz * rz;
    grid[j] = [];

    for (let i = 0; i <= nx; i++) {
      const vx = -1.0 + (2.0 * i) / nx;
      const px = vx * rx;

      const ellipseDist = vx * vx + vz * vz;
      if (ellipseDist <= 1.05) {
        // Puffed plush cushion sole, slightly convex downward so it rests solid on the ground
        const py = 0.012 - 0.01 * Math.max(0, 1.0 - ellipseDist);
        vertices.push(px, py, pz);

        // Perfectly straight parallel UVs: u across foot (X), v along foot (Z)
        const u = (vx * 0.5 + 0.5) * 4.0;
        const v = (vz * 0.5 + 0.5) * 2.5;
        uvs.push(u, v);

        grid[j][i] = vertexCount++;
      } else {
        grid[j][i] = -1;
      }
    }
  }

  // Counterclockwise winding when viewed from bottom (-Y) so normals point downward
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = grid[j][i];
      const b = grid[j + 1][i];
      const c = grid[j + 1][i + 1];
      const d = grid[j][i + 1];

      if (a !== -1 && b !== -1 && c !== -1 && d !== -1) {
        indices.push(a, c, b, a, d, c);
      } else if (a !== -1 && b !== -1 && c !== -1) {
        indices.push(a, c, b);
      } else if (a !== -1 && c !== -1 && d !== -1) {
        indices.push(a, d, c);
      } else if (a !== -1 && b !== -1 && d !== -1) {
        indices.push(a, d, b);
      } else if (b !== -1 && c !== -1 && d !== -1) {
        indices.push(b, d, c);
      }
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Helper to create the stitched piping seam welt around the sole perimeter
function createSoleWeltGeometry(
  soleRx = 0.138,
  soleRz = 0.205,
  centerZSole = 0.05,
  soleY = 0.012,
): THREE.BufferGeometry {
  const curvePoints: THREE.Vector3[] = [];
  const segments = 48;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    curvePoints.push(
      new THREE.Vector3(Math.cos(theta) * soleRx, soleY, centerZSole + Math.sin(theta) * soleRz),
    );
  }
  const curve = new THREE.CatmullRomCurve3(curvePoints, true);
  return new THREE.TubeGeometry(curve, 48, 0.012, 8, true);
}

// Helper to create the stuffed bootie shoe upper
function createBootieUpperGeometry(
  ankleRx = 0.088,
  ankleRz = 0.096,
  soleRx = 0.138,
  soleRz = 0.205,
  centerZAnkle = -0.01,
  centerZSole = 0.05,
  ankleY = 0.19,
  soleY = 0.012,
  radialSegments = 32,
  heightSegments = 16,
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    // Soft curved height drop from ankle opening to sole welt
    const py = ankleY * Math.pow(1.0 - v, 0.76) + soleY * (1.0 - Math.pow(1.0 - v, 0.76));
    const cz = centerZAnkle + (centerZSole - centerZAnkle) * v;

    // Soft stuffed plush fullness bulge
    const bulge = Math.sin(v * Math.PI) * 0.026;
    const curRx = ankleRx + (soleRx - ankleRx) * v + bulge * 0.8;
    const curRz = ankleRz + (soleRz - ankleRz) * v + bulge * 1.2;

    for (let s = 0; s <= radialSegments; s++) {
      const theta = (s / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Toe box forward puff
      const toePuff = sinT > 0 ? Math.sin(v * Math.PI) * 0.038 * Math.pow(sinT, 1.35) : 0;

      const px = cosT * curRx;
      const pz = cz + sinT * curRz + toePuff;

      vertices.push(px, py, pz);

      // UV: u around circumference, v down the shoe
      const u = (s / radialSegments) * 5.0;
      const texV = v * 2.2;
      uvs.push(u, texV);
    }
  }

  const stride = radialSegments + 1;
  for (let j = 0; j < heightSegments; j++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = j * stride + s;
      const b = (j + 1) * stride + s;
      const c = (j + 1) * stride + (s + 1);
      const d = j * stride + (s + 1);
      // Counterclockwise winding when viewed from outside so normals point outward
      indices.push(a, d, b, b, d, c);
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Create one ribbed corduroy leg and authentic plush bootie foot
function createCorduroyLeg(
  isRight: boolean,
  corduroyTextures: CorduroyTextureBundle,
): {
  legGroup: THREE.Group;
  footGroup: THREE.Group;
  setMaterialMode: (mode: MaterialModeId) => void;
  dispose: () => void;
} {
  const legGroup = new THREE.Group();

  // Plush Corduroy Physical Material with micro-fiber velvet sheen
  const corduroyMaterial = new THREE.MeshPhysicalMaterial({
    map: corduroyTextures.map,
    normalMap: corduroyTextures.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    roughnessMap: corduroyTextures.roughnessMap,
    roughness: 0.72,
    metalness: 0.01,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xd4a578), // warm corduroy velvet sheen
    sheenRoughness: 0.55,
    side: THREE.DoubleSide,
  });

  const smoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e432a,
    roughness: 0.38,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x8a5333,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  // Leg stem cylinder extends from y = 0.04 (deep inside shoe) up to y = 1.0 (inside body dome)
  const legBottomY = 0.04;
  const legHeight = 1.0 - legBottomY;
  const legRadius = 0.082;
  const legGeom = new THREE.CylinderGeometry(legRadius * 0.94, legRadius * 1.02, legHeight, 32);
  const legMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(legGeom, corduroyMaterial);
  legMesh.position.set(0, legHeight / 2 + legBottomY, 0);
  legMesh.castShadow = true;
  legMesh.receiveShadow = true;
  legGroup.add(legMesh);

  // Plush Foot Bootie pivots around the ankle joint center so the shoe stays seamlessly attached to the leg
  const anklePivot = new THREE.Vector3(0, 0.17, -0.01);
  const footGroup = new THREE.Group();
  footGroup.position.copy(anklePivot);

  const footContent = new THREE.Group();
  footContent.position.copy(anklePivot).negate();
  footGroup.add(footContent);
  // 1. Bootie shoe upper
  const upperGeom = createBootieUpperGeometry(
    legRadius * 1.07,
    legRadius * 1.15,
    0.138,
    0.205,
    -0.01,
    0.05,
    0.19,
    0.012,
    32,
    16,
  );
  const upperMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    upperGeom,
    corduroyMaterial,
  );
  upperMesh.castShadow = true;
  upperMesh.receiveShadow = true;
  footContent.add(upperMesh);

  // 2. Oval sole panel with planar UVs for parallel corduroy ribs
  const soleGeom = createBootieSoleGeometry(0.138, 0.205, 0.05);
  const soleMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(soleGeom, corduroyMaterial);
  soleMesh.castShadow = true;
  soleMesh.receiveShadow = true;
  footContent.add(soleMesh);

  // 3. Stitched welt piping along sole perimeter
  const weltGeom = createSoleWeltGeometry(0.138, 0.205, 0.05, 0.012);
  const weltMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(weltGeom, corduroyMaterial);
  weltMesh.castShadow = true;
  weltMesh.receiveShadow = true;
  footContent.add(weltMesh);

  legGroup.add(footGroup);

  // Initial standing stance
  if (isRight) {
    legGroup.quaternion.copy(STAND_RIGHT_LEG_QUAT);
  } else {
    legGroup.quaternion.copy(STAND_LEFT_LEG_QUAT);
  }

  function setMaterialMode(mode: MaterialModeId) {
    const mat =
      mode === "fleece" ? corduroyMaterial : mode === "smooth" ? smoothMaterial : wireframeMaterial;
    legMesh.material = mat;
    upperMesh.material = mat;
    soleMesh.material = mat;
    weltMesh.material = mat;
  }

  function dispose() {
    legGeom.dispose();
    upperGeom.dispose();
    soleGeom.dispose();
    weltGeom.dispose();
    corduroyMaterial.dispose();
    smoothMaterial.dispose();
    wireframeMaterial.dispose();
  }

  return { legGroup, footGroup, setMaterialMode, dispose };
}

// Assemble complete Peanut character model
export function createPeanutModel(effectsRoot: THREE.Object3D): PeanutModelHandle {
  const rootGroup = new THREE.Group();
  rootGroup.name = "PeanutCharacterRoot";

  // Body container (for squash-and-stretch without displacing feet)
  const bodyContainer = new THREE.Group();
  bodyContainer.name = "PeanutBodyContainer";
  rootGroup.add(bodyContainer);

  // 1. Textures & Materials
  const fleeceTextures = createFleeceTextures(512);
  const corduroyTextures = createCorduroyTextures(512);
  const shadowTexture = createContactShadowTexture(512);

  // Plush Bouclé Fleece Physical Material (matching soft sherpa teddy fleece)
  const fleeceMaterial = new THREE.MeshPhysicalMaterial({
    map: fleeceTextures.map,
    bumpMap: fleeceTextures.bumpMap,
    bumpScale: 0.035,
    roughnessMap: fleeceTextures.roughnessMap,
    roughness: 0.88,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xffe8c8), // golden cream velvet fiber halo
    sheenRoughness: 0.65,
  });

  // Smooth stylized vinyl toy material
  const smoothMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9ab73,
    roughness: 0.28,
    metalness: 0.04,
  });

  // Wireframe material for inspect mode
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc89255,
    wireframe: true,
  });

  // 2. Peanut Body Mesh
  const bodyGeometry = createPeanutBodyGeometry(96, 120);
  const bodyMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    bodyGeometry,
    fleeceMaterial,
  );
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyContainer.add(bodyMesh);

  // 3. Face Details
  // Glossy black safety eyes
  const leftEye = createBeadEye(-0.26, 2.48, 0.8, -0.22);
  const rightEye = createBeadEye(0.26, 2.48, 0.8, 0.22);
  bodyContainer.add(leftEye);
  bodyContainer.add(rightEye);

  const mouthThreadMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1714,
    roughness: 0.85,
    metalness: 0.05,
  });
  const smileMesh = createSmileMesh(mouthThreadMaterial);
  const yodelMouthMesh = createYodelMouth(mouthThreadMaterial);
  bodyContainer.add(smileMesh);
  bodyContainer.add(yodelMouthMesh);

  const yodelNotesHandle = createYodelNotes();
  bodyContainer.add(yodelNotesHandle.group);

  function setYodeling(yodeling: boolean) {
    smileMesh.visible = !yodeling;
    yodelMouthMesh.visible = yodeling;
    yodelNotesHandle.setVisible(yodeling);
  }

  // 4. Corduroy Legs & Booties
  const leftLegHandle = createCorduroyLeg(false, corduroyTextures);
  const rightLegHandle = createCorduroyLeg(true, corduroyTextures);
  const { legGroup: leftLeg, footGroup: leftFoot } = leftLegHandle;
  const { legGroup: rightLeg, footGroup: rightFoot } = rightLegHandle;
  rootGroup.add(leftLeg);
  rootGroup.add(rightLeg);

  // Initialize leg positions attached to hip sockets
  bodyContainer.updateMatrixWorld(true);
  tempTargetHipR.copy(HIP_RIGHT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);
  tempTargetHipL.copy(HIP_LEFT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);
  tempLegVecR.copy(LEG_HIP_OFFSET).applyQuaternion(rightLeg.quaternion);
  rightLeg.position.copy(tempTargetHipR).sub(tempLegVecR);
  tempLegVecL.copy(LEG_HIP_OFFSET).applyQuaternion(leftLeg.quaternion);
  leftLeg.position.copy(tempTargetHipL).sub(tempLegVecL);
  // 5. Cowboy Hat and Boots Accessories
  const cowboyHatHandle = createCowboyHat();
  bodyContainer.add(cowboyHatHandle.group);

  const birthdayHatHandle = createBirthdayHat(effectsRoot, bodyMesh);
  bodyContainer.add(birthdayHatHandle.group);

  const sillyMustacheHandle = createSillyMustache();
  bodyContainer.add(sillyMustacheHandle.group);

  const cowboyBootsHandle = createCowboyBoots(leftLeg, rightLeg, leftFoot, rightFoot);
  const shadowGeom = new THREE.PlaneGeometry(2.4, 2.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.name = "ShadowPlane";
  shadowMesh.userData = { isShadow: true };
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.002, 0.02);
  rootGroup.add(shadowMesh);
  // Sitting state & smooth progress
  let isSitting = false;
  let sitProgress = 0.0;

  function setSitting(sitting: boolean) {
    isSitting = sitting;
  }

  function toggleSitting(): boolean {
    isSitting = !isSitting;
    return isSitting;
  }
  // Legs crossed state & smooth progress
  let isLegsCrossed = false;
  let crossProgress = 0.0;

  function setLegsCrossed(crossed: boolean) {
    isLegsCrossed = crossed;
  }

  function toggleLegsCrossed(): boolean {
    isLegsCrossed = !isLegsCrossed;
    return isLegsCrossed;
  }

  // Mode switching
  function setMaterialMode(mode: MaterialModeId) {
    if (mode === "fleece") {
      bodyMesh.material = fleeceMaterial;
    } else if (mode === "smooth") {
      bodyMesh.material = smoothMaterial;
    } else {
      bodyMesh.material = wireframeMaterial;
    }
    cowboyHatHandle.setMaterialMode(mode);
    birthdayHatHandle.setMaterialMode(mode);
    cowboyBootsHandle.setMaterialMode(mode);
    leftLegHandle.setMaterialMode(mode);
    sillyMustacheHandle.setMaterialMode(mode);
    rightLegHandle.setMaterialMode(mode);
  }
  function setFuzzIntensity(factor: number) {
    fleeceMaterial.normalScale.set(factor * 1.5, factor * 1.5);
    fleeceMaterial.sheen = Math.min(1.0, factor * 1.2);
  }

  // Animation update
  function animate(
    time: number,
    isBreathing: boolean,
    bounceProgress: number,
    deltaSeconds = 0.016,
    jumpProgress = 0,
  ) {
    cowboyHatHandle.update(deltaSeconds, jumpProgress);
    cowboyBootsHandle.update(deltaSeconds);
    sillyMustacheHandle.update(deltaSeconds, jumpProgress, bounceProgress, time);

    const isJumping = jumpProgress > 0 && jumpProgress <= 1.0;
    const targetSitProgress = isSitting ? 1.0 : 0.0;

    // Animate sitting and legs-crossed progress
    const sitSpeed = 2.0; // ~0.5s transition
    const crossSpeed = 2.4; // ~0.4s transition
    if (isJumping) {
      isLegsCrossed = false;
      crossProgress = 0.0;
      if (jumpProgress >= 0.88) {
        sitProgress = targetSitProgress;
      }
    } else {
      if (isSitting && sitProgress < 1.0) {
        sitProgress = Math.min(1.0, sitProgress + deltaSeconds * sitSpeed);
      } else if (!isSitting && sitProgress > 0.0) {
        sitProgress = Math.max(0.0, sitProgress - deltaSeconds * sitSpeed);
      }

      if (isSitting && sitProgress > 0.6) {
        if (isLegsCrossed && crossProgress < 1.0) {
          crossProgress = Math.min(1.0, crossProgress + deltaSeconds * crossSpeed);
        } else if (!isLegsCrossed && crossProgress > 0.0) {
          crossProgress = Math.max(0.0, crossProgress - deltaSeconds * crossSpeed);
        }
      } else {
        isLegsCrossed = false;
        crossProgress = 0.0;
      }
    }

    const s = sitProgress * sitProgress * (3 - 2 * sitProgress); // smoothstep

    let breatheScaleY = 1.0;
    let breatheScaleXZ = 1.0;
    let swayTiltZ = 0.0;
    let swayTiltX = 0.0;

    if (isBreathing) {
      const breathPhase = Math.sin(time * 1.8);
      breatheScaleY = 1.0 + breathPhase * 0.018;
      breatheScaleXZ = 1.0 - breathPhase * 0.012;
      swayTiltZ = Math.sin(time * 0.9) * 0.022;
      swayTiltX = Math.cos(time * 0.9) * 0.012;
    }

    if (isJumping) {
      const j = jumpProgress;

      // 1. Vertical trajectory and squash/stretch physics
      let jumpY = 0;
      let jumpSquashY = 1.0;
      let jumpSquashXZ = 1.0;
      let jumpTorsoTiltX = 0;

      if (j < 0.12) {
        // Crouch anticipation
        const t = j / 0.12;
        jumpY = -0.08 * Math.sin(t * Math.PI);
        jumpSquashY = 1.0 - 0.14 * Math.sin(t * Math.PI);
        jumpSquashXZ = 1.0 + 0.1 * Math.sin(t * Math.PI);
      } else if (j < 0.88) {
        // Airborne leap
        const t = (j - 0.12) / (0.88 - 0.12);
        jumpY = 1.25 * Math.sin(t * Math.PI);
        const takeOffStretch = t < 0.22 ? Math.sin((t / 0.22) * Math.PI) * 0.12 : 0;
        jumpSquashY = 1.0 + takeOffStretch;
        jumpSquashXZ = 1.0 - takeOffStretch * 0.6;
        // Gymnastic pike fold: torso leans forward towards pike legs
        jumpTorsoTiltX = -0.22 * Math.sin(t * Math.PI);
      } else {
        // Landing cushion on floor
        const t = (j - 0.88) / (1.0 - 0.88);
        jumpY = -0.06 * Math.sin(t * Math.PI) * (1 - t);
        jumpSquashY = 1.0 - 0.16 * Math.sin(t * Math.PI) * (1 - t);
        jumpSquashXZ = 1.0 + 0.12 * Math.sin(t * Math.PI) * (1 - t);
      }

      // 2. Transition between the starting and target poses while airborne
      const jumpSeatT = smoothstep(0.35, 0.88, j);
      const seatBlend = THREE.MathUtils.lerp(sitProgress, targetSitProgress, jumpSeatT);
      const seatPosY = THREE.MathUtils.lerp(STAND_BODY_POS.y, SIT_BODY_POS.y, seatBlend);
      const seatPosZ = THREE.MathUtils.lerp(STAND_BODY_POS.z, SIT_BODY_POS.z, seatBlend);
      const seatTiltX = THREE.MathUtils.lerp(0, -0.05, seatBlend);
      const seatSquashY = THREE.MathUtils.lerp(1.0, 0.95, seatBlend);
      const seatSquashXZ = THREE.MathUtils.lerp(1.0, 1.03, seatBlend);

      // Position root & body
      rootGroup.position.y = jumpY;
      bodyContainer.position.set(0, seatPosY, seatPosZ);
      bodyContainer.scale.set(
        breatheScaleXZ * seatSquashXZ * jumpSquashXZ,
        breatheScaleY * seatSquashY * jumpSquashY,
        breatheScaleXZ * seatSquashXZ * jumpSquashXZ,
      );
      bodyContainer.rotation.z = swayTiltZ;
      bodyContainer.rotation.x = seatTiltX + swayTiltX + jumpTorsoTiltX;

      // Soft contact shadow stays on the floor
      shadowMesh.position.y = 0.002 - jumpY;
      shadowMesh.position.z = THREE.MathUtils.lerp(0.02, -0.02, seatBlend);
      const shadowExpand =
        THREE.MathUtils.lerp(1.0, 1.28, seatBlend) * (1.0 + Math.max(0, jumpY) * 0.28);
      shadowMesh.scale.set(shadowExpand, shadowExpand, shadowExpand);
      shadowMat.opacity = Math.max(
        0.2,
        THREE.MathUtils.lerp(0.85, 0.92, seatBlend) - Math.max(0, jumpY) * 0.45,
      );

      // 3. Legs & feet: move through a pike into the target pose
      let pikeW = 0;
      let seatW = 0;
      if (j < 0.12) {
        pikeW = 0;
        seatW = sitProgress;
      } else if (j < 0.45) {
        const t = smoothstep(0.12, 0.45, j);
        pikeW = t;
        seatW = sitProgress * (1.0 - t);
      } else if (j < 0.65) {
        pikeW = 1.0;
        seatW = 0.0;
      } else if (j < 0.88) {
        const t = smoothstep(0.65, 0.88, j);
        pikeW = 1.0 - t;
        seatW = targetSitProgress * t;
      } else {
        pikeW = 0.0;
        seatW = targetSitProgress;
      }
      const baseRightLegQuat = new THREE.Quaternion()
        .copy(STAND_RIGHT_LEG_QUAT)
        .slerp(SIT_RIGHT_LEG_QUAT, seatW);
      const baseLeftLegQuat = new THREE.Quaternion()
        .copy(STAND_LEFT_LEG_QUAT)
        .slerp(SIT_LEFT_LEG_QUAT, seatW);

      const baseRightFootQuat = new THREE.Quaternion()
        .copy(STAND_RIGHT_FOOT_QUAT)
        .slerp(SIT_RIGHT_FOOT_QUAT, seatW);
      const baseLeftFootQuat = new THREE.Quaternion()
        .copy(STAND_LEFT_FOOT_QUAT)
        .slerp(SIT_LEFT_FOOT_QUAT, seatW);

      rightLeg.quaternion.copy(baseRightLegQuat).slerp(PIKE_RIGHT_LEG_QUAT, pikeW);
      leftLeg.quaternion.copy(baseLeftLegQuat).slerp(PIKE_LEFT_LEG_QUAT, pikeW);

      rightFoot.quaternion.copy(baseRightFootQuat).slerp(PIKE_RIGHT_FOOT_QUAT, pikeW);
      leftFoot.quaternion.copy(baseLeftFootQuat).slerp(PIKE_LEFT_FOOT_QUAT, pikeW);

      // Dynamically compute leg positions so hips stay attached to body
      bodyContainer.updateMatrixWorld(true);
      tempTargetHipR.copy(HIP_RIGHT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);
      tempTargetHipL.copy(HIP_LEFT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);

      tempLegVecR.copy(LEG_HIP_OFFSET).applyQuaternion(rightLeg.quaternion);
      rightLeg.position.copy(tempTargetHipR).sub(tempLegVecR);

      tempLegVecL.copy(LEG_HIP_OFFSET).applyQuaternion(leftLeg.quaternion);
      leftLeg.position.copy(tempTargetHipL).sub(tempLegVecL);
    } else {
      // Body sitting position, rotation & squash
      const seatPosY = THREE.MathUtils.lerp(STAND_BODY_POS.y, SIT_BODY_POS.y, s);
      const seatPosZ = THREE.MathUtils.lerp(STAND_BODY_POS.z, SIT_BODY_POS.z, s);
      const seatTiltX = THREE.MathUtils.lerp(0, -0.05, s);
      const seatSquashY = THREE.MathUtils.lerp(1.0, 0.95, s);
      const seatSquashXZ = THREE.MathUtils.lerp(1.0, 1.03, s);

      // Contact shadow expansion when seated
      shadowMesh.position.y = 0.002;
      shadowMesh.position.z = THREE.MathUtils.lerp(0.02, -0.02, s);
      const shadowScale = THREE.MathUtils.lerp(1.0, 1.28, s);
      shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
      shadowMat.opacity = THREE.MathUtils.lerp(0.85, 0.92, s);

      // Leg & foot positions and rotations interpolated between standing and seated
      // Leg & foot rotations interpolated between standing and seated/crossed
      const c = crossProgress * crossProgress * (3 - 2 * crossProgress); // smoothstep
      tempSitRightLegQuat.copy(SIT_RIGHT_LEG_QUAT).slerp(CROSS_RIGHT_LEG_QUAT, c);
      tempSitLeftLegQuat.copy(SIT_LEFT_LEG_QUAT).slerp(CROSS_LEFT_LEG_QUAT, c);
      tempSitRightFootQuat.copy(SIT_RIGHT_FOOT_QUAT).slerp(CROSS_RIGHT_FOOT_QUAT, c);
      tempSitLeftFootQuat.copy(SIT_LEFT_FOOT_QUAT).slerp(CROSS_LEFT_FOOT_QUAT, c);

      // Swing legs forward in sync with body descent
      const rotS = Math.min(1.0, Math.pow(s, 0.75));
      rightLeg.quaternion.copy(STAND_RIGHT_LEG_QUAT).slerp(tempSitRightLegQuat, rotS);
      leftLeg.quaternion.copy(STAND_LEFT_LEG_QUAT).slerp(tempSitLeftLegQuat, rotS);

      rightFoot.quaternion.copy(STAND_RIGHT_FOOT_QUAT).slerp(tempSitRightFootQuat, rotS);
      leftFoot.quaternion.copy(STAND_LEFT_FOOT_QUAT).slerp(tempSitLeftFootQuat, rotS);
      // Bounce squash and stretch physics
      if (bounceProgress > 0) {
        // High-energy bounce curve
        const p = bounceProgress;
        const jumpHeight = Math.sin(p * Math.PI) * 0.38;
        const squashStretchY = 1.0 + Math.sin(p * Math.PI * 2) * 0.15;
        const squashStretchXZ = 1.0 - Math.sin(p * Math.PI * 2) * 0.1;
        const wiggleZ = Math.sin(p * Math.PI * 4) * 0.08;

        rootGroup.position.y = jumpHeight;
        shadowMesh.position.y = 0.002 - jumpHeight;
        bodyContainer.position.set(0, seatPosY, seatPosZ);
        bodyContainer.scale.set(
          breatheScaleXZ * seatSquashXZ * squashStretchXZ,
          breatheScaleY * seatSquashY * squashStretchY,
          breatheScaleXZ * seatSquashXZ * squashStretchXZ,
        );
        bodyContainer.rotation.z = swayTiltZ + wiggleZ;
        bodyContainer.rotation.x = seatTiltX + swayTiltX;

        // Playful bounce kick/swing
        const bounceSwing = Math.sin(p * Math.PI) * (0.25 * (1.0 - s * 0.5));
        const bounceKick = Math.sin(p * Math.PI * 2) * 0.12 * s;

        tempBounceQuat.setFromEuler(tempBounceEuler.set(bounceSwing, 0, bounceKick));
        leftLeg.quaternion.multiply(tempBounceQuat);

        tempBounceQuat.setFromEuler(tempBounceEuler.set(-bounceSwing, 0, -bounceKick));
        rightLeg.quaternion.multiply(tempBounceQuat);
      } else {
        rootGroup.position.y = 0;
        bodyContainer.position.set(0, seatPosY, seatPosZ);
        bodyContainer.scale.set(
          breatheScaleXZ * seatSquashXZ,
          breatheScaleY * seatSquashY,
          breatheScaleXZ * seatSquashXZ,
        );
        bodyContainer.rotation.z = swayTiltZ;
        bodyContainer.rotation.x = seatTiltX + swayTiltX;
      }
      // Dynamically compute leg positions attached to hip sockets
      bodyContainer.updateMatrixWorld(true);
      tempTargetHipR.copy(HIP_RIGHT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);
      tempTargetHipL.copy(HIP_LEFT_LOCAL).applyMatrix4(bodyContainer.matrixWorld);

      tempLegVecR.copy(LEG_HIP_OFFSET).applyQuaternion(rightLeg.quaternion);
      rightLeg.position.copy(tempTargetHipR).sub(tempLegVecR);

      tempLegVecL.copy(LEG_HIP_OFFSET).applyQuaternion(leftLeg.quaternion);
      leftLeg.position.copy(tempTargetHipL).sub(tempLegVecL);

      if (bounceProgress <= 0) {
        if (rightLeg.position.y < 0.002) rightLeg.position.y = 0.002;
        if (leftLeg.position.y < 0.002) leftLeg.position.y = 0.002;
      }
    }
    birthdayHatHandle.update(deltaSeconds, jumpProgress);
    yodelNotesHandle.update(time);
  }

  function dispose() {
    bodyGeometry.dispose();
    fleeceMaterial.dispose();
    smoothMaterial.dispose();
    wireframeMaterial.dispose();
    smileMesh.geometry.dispose();
    yodelMouthMesh.geometry.dispose();
    mouthThreadMaterial.dispose();
    yodelNotesHandle.dispose();
    fleeceTextures.map.dispose();
    fleeceTextures.normalMap.dispose();
    fleeceTextures.roughnessMap.dispose();
    corduroyTextures.map.dispose();
    corduroyTextures.normalMap.dispose();
    corduroyTextures.roughnessMap.dispose();
    shadowTexture.dispose();
    cowboyHatHandle.dispose();
    birthdayHatHandle.dispose();
    cowboyBootsHandle.dispose();
    leftLegHandle.dispose();
    rightLegHandle.dispose();
    sillyMustacheHandle.dispose();
  }
  return {
    group: rootGroup,
    bodyMesh,
    fleeceMaterial,
    smoothMaterial,
    wireframeMaterial,
    setMaterialMode,
    setFuzzIntensity,
    setYodeling,
    animate,
    setCowboyHat: cowboyHatHandle.setVisible,
    toggleCowboyHat: cowboyHatHandle.toggle,
    setCowboyBoots: cowboyBootsHandle.setVisible,
    toggleCowboyBoots: cowboyBootsHandle.toggle,
    setBirthdayHat: birthdayHatHandle.setVisible,
    toggleBirthdayHat: birthdayHatHandle.toggle,
    triggerConfetti: birthdayHatHandle.triggerConfetti,
    get isConfettiPlaying() {
      return birthdayHatHandle.isConfettiPlaying;
    },
    setSillyMustache: sillyMustacheHandle.setVisible,
    toggleSillyMustache: sillyMustacheHandle.toggle,
    get isSillyMustacheVisible() {
      return sillyMustacheHandle.isVisible;
    },
    setSitting,
    toggleSitting,
    setLegsCrossed,
    toggleLegsCrossed,
    get isLegsCrossed() {
      return isLegsCrossed;
    },
    getCrossProgress: () => crossProgress,
    get isSitting() {
      return isSitting;
    },
    dispose,
  };
}
