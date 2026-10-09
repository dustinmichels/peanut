import * as THREE from "three";
import type { MaterialModeId } from "../types/peanut";

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

/** Tapered ankle and flared, scalloped collar with a visible leather lining. */
function createShaftGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 40;
  const heightSegments = 12;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stride = radialSegments;
  const layerSize = (heightSegments + 1) * stride;

  for (let layer = 0; layer < 2; layer++) {
    for (let j = 0; j <= heightSegments; j++) {
      const v = j / heightSegments;
      const flare = v * v;
      const ankle = Math.sin(Math.PI * v);
      const rx = 0.137 + 0.028 * flare - 0.018 * ankle - layer * 0.012;
      const rz = 0.155 + 0.03 * flare - 0.018 * ankle - layer * 0.012;
      for (let i = 0; i < radialSegments; i++) {
        const theta = (i / radialSegments) * Math.PI * 2;
        const front = Math.max(0, Math.cos(theta));
        const y = 0.155 + v * 0.505 + front * 0.035 * (1 - v) - Math.cos(2 * theta) * 0.04 * v * v;
        vertices.push(
          Math.sin(theta) * rx + (isRight ? -0.012 : 0.012) * v,
          y,
          Math.cos(theta) * rz - 0.012 * (1 - v),
        );
        uvs.push(i / radialSegments, v);
      }
    }
    for (let j = 0; j < heightSegments; j++) {
      for (let i = 0; i < radialSegments; i++) {
        const next = (i + 1) % radialSegments;
        const a = layer * layerSize + j * stride + i;
        const b = a + stride;
        const d = layer * layerSize + j * stride + next;
        const c = d + stride;
        if (layer === 0) indices.push(a, d, b, d, c, b);
        else indices.push(a, b, d, d, b, c);
      }
    }
  }
  // Join the outer leather to the lining without closing the opening.
  for (let i = 0; i < radialSegments; i++) {
    const a = heightSegments * stride + i;
    const b = heightSegments * stride + ((i + 1) % radialSegments);
    indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
  }
  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Shared last keeps the leather seated on the welt from heel through toe spring.
function bootProfile(t: number) {
  const heelRound = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (0.16 - t) / 0.17), 2)));
  const toe = THREE.MathUtils.smoothstep(t, 0.64, 1);
  const halfW = (0.143 + 0.017 * Math.sin(Math.PI * t) - 0.12 * toe) * heelRound;
  const soleY =
    0.032 +
    0.053 * (1 - THREE.MathUtils.smoothstep(t, 0.28, 0.62)) +
    0.028 * Math.pow(Math.max(0, (t - 0.72) / 0.28), 2);
  const topY =
    0.17 +
    0.12 * Math.exp(-Math.pow((t - 0.34) / 0.28, 2)) -
    0.055 * THREE.MathUtils.smoothstep(t, 0.55, 1);
  return { halfW, soleY, topY };
}

/**
 * Creates the boot foot (vamp, instep, toe box with classic cowboy toe spring).
 * Clean, simplified lofted geometry.
 */
function createFootGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const zSegments = 40;
  const crossSegments = 24;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Foot extends from heel to toe tip
  const zStart = -0.22;
  const zEnd = 0.4;

  for (let j = 0; j <= zSegments; j++) {
    const t = j / zSegments;
    const z = zStart + t * (zEnd - zStart);

    const { halfW, soleY, topY: yTop } = bootProfile(t);
    const yBottom = soleY - 0.006;

    const xIncline = (isRight ? -0.015 : 0.015) * Math.max(0, (t - 0.5) / 0.5);
    const height = yTop - yBottom;

    for (let i = 0; i < crossSegments; i++) {
      const u = i / crossSegments;
      const phi = u * Math.PI * 2;
      const x = Math.sin(phi) * halfW + xIncline;
      const y = yBottom + Math.max(0, Math.cos(phi)) * height;

      vertices.push(x, y, z);
      uvs.push(u, t);
    }
  }

  const stride = crossSegments;
  for (let j = 0; j < zSegments; j++) {
    for (let i = 0; i < crossSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + ((i + 1) % crossSegments);
      const d = j * stride + ((i + 1) % crossSegments);

      indices.push(a, b, d);
      indices.push(d, b, c);
    }
  }

  // Back cap at heel
  const backCenterIdx = vertices.length / 3;
  const back = bootProfile(0);
  vertices.push(0, (back.soleY + back.topY) * 0.5, zStart);
  uvs.push(0.5, 0);
  for (let i = 0; i < crossSegments; i++) {
    indices.push(backCenterIdx, i, (i + 1) % crossSegments);
  }

  // Front cap at toe tip
  const frontCenterIdx = vertices.length / 3;
  const frontRowStart = zSegments * stride;
  const frontXIncline = isRight ? -0.015 : 0.015;
  const front = bootProfile(1);
  vertices.push(frontXIncline, (front.soleY + front.topY) * 0.5, zEnd);
  uvs.push(0.5, 1);
  for (let i = 0; i < crossSegments; i++) {
    indices.push(frontCenterIdx, frontRowStart + ((i + 1) % crossSegments), frontRowStart + i);
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the boot outsole welt with arch lift and toe spring.
 */
function createSoleGeometry(isRight: boolean): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const zSegments = 40;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const zStart = -0.225;
  const zEnd = 0.405;

  for (let j = 0; j <= zSegments; j++) {
    const t = j / zSegments;
    const z = zStart + t * (zEnd - zStart);

    const profile = bootProfile(t);
    const halfW = profile.halfW + 0.012;
    const yTop = profile.soleY;
    const yBottom = yTop - 0.032;

    const xIncline = (isRight ? -0.015 : 0.015) * Math.max(0, (t - 0.5) / 0.5);

    // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
    vertices.push(-halfW + xIncline, yTop, z);
    vertices.push(halfW + xIncline, yTop, z);
    vertices.push(halfW + xIncline, yBottom, z);
    vertices.push(-halfW + xIncline, yBottom, z);

    uvs.push(0, t, 1, t, 1, t, 0, t);
  }

  for (let j = 0; j < zSegments; j++) {
    const r0 = j * 4;
    const r1 = (j + 1) * 4;

    // Top
    indices.push(r0 + 0, r1 + 0, r1 + 1);
    indices.push(r0 + 0, r1 + 1, r0 + 1);
    // Right welt
    indices.push(r0 + 1, r1 + 1, r1 + 2);
    indices.push(r0 + 1, r1 + 2, r0 + 2);
    // Bottom
    indices.push(r0 + 2, r1 + 2, r1 + 3);
    indices.push(r0 + 2, r1 + 3, r0 + 3);
    // Left welt
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

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates the chunky western riding heel with forward underslung slant.
 */
function createHeelGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const radialSegments = 32;
  const heightSegments = 3;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= heightSegments; j++) {
    const v = j / heightSegments;
    const y = v * 0.085;

    // Underslung slant: bottom is shifted slightly forward
    const zFront = -0.055 + v * 0.015;
    const zBack = -0.185 - v * 0.025;
    const zCenter = (zFront + zBack) * 0.5;
    const rz = (zFront - zBack) * 0.5;
    const rx = 0.105 + v * 0.025;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      const x = Math.sign(sin) * Math.pow(Math.abs(sin), 0.65) * rx;
      const z = zCenter + Math.sign(cos) * Math.pow(Math.abs(cos), 0.65) * rz;

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

      indices.push(a, d, b);
      indices.push(d, c, b);
    }
  }

  // Bottom heel cap
  const bottomCenterIdx = vertices.length / 3;
  vertices.push(0, 0, -0.12);
  uvs.push(0.5, 0);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(bottomCenterIdx, i, i + 1);
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates a clean pull tab loop on the side of the shaft collar.
 */
function createPullTabMesh(isRightSide: boolean, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, 0.09);
  shape.quadraticCurveTo(0.015, 0.11, 0.03, 0.09);
  shape.lineTo(0.03, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 1,
  });
  geom.center();

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;

  if (isRightSide) {
    mesh.position.set(0.17, 0.63, 0);
  } else {
    mesh.position.set(-0.17, 0.63, 0);
    mesh.rotation.y = Math.PI;
  }

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

/**
 * Builds a single boot (shaft, foot vamp, outsole, heel, pull tabs).
 */
function buildBoot(
  isRight: boolean,
  leatherMaterial: THREE.Material,
  stackedMaterial: THREE.Material,
) {
  const root = new THREE.Group();
  root.name = isRight ? "RightCowboyBoot" : "LeftCowboyBoot";

  // 1. Shaft
  const shaftGeom = createShaftGeometry(isRight);
  const shaftMesh = new THREE.Mesh(shaftGeom, leatherMaterial);
  shaftMesh.castShadow = true;
  shaftMesh.receiveShadow = true;
  root.add(shaftMesh);

  // 2. Foot / Vamp
  const footGeom = createFootGeometry(isRight);
  const footMesh = new THREE.Mesh(footGeom, leatherMaterial);
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  root.add(footMesh);

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

  // 4. Clean side pull tabs
  const pullTabR = createPullTabMesh(true, leatherMaterial);
  const pullTabL = createPullTabMesh(false, leatherMaterial);
  root.add(pullTabR);
  root.add(pullTabL);

  return {
    root,
    shaftMesh,
    footMesh,
    soleMesh,
    heelMesh,
    pullTabR,
    pullTabL,
  };
}

/**
 * Creates cowboy boots attached to the peanut character's left and right legs.
 */
export function createCowboyBoots(
  leftLeg: THREE.Group,
  rightLeg: THREE.Group,
  leftFoot: THREE.Group,
  rightFoot: THREE.Group,
): CowboyBootsHandle {
  // 1. Materials
  // Warm saddle leather (rich, plush/toy compliant)
  const leatherFeltMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x763e1c,
    roughness: 0.58,
    metalness: 0.04,
    clearcoat: 0.18,
    clearcoatRoughness: 0.35,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xb57a4a),
    side: THREE.DoubleSide,
  });

  const leatherSmoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x7c431f,
    roughness: 0.28,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const leatherWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xca7734,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  // Dark chocolate stacked leather (sole & heel)
  const stackedFeltMaterial = new THREE.MeshStandardMaterial({
    color: 0x221208,
    roughness: 0.75,
    metalness: 0.04,
  });

  const stackedSmoothMaterial = new THREE.MeshStandardMaterial({
    color: 0x28150a,
    roughness: 0.32,
    metalness: 0.06,
  });

  const stackedWireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x5a2d12,
    wireframe: true,
  });

  // 2. Build left and right boots
  const leftBootData = buildBoot(false, leatherFeltMaterial, stackedFeltMaterial);
  const rightBootData = buildBoot(true, leatherFeltMaterial, stackedFeltMaterial);

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
    let leatherMat: THREE.Material = leatherFeltMaterial;
    let stackedMat: THREE.Material = stackedFeltMaterial;

    if (mode === "smooth") {
      leatherMat = leatherSmoothMaterial;
      stackedMat = stackedSmoothMaterial;
    } else if (mode === "wireframe") {
      leatherMat = leatherWireframeMaterial;
      stackedMat = stackedWireframeMaterial;
    }

    [leftBootData, rightBootData].forEach((boot) => {
      boot.shaftMesh.material = leatherMat;
      boot.footMesh.material = leatherMat;
      boot.soleMesh.material = stackedMat;
      boot.heelMesh.material = stackedMat;
      boot.pullTabR.material = leatherMat;
      boot.pullTabL.material = leatherMat;
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
      boot.footMesh.geometry.dispose();
      boot.soleMesh.geometry.dispose();
      boot.heelMesh.geometry.dispose();
      boot.pullTabR.geometry.dispose();
      boot.pullTabL.geometry.dispose();
    });

    leatherFeltMaterial.dispose();
    leatherSmoothMaterial.dispose();
    leatherWireframeMaterial.dispose();
    stackedFeltMaterial.dispose();
    stackedSmoothMaterial.dispose();
    stackedWireframeMaterial.dispose();
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
    },
  };
}
