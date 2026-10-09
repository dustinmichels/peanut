import * as THREE from 'three';
import { fbm3D } from './noise';
import {
  createFleeceTextures,
  createCorduroyTextures,
  createContactShadowTexture,
  type CorduroyTextureBundle
} from './textureGenerator';
import { createCowboyHat } from './cowboyHat';
import { createCowboyBoots } from './cowboyBoots';
import type { MaterialModeId } from '../types/peanut';
export interface PeanutModelHandle {
  group: THREE.Group;
  bodyMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  fleeceMaterial: THREE.MeshPhysicalMaterial;
  smoothMaterial: THREE.MeshStandardMaterial;
  wireframeMaterial: THREE.MeshBasicMaterial;
  setMaterialMode: (mode: MaterialModeId) => void;
  setFuzzIntensity: (factor: number) => void;
  animate: (time: number, isBreathing: boolean, bounceProgress: number, deltaSeconds?: number) => void;
  setCowboyHat: (visible: boolean) => void;
  toggleCowboyHat: () => boolean;
  setCowboyBoots: (visible: boolean) => void;
  toggleCowboyBoots: () => boolean;
  dispose: () => void;
}

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
    [0.00, 0.00], // bottom pole
    [0.06, 0.58], // rounded bottom dome
    [0.18, 0.82], // chubby lower base
    [0.32, 0.88], // lower bulb peak
    [0.50, 0.70], // waist indent (gentle, cozy pinch)
    [0.70, 0.82], // head bulb peak
    [0.85, 0.65], // head dome curves gracefully inward
    [0.92, 0.35], // head crest into tuft
    [0.97, 0.22], // tuft nub
    [1.00, 0.00]  // tuft tip
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
        const val = 0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
        );
        return Math.max(0, val);
      }
    }
    return 0;
  }

  // Eye anchor coordinates for soft socket depressions
  const eyeLeft = new THREE.Vector3(-0.26, 2.48, 0.80);
  const eyeRight = new THREE.Vector3(0.26, 2.48, 0.80);

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
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
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
    reflectivity: 0.95
  });

  const beadMesh = new THREE.Mesh(beadGeom, beadMat);
  beadMesh.castShadow = true;
  eyeGroup.add(beadMesh);

  // Tiny dark felt backing ring behind the eye (gives realistic plush toy socket nesting)
  const socketRingGeom = new THREE.TorusGeometry(eyeRadius * 0.96, 0.02, 12, 24);
  const socketRingMat = new THREE.MeshStandardMaterial({
    color: 0x5a3d24,
    roughness: 0.95
  });
  const ringMesh = new THREE.Mesh(socketRingGeom, socketRingMat);
  ringMesh.position.z = -0.02;
  eyeGroup.add(ringMesh);

  return eyeGroup;
}

// Create the embroidered plush thread smile
function createSmileMesh(): THREE.Mesh {
  // Catmull-Rom spline curving across the front surface of the upper bulb
  // Sweet asymmetrical smirk matching reference photo
  const smilePoints = [
    new THREE.Vector3(-0.13, 2.33, 0.80),
    new THREE.Vector3(-0.06, 2.27, 0.83),
    new THREE.Vector3(0.00, 2.26, 0.835),
    new THREE.Vector3(0.07, 2.29, 0.83),
    new THREE.Vector3(0.14, 2.35, 0.80)
  ];

  const curve = new THREE.CatmullRomCurve3(smilePoints);
  const tubeGeom = new THREE.TubeGeometry(curve, 36, 0.016, 10, false);
  const threadMat = new THREE.MeshStandardMaterial({
    color: 0x1c1714,
    roughness: 0.85,
    metalness: 0.05
  });

  const smileMesh = new THREE.Mesh(tubeGeom, threadMat);
  smileMesh.castShadow = false;
  return smileMesh;
}

// Create one ribbed corduroy leg and bootie foot
function createCorduroyLeg(
  isRight: boolean,
  corduroyTextures: CorduroyTextureBundle
): { legGroup: THREE.Group; footGroup: THREE.Group } {
  const legGroup = new THREE.Group();

  const corduroyMaterial = new THREE.MeshStandardMaterial({
    map: corduroyTextures.map,
    normalMap: corduroyTextures.normalMap,
    roughness: 0.88,
    metalness: 0.02
  });

  // Leg stem cylinder
  const legHeight = 1.0;
  const legRadius = 0.09;
  const legGeom = new THREE.CylinderGeometry(legRadius * 0.95, legRadius * 1.05, legHeight, 24);
  const legMesh = new THREE.Mesh(legGeom, corduroyMaterial);
  legMesh.position.set(0, legHeight / 2 + 0.10, 0);
  legMesh.castShadow = true;
  legMesh.receiveShadow = true;
  legGroup.add(legMesh);

  // Foot bootie: rounded shoe with flat sole at y = 0
  const footGroup = new THREE.Group();
  footGroup.position.set(0, 0, 0);

  // Foot body: deformed sphere/capsule elongated forward
  const footGeom = new THREE.SphereGeometry(0.16, 24, 18);
  footGeom.scale(0.95, 0.75, 1.45); // widen and extend along Z (toes)
  // Flatten the bottom of the foot at y = 0
  const posAttr = footGeom.getAttribute('position');
  for (let k = 0; k < posAttr.count; k++) {
    const py = posAttr.getY(k);
    if (py < -0.06) {
      posAttr.setY(k, -0.06);
    }
  }
  footGeom.computeVertexNormals();

  const footMesh = new THREE.Mesh(footGeom, corduroyMaterial);
  footMesh.position.set(0, 0.10, 0.08); // center of foot slightly forward
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  footGroup.add(footMesh);

  // Cute cuff ring where leg enters bootie
  const cuffGeom = new THREE.TorusGeometry(legRadius * 1.15, 0.025, 12, 24);
  const cuffMesh = new THREE.Mesh(cuffGeom, corduroyMaterial);
  cuffMesh.rotation.x = Math.PI / 2;
  cuffMesh.position.set(0, 0.20, 0);
  footGroup.add(cuffMesh);

  legGroup.add(footGroup);

  // Position and stance based on reference photo
  if (isRight) {
    // Right leg: stepped slightly forward and angled out
    legGroup.position.set(0.24, 0, 0.06);
    legGroup.rotation.y = 0.18;
    legGroup.rotation.x = -0.04;
  } else {
    // Left leg: slightly back and turned slightly in/out
    legGroup.position.set(-0.24, 0, -0.05);
    legGroup.rotation.y = -0.15;
    legGroup.rotation.x = 0.05;
  }

  return { legGroup, footGroup };
}

// Assemble complete Peanut character model
export function createPeanutModel(): PeanutModelHandle {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'PeanutCharacterRoot';

  // Body container (for squash-and-stretch without displacing feet)
  const bodyContainer = new THREE.Group();
  bodyContainer.name = 'PeanutBodyContainer';
  rootGroup.add(bodyContainer);

  // 1. Textures & Materials
  const fleeceTextures = createFleeceTextures(512);
  const corduroyTextures = createCorduroyTextures(256);
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
    sheenRoughness: 0.65
  });

  // Smooth stylized vinyl toy material
  const smoothMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9ab73,
    roughness: 0.28,
    metalness: 0.04
  });

  // Wireframe material for inspect mode
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc89255,
    wireframe: true
  });

  // 2. Peanut Body Mesh
  const bodyGeometry = createPeanutBodyGeometry(96, 120);
  const bodyMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(bodyGeometry, fleeceMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyContainer.add(bodyMesh);

  // 3. Face Details
  // Glossy black safety eyes
  const leftEye = createBeadEye(-0.26, 2.48, 0.80, -0.22);
  const rightEye = createBeadEye(0.26, 2.48, 0.80, 0.22);
  bodyContainer.add(leftEye);
  bodyContainer.add(rightEye);

  // Embroidered smile
  const smileMesh = createSmileMesh();
  bodyContainer.add(smileMesh);

  // 4. Corduroy Legs & Booties
  const { legGroup: leftLeg, footGroup: leftFoot } = createCorduroyLeg(false, corduroyTextures);
  const { legGroup: rightLeg, footGroup: rightFoot } = createCorduroyLeg(true, corduroyTextures);
  rootGroup.add(leftLeg);
  rootGroup.add(rightLeg);

  // 5. Cowboy Hat and Boots Accessories
  const cowboyHatHandle = createCowboyHat();
  bodyContainer.add(cowboyHatHandle.group);

  const cowboyBootsHandle = createCowboyBoots(leftLeg, rightLeg, leftFoot, rightFoot);
  const shadowGeom = new THREE.PlaneGeometry(2.4, 2.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.002, 0.02);
  rootGroup.add(shadowMesh);

  // Mode switching
  function setMaterialMode(mode: MaterialModeId) {
    if (mode === 'fleece') {
      bodyMesh.material = fleeceMaterial;
    } else if (mode === 'smooth') {
      bodyMesh.material = smoothMaterial;
    } else {
      bodyMesh.material = wireframeMaterial;
    }
    cowboyHatHandle.setMaterialMode(mode);
    cowboyBootsHandle.setMaterialMode(mode);
  }
  function setFuzzIntensity(factor: number) {
    fleeceMaterial.normalScale.set(factor * 1.5, factor * 1.5);
    fleeceMaterial.sheen = Math.min(1.0, factor * 1.2);
  }

  // Animation update
  function animate(time: number, isBreathing: boolean, bounceProgress: number, deltaSeconds = 0.016) {
    cowboyHatHandle.update(deltaSeconds);
    cowboyBootsHandle.update(deltaSeconds);
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

    // Bounce squash and stretch physics
    if (bounceProgress > 0) {
      // High-energy bounce curve
      const p = bounceProgress;
      const jumpHeight = Math.sin(p * Math.PI) * 0.38;
      const squashStretchY = 1.0 + Math.sin(p * Math.PI * 2) * 0.15;
      const squashStretchXZ = 1.0 - Math.sin(p * Math.PI * 2) * 0.10;
      const wiggleZ = Math.sin(p * Math.PI * 4) * 0.08;

      rootGroup.position.y = jumpHeight;
      bodyContainer.scale.set(
        breatheScaleXZ * squashStretchXZ,
        breatheScaleY * squashStretchY,
        breatheScaleXZ * squashStretchXZ
      );
      bodyContainer.rotation.z = swayTiltZ + wiggleZ;
      bodyContainer.rotation.x = swayTiltX;

      // Legs swing slightly during jump
      leftLeg.rotation.x = Math.sin(p * Math.PI) * 0.25;
      rightLeg.rotation.x = -Math.sin(p * Math.PI) * 0.25;
    } else {
      rootGroup.position.y = 0;
      bodyContainer.scale.set(breatheScaleXZ, breatheScaleY, breatheScaleXZ);
      bodyContainer.rotation.z = swayTiltZ;
      bodyContainer.rotation.x = swayTiltX;
      leftLeg.rotation.x = 0.05;
      rightLeg.rotation.x = -0.04;
    }
  }

  function dispose() {
    bodyGeometry.dispose();
    fleeceMaterial.dispose();
    smoothMaterial.dispose();
    wireframeMaterial.dispose();
    fleeceTextures.map.dispose();
    fleeceTextures.normalMap.dispose();
    fleeceTextures.roughnessMap.dispose();
    corduroyTextures.map.dispose();
    corduroyTextures.normalMap.dispose();
    shadowTexture.dispose();
    cowboyHatHandle.dispose();
    cowboyBootsHandle.dispose();
  }
  return {
    group: rootGroup,
    bodyMesh,
    fleeceMaterial,
    smoothMaterial,
    wireframeMaterial,
    setMaterialMode,
    setFuzzIntensity,
    animate,
    setCowboyHat: cowboyHatHandle.setVisible,
    toggleCowboyHat: cowboyHatHandle.toggle,
    setCowboyBoots: cowboyBootsHandle.setVisible,
    toggleCowboyBoots: cowboyBootsHandle.toggle,
    dispose
  };
}
