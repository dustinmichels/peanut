import * as THREE from 'three';
import type { MaterialModeId } from '../types/peanut';

export interface CowboyBootsHandle {
  leftBoot: THREE.Group;
  rightBoot: THREE.Group;
  setVisible: (visible: boolean) => void;
  toggle: () => boolean;
  setMaterialMode: (mode: MaterialModeId) => void;
  update: (deltaSeconds: number) => void;
  dispose: () => void;
  readonly isVisible: boolean;
}

/**
 * Creates the tall boot shaft with western scalloped collar (dip in front/back, peaks on sides).
 * Dual-layered for realistic cut-leather thickness.
 */
function createShaftGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 32;
  const heightSegments = 14;
  const thickness = 0.016;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  function getPoint(u: number, v: number, layerOffset: number) {
    const theta = u * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    // Height from ankle (y=0.12) up to collar (y=0.54)
    const yBase = 0.12 + v * 0.42;

    // Classic western scalloped collar:
    // Front (cosT > 0) dips down, back dips down, sides (sinT) peak up
    const scallop = -Math.cos(2 * theta) * 0.045 * Math.pow(v, 2.2);
    const y = yBase + scallop;

    // Elliptical cross section, slightly wider along Z and expanding toward top
    const rx = 0.108 + v * 0.024 + layerOffset;
    const rz = 0.125 + v * 0.026 + layerOffset;

    // Subtle anatomical inward tilt
    const xIncline = (isRight ? -0.01 : 0.01) * v;
    const x = sinT * rx + xIncline;
    const z = cosT * rz;

    return { x, y, z };
  }

  const stride = radialSegments + 1;

  // 1. Outer surface
  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const pt = getPoint(u, v, thickness * 0.5);
      vertices.push(pt.x, pt.y, pt.z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // 2. Inner surface
  const innerOffset = vertices.length / 3;
  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const pt = getPoint(u, v, -thickness * 0.5);
      vertices.push(pt.x, pt.y, pt.z);
      uvs.push(u, v);
    }
  }

  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = innerOffset + j * stride + i;
      const b = innerOffset + (j + 1) * stride + i;
      const c = innerOffset + (j + 1) * stride + (i + 1);
      const d = innerOffset + j * stride + (i + 1);
      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  // 3. Top rim connecting outer and inner surfaces (facing +Y)
  const topOuterRow = heightSegments * stride;
  const topInnerRow = innerOffset + heightSegments * stride;
  for (let i = 0; i < radialSegments; i++) {
    const a = topOuterRow + i;
    const b = topOuterRow + (i + 1);
    const c = topInnerRow + (i + 1);
    const d = topInnerRow + i;
    indices.push(a, d, b);
    indices.push(d, c, b);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the vamp (foot upper), snip toe box with toe spring, instep bridge, and heel counter.
 */
function createVampGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const zSegments = 16;
  const crossSegments = 16;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const zStart = -0.16;
  const zEnd = 0.28;

  for (let j = 0; j <= zSegments; j++) {
    const t = j / zSegments;
    const z = zStart + t * (zEnd - zStart);

    let yBottom = 0.02;
    let yTop = 0.16;
    let halfW = 0.10;

    if (t < 0.28) {
      // Heel counter zone
      const s = t / 0.28;
      yBottom = 0.065 - s * 0.015;
      yTop = 0.16 - s * 0.01;
      halfW = 0.095 - s * 0.01;
    } else if (t < 0.58) {
      // Arch and instep throat zone
      const s = (t - 0.28) / 0.30;
      yBottom = 0.05 - s * 0.03;
      yTop = 0.15 - s * 0.03;
      halfW = 0.085 + s * 0.04;
    } else {
      // Ball of foot and snip toe zone with toe spring
      const s = (t - 0.58) / 0.42;
      yBottom = 0.02 + Math.pow(s, 2.0) * 0.03;
      yTop = 0.12 - s * 0.045;
      halfW = 0.125 - s * 0.082;
    }

    const xIncline = (isRight ? -0.012 : 0.012) * Math.max(0, (t - 0.5) / 0.5);
    const yMid = (yTop + yBottom) * 0.5;
    const yRad = (yTop - yBottom) * 0.5;

    for (let i = 0; i <= crossSegments; i++) {
      const u = i / crossSegments;
      const phi = u * Math.PI * 2;
      const x = Math.sin(phi) * halfW + xIncline;
      const y = yMid + Math.cos(phi) * yRad;
      vertices.push(x, y, z);
      uvs.push(u, t);
    }
  }

  const stride = crossSegments + 1;
  for (let j = 0; j < zSegments; j++) {
    for (let i = 0; i < crossSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // Back cap at heel counter (j = 0, facing -Z)
  const backCenterIdx = vertices.length / 3;
  vertices.push(0, 0.10, zStart);
  uvs.push(0.5, 0);
  for (let i = 0; i < crossSegments; i++) {
    indices.push(backCenterIdx, i + 1, i);
  }

  // Front cap at toe tip (j = zSegments, facing +Z)
  const frontCenterIdx = vertices.length / 3;
  const frontRowStart = zSegments * stride;
  const frontXIncline = isRight ? -0.012 : 0.012;
  vertices.push(frontXIncline, 0.06, zEnd);
  uvs.push(0.5, 1);
  for (let i = 0; i < crossSegments; i++) {
    indices.push(frontCenterIdx, frontRowStart + i, frontRowStart + i + 1);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the leather welt outsole with arch shank lift and toe spring.
 */
function createSoleGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const zSegments = 16;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const zStart = -0.165;
  const zEnd = 0.295;

  for (let j = 0; j <= zSegments; j++) {
    const t = j / zSegments;
    const z = zStart + t * (zEnd - zStart);

    let halfW = 0.10;
    let yTop = 0.025;
    let yBottom = 0.0;

    if (t < 0.28) {
      // Heel zone
      const s = t / 0.28;
      halfW = 0.10 - s * 0.01;
      yTop = 0.07;
      yBottom = 0.05;
    } else if (t < 0.52) {
      // Arch zone: lifted off ground
      const s = (t - 0.28) / 0.24;
      halfW = 0.09 + s * 0.045;
      yTop = 0.06 - s * 0.035;
      yBottom = 0.045 - s * 0.035;
    } else if (t < 0.76) {
      // Ball of foot: flat on floor
      const s = (t - 0.52) / 0.24;
      halfW = 0.135 - s * 0.03;
      yTop = 0.025;
      yBottom = 0.0;
    } else {
      // Toe spring zone: curves upward
      const s = (t - 0.76) / 0.24;
      halfW = 0.105 - s * 0.055;
      yTop = 0.025 + Math.pow(s, 2.0) * 0.035;
      yBottom = Math.pow(s, 2.0) * 0.035;
    }

    const xIncline = (isRight ? -0.012 : 0.012) * Math.max(0, (t - 0.6) / 0.4);

    // 0: left top, 1: right top, 2: right bottom, 3: left bottom
    vertices.push(-halfW + xIncline, yTop, z);
    vertices.push(halfW + xIncline, yTop, z);
    vertices.push(halfW + xIncline, yBottom, z);
    vertices.push(-halfW + xIncline, yBottom, z);

    uvs.push(0, t, 1, t, 1, t, 0, t);
  }

  for (let j = 0; j < zSegments; j++) {
    const r0 = j * 4;
    const r1 = (j + 1) * 4;

    // Top face (facing +Y)
    indices.push(r0 + 0, r1 + 0, r1 + 1);
    indices.push(r0 + 0, r1 + 1, r0 + 1);

    // Right welt wall (facing +X)
    indices.push(r0 + 1, r1 + 1, r1 + 2);
    indices.push(r0 + 1, r1 + 2, r0 + 2);

    // Bottom face (facing -Y)
    indices.push(r0 + 2, r1 + 2, r1 + 3);
    indices.push(r0 + 2, r1 + 3, r0 + 3);

    // Left welt wall (facing -X)
    indices.push(r0 + 3, r1 + 3, r1 + 0);
    indices.push(r0 + 3, r1 + 0, r0 + 0);
  }

  // Back cap
  indices.push(0, 2, 1);
  indices.push(0, 3, 2);

  // Front cap
  const last = zSegments * 4;
  indices.push(last + 0, last + 1, last + 2);
  indices.push(last + 0, last + 2, last + 3);

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the stacked western riding heel with underslung forward pitch.
 */
function createHeelGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 16;
  const heightSegments = 6;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    const y = v * 0.065;

    // Underslung breast front z slants from -0.045 (bottom) to -0.02 (top)
    const zFront = -0.045 + v * 0.025;
    const zBack = -0.160 - v * 0.005;
    const zCenter = (zFront + zBack) * 0.5;
    const rz = (zFront - zBack) * 0.5;
    const rx = 0.088 + v * 0.010;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const x = Math.sin(angle) * rx;
      let z = zCenter + Math.cos(angle) * rz;

      // Flatten breast face at front
      if (z > zFront) z = zFront;

      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  for (let j = 0; j < heightSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // Bottom cap (facing -Y)
  const bottomCenterIdx = vertices.length / 3;
  vertices.push(0, 0, -0.10);
  uvs.push(0.5, 0);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(bottomCenterIdx, i + 1, i);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates side pull loops folded over the scalloped rim.
 */
function createPullStrapMesh(isRightSide: boolean, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(0.115, 0.53);
  shape.lineTo(0.115, 0.58);
  shape.quadraticCurveTo(0.125, 0.595, 0.142, 0.585);
  shape.lineTo(0.142, 0.48);
  shape.lineTo(0.134, 0.48);
  shape.lineTo(0.134, 0.575);
  shape.quadraticCurveTo(0.125, 0.585, 0.123, 0.575);
  shape.lineTo(0.123, 0.53);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });
  geom.center();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (isRightSide) {
    mesh.position.set(0.132, 0.535, 0);
  } else {
    mesh.position.set(-0.132, 0.535, 0);
    mesh.rotation.y = Math.PI;
  }

  return mesh;
}

/**
 * Creates the western gold star concho mounted on the lateral spur strap.
 */
function createStarConcho(): THREE.Mesh {
  const points = 5;
  const outerRadius = 0.034;
  const innerRadius = 0.017;
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
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2
  });

  const mat = new THREE.MeshStandardMaterial({
    color: 0xdeb841,
    roughness: 0.25,
    metalness: 0.88
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Creates the spur strap around the heel/instep with a lateral gold star concho.
 */
function createSpurStrapAndConcho(
  isRight: boolean,
  strapMaterial: THREE.Material
): { group: THREE.Group; conchoMesh: THREE.Mesh } {
  const group = new THREE.Group();

  // Curved strap around the heel counter
  const points: THREE.Vector3[] = [];
  const segments = 16;
  const y = 0.125;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const angle = Math.PI * 0.15 + u * Math.PI * 0.70;
    const x = Math.cos(angle) * 0.105;
    const z = -0.06 - Math.sin(angle) * 0.105;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const strapGeom = new THREE.TubeGeometry(curve, 18, 0.010, 8, false);
  const strapMesh = new THREE.Mesh(strapGeom, strapMaterial);
  strapMesh.castShadow = true;
  strapMesh.receiveShadow = true;
  group.add(strapMesh);

  // Lateral star concho mounted on the outer side
  const conchoMesh = createStarConcho();
  if (isRight) {
    conchoMesh.position.set(0.105, 0.125, -0.04);
    conchoMesh.rotation.y = Math.PI / 2 + 0.15;
  } else {
    conchoMesh.position.set(-0.105, 0.125, -0.04);
    conchoMesh.rotation.y = -Math.PI / 2 - 0.15;
  }
  group.add(conchoMesh);

  return { group, conchoMesh };
}

/**
 * Creates western decorative embroidery curves on the front face of the shaft and toe medallion.
 */
function createEmbroideryGroup(isRight: boolean, threadMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // 1. Center spine curve
  const centerPoints = [
    new THREE.Vector3(0, 0.18, 0.133),
    new THREE.Vector3(0, 0.30, 0.142),
    new THREE.Vector3(0, 0.42, 0.148)
  ];
  const centerCurve = new THREE.CatmullRomCurve3(centerPoints);
  const centerGeom = new THREE.TubeGeometry(centerCurve, 14, 0.004, 6, false);
  const centerMesh = new THREE.Mesh(centerGeom, threadMaterial);
  group.add(centerMesh);

  // 2. Left flourish wing
  const leftPoints = [
    new THREE.Vector3(-0.015, 0.20, 0.133),
    new THREE.Vector3(-0.065, 0.32, 0.122),
    new THREE.Vector3(-0.082, 0.44, 0.092),
    new THREE.Vector3(-0.055, 0.42, 0.112)
  ];
  const leftCurve = new THREE.CatmullRomCurve3(leftPoints);
  const leftGeom = new THREE.TubeGeometry(leftCurve, 16, 0.0035, 6, false);
  const leftMesh = new THREE.Mesh(leftGeom, threadMaterial);
  group.add(leftMesh);

  // 3. Right flourish wing
  const rightPoints = [
    new THREE.Vector3(0.015, 0.20, 0.133),
    new THREE.Vector3(0.065, 0.32, 0.122),
    new THREE.Vector3(0.082, 0.44, 0.092),
    new THREE.Vector3(0.055, 0.42, 0.112)
  ];
  const rightCurve = new THREE.CatmullRomCurve3(rightPoints);
  const rightGeom = new THREE.TubeGeometry(rightCurve, 16, 0.0035, 6, false);
  const rightMesh = new THREE.Mesh(rightGeom, threadMaterial);
  group.add(rightMesh);

  // 4. Toe medallion bug stitch on top of toe box
  const xToeOffset = isRight ? -0.012 : 0.012;
  const toePoints = [
    new THREE.Vector3(-0.045 + xToeOffset, 0.092, 0.19),
    new THREE.Vector3(xToeOffset, 0.098, 0.23),
    new THREE.Vector3(0.045 + xToeOffset, 0.092, 0.19)
  ];
  const toeCurve = new THREE.CatmullRomCurve3(toePoints);
  const toeGeom = new THREE.TubeGeometry(toeCurve, 12, 0.0035, 6, false);
  const toeMesh = new THREE.Mesh(toeGeom, threadMaterial);
  group.add(toeMesh);

  return group;
}

/**
 * Smooth cubic overshoot easing for bouncy pop-in.
 */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Builds a single boot (shaft, vamp, sole, heel, straps, embroidery, concho).
 */
function buildBoot(
  isRight: boolean,
  leatherMaterial: THREE.Material,
  stackedMaterial: THREE.Material,
  threadMaterial: THREE.Material
) {
  const root = new THREE.Group();
  root.name = isRight ? 'RightCowboyBoot' : 'LeftCowboyBoot';

  // 1. Shaft
  const shaftGeom = createShaftGeometry(isRight);
  const shaftMesh = new THREE.Mesh(shaftGeom, leatherMaterial);
  shaftMesh.castShadow = true;
  shaftMesh.receiveShadow = true;
  root.add(shaftMesh);

  // 2. Vamp & Counter
  const vampGeom = createVampGeometry(isRight);
  const vampMesh = new THREE.Mesh(vampGeom, leatherMaterial);
  vampMesh.castShadow = true;
  vampMesh.receiveShadow = true;
  root.add(vampMesh);

  // 3. Outsole & Stacked Heel
  const soleGeom = createSoleGeometry(isRight);
  const soleMesh = new THREE.Mesh(soleGeom, stackedMaterial);
  soleMesh.castShadow = true;
  soleMesh.receiveShadow = true;
  root.add(soleMesh);

  const heelGeom = createHeelGeometry();
  const heelMesh = new THREE.Mesh(heelGeom, stackedMaterial);
  heelMesh.castShadow = true;
  heelMesh.receiveShadow = true;
  root.add(heelMesh);

  // 4. Side pull straps
  const pullStrapR = createPullStrapMesh(true, leatherMaterial);
  const pullStrapL = createPullStrapMesh(false, leatherMaterial);
  root.add(pullStrapR);
  root.add(pullStrapL);

  // 5. Spur strap and lateral star concho
  const spur = createSpurStrapAndConcho(isRight, stackedMaterial);
  root.add(spur.group);

  // 6. Western embroidery stitching
  const embroidery = createEmbroideryGroup(isRight, threadMaterial);
  root.add(embroidery);

  return {
    root,
    shaftMesh,
    vampMesh,
    soleMesh,
    heelMesh,
    pullStrapR,
    pullStrapL,
    spur,
    embroidery
  };
}

/**
 * Creates cowboy boots attached to the peanut character's left and right legs.
 */
export function createCowboyBoots(
  leftLeg: THREE.Group,
  rightLeg: THREE.Group,
  leftFoot: THREE.Group,
  rightFoot: THREE.Group
): CowboyBootsHandle {
  // 1. Materials
  // Rich saddle leather
  const leatherFeltMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x723b19,
    roughness: 0.62,
    metalness: 0.04,
    clearcoat: 0.20,
    clearcoatRoughness: 0.35,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xb57a4a),
    sheenRoughness: 0.65
  });

  const leatherSmoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a411d,
    roughness: 0.30,
    metalness: 0.06
  });

  const leatherWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc87532,
    wireframe: true
  });

  // Dark chocolate stacked leather (sole & heel)
  const stackedFeltMaterial = new THREE.MeshStandardMaterial({
    color: 0x241309,
    roughness: 0.78,
    metalness: 0.04
  });

  const stackedSmoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c170b,
    roughness: 0.35,
    metalness: 0.06
  });

  const stackedWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x5a2d12,
    wireframe: true
  });

  // Golden brass embroidery thread
  const threadFeltMaterial = new THREE.MeshStandardMaterial({
    color: 0xdeb841,
    roughness: 0.40,
    metalness: 0.25
  });

  const threadWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xdeb841,
    wireframe: true
  });

  // 2. Build left and right boots
  const leftBootData = buildBoot(false, leatherFeltMaterial, stackedFeltMaterial, threadFeltMaterial);
  const rightBootData = buildBoot(true, leatherFeltMaterial, stackedFeltMaterial, threadFeltMaterial);

  leftLeg.add(leftBootData.root);
  rightLeg.add(rightBootData.root);

  // Initially hidden
  let isVisible = false;
  leftBootData.root.visible = false;
  rightBootData.root.visible = false;

  // Animation interpolation state
  let animProgress = 0; // 0 = off, 1 = fully on
  const animSpeed = 4.2; // ~0.24s snappy duration

  function setMaterialMode(mode: MaterialModeId) {
    const leatherMat =
      mode === 'fleece'
        ? leatherFeltMaterial
        : mode === 'smooth'
          ? leatherSmoothMaterial
          : leatherWireframeMaterial;

    const stackedMat =
      mode === 'fleece'
        ? stackedFeltMaterial
        : mode === 'smooth'
          ? stackedSmoothMaterial
          : stackedWireframeMaterial;

    const threadMat = mode === 'wireframe' ? threadWireframeMaterial : threadFeltMaterial;

    [leftBootData, rightBootData].forEach((boot) => {
      boot.shaftMesh.material = leatherMat;
      boot.vampMesh.material = leatherMat;
      boot.soleMesh.material = stackedMat;
      boot.heelMesh.material = stackedMat;
      boot.pullStrapR.material = leatherMat;
      boot.pullStrapL.material = leatherMat;
      (boot.spur.group.children[0] as THREE.Mesh).material = stackedMat;
      boot.embroidery.children.forEach((child) => {
        (child as THREE.Mesh).material = threadMat;
      });
    });
  }

  function setVisible(visible: boolean) {
    isVisible = visible;
    if (visible) {
      leftBootData.root.visible = true;
      rightBootData.root.visible = true;
    }
  }

  function toggle(): boolean {
    isVisible = !isVisible;
    if (isVisible) {
      leftBootData.root.visible = true;
      rightBootData.root.visible = true;
    }
    return isVisible;
  }

  function update(deltaSeconds: number) {
    const dt = Math.min(deltaSeconds, 0.1);

    if (isVisible) {
      if (animProgress < 1.0) {
        animProgress = Math.min(1.0, animProgress + dt * animSpeed);
      }
    } else {
      if (animProgress > 0.0) {
        animProgress = Math.max(0.0, animProgress - dt * animSpeed * 1.3);
        if (animProgress === 0.0) {
          leftBootData.root.visible = false;
          rightBootData.root.visible = false;
          leftFoot.visible = true;
          rightFoot.visible = true;
        }
      }
    }

    if (!leftBootData.root.visible) return;

    if (animProgress >= 1.0) {
      leftBootData.root.scale.set(1, 1, 1);
      leftBootData.root.position.set(0, 0, 0);
      rightBootData.root.scale.set(1, 1, 1);
      rightBootData.root.position.set(0, 0, 0);
      leftFoot.visible = false;
      rightFoot.visible = false;
    } else {
      const eased = easeOutBack(animProgress);
      const scale = Math.max(0.001, eased);

      // Playful step-down stomp effect
      const dropY = (1.0 - animProgress) * 0.16;

      leftBootData.root.scale.set(scale, scale, scale);
      leftBootData.root.position.set(0, dropY, 0);

      rightBootData.root.scale.set(scale, scale, scale);
      rightBootData.root.position.set(0, dropY, 0);

      // Hide original booties when boots have taken over
      if (animProgress > 0.08) {
        leftFoot.visible = false;
        rightFoot.visible = false;
      } else {
        leftFoot.visible = true;
        rightFoot.visible = true;
      }
    }
  }

  function dispose() {
    [leftBootData, rightBootData].forEach((boot) => {
      boot.shaftMesh.geometry.dispose();
      boot.vampMesh.geometry.dispose();
      boot.soleMesh.geometry.dispose();
      boot.heelMesh.geometry.dispose();
      boot.pullStrapR.geometry.dispose();
      boot.pullStrapL.geometry.dispose();
      (boot.spur.group.children[0] as THREE.Mesh).geometry.dispose();
      boot.spur.conchoMesh.geometry.dispose();
      boot.embroidery.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
      leftLeg.remove(boot.root);
    });

    rightLeg.remove(rightBootData.root);

    leatherFeltMaterial.dispose();
    leatherSmoothMaterial.dispose();
    leatherWireframeMaterial.dispose();
    stackedFeltMaterial.dispose();
    stackedSmoothMaterial.dispose();
    stackedWireframeMaterial.dispose();
    threadFeltMaterial.dispose();
    threadWireframeMaterial.dispose();
  }

  return {
    leftBoot: leftBootData.root,
    rightBoot: rightBootData.root,
    setVisible,
    toggle,
    setMaterialMode,
    update,
    dispose,
    get isVisible() {
      return isVisible;
    }
  };
}
