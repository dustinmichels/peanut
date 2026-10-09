import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { MaterialModeId } from "../types/peanut";
import { createConfettiEffect, type ConfettiEffectHandle } from "./confettiEffect";

export interface BirthdayHatHandle {
  group: THREE.Group;
  setVisible: (visible: boolean) => void;
  toggle: () => boolean;
  setMaterialMode: (mode: MaterialModeId) => void;
  update: (deltaSeconds: number) => void;
  triggerConfetti: () => void;
  dispose: () => void;
  readonly isVisible: boolean;
  readonly isConfettiPlaying: boolean;
}

interface BirthdayTextures {
  colorMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

/**
 * Generates procedural funfetti knit yarn textures matching the birthday hat reference:
 * Off-white/cream knit base with multicolored sprinkles (hot pink, cyan, sunny yellow, lilac purple).
 */
function createBirthdayKnitTextures(size = 512): BirthdayTextures {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not supported");

  // 1. Off-white soft cream knit base
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(0, 0, size, size);

  // 2. Micro knit ribs/stitches pattern
  const rowHeight = 7;
  const colWidth = 6;
  const rows = Math.ceil(size / rowHeight);
  const cols = Math.ceil(size / colWidth);

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;
    for (let c = 0; c < cols; c++) {
      const x = c * colWidth;
      const stagger = (r % 2) * (colWidth / 2);
      const px = (x + stagger) % size;

      // Small alternating knit v-loops
      ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(224, 218, 206, 0.45)" : "rgba(255, 255, 255, 0.35)";
      ctx.fillRect(px, y, colWidth * 0.75, rowHeight * 0.85);

      // Shadow in stitch crease
      ctx.fillStyle = "rgba(190, 182, 168, 0.22)";
      ctx.fillRect(px, y + rowHeight * 0.7, colWidth * 0.75, 1.5);
    }
  }

  // 3. Subtle fibrous yarn surface noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 4. Vibrant confetti sprinkles / funfetti flecks matching reference photo
  const sprinkleColors = [
    "#ff2a70", // hot pink / magenta
    "#ff4081", // bright pink
    "#00b4d8", // cyan / turquoise
    "#00c49f", // mint aqua
    "#ffb703", // sunny marigold yellow
    "#ffc300", // warm yellow
    "#9d4edd", // violet / purple
    "#7b2cbf", // rich purple
    "#ff758f", // coral rose
  ];

  const sprinkleCount = 280;
  // Use a pseudo-random sequence for reproducible sprinkle distribution
  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let s = 0; s < sprinkleCount; s++) {
    const cx = random() * size;
    const cy = random() * size;
    const angle = random() * Math.PI;
    const length = 7 + random() * 9;
    const width = 3.6 + random() * 2.2;
    const color = sprinkleColors[Math.floor(random() * sprinkleColors.length)];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Pill/capsule sprinkle shape with rounded ends
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-length / 2, -width / 2, length, width, width / 2);
    ctx.fill();

    // Subtle 3D sprinkle highlight & shading
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.roundRect(-length / 2 + 1, -width / 2, length - 2, width * 0.35, width * 0.2);
    ctx.fill();

    ctx.restore();
  }

  // 5. Generate Normal Map & Roughness Map from bump height
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext("2d");
  if (!normalCtx) throw new Error("Normal canvas context failed");

  const normalImgData = normalCtx.createImageData(size, size);
  const nData = normalImgData.data;

  const colorData = ctx.getImageData(0, 0, size, size).data;
  const heights = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const lum =
      (colorData[idx] * 0.299 + colorData[idx + 1] * 0.587 + colorData[idx + 2] * 0.114) / 255;
    heights[i] = lum;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const left = heights[y * size + ((x - 1 + size) % size)];
      const right = heights[y * size + ((x + 1) % size)];
      const up = heights[((y - 1 + size) % size) * size + x];
      const down = heights[((y + 1) % size) * size + x];

      const dx = (right - left) * 1.8;
      const dy = (down - up) * 1.8;
      const dz = 1.0;

      const len = Math.hypot(dx, dy, dz);
      nData[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }
  normalCtx.putImageData(normalImgData, 0, 0);

  // 6. Roughness map (knit base has cozy matte fleece roughness, sprinkles slightly sleeker)
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext("2d");
  if (!roughCtx) throw new Error("Rough canvas context failed");

  const roughImgData = roughCtx.createImageData(size, size);
  const rData = roughImgData.data;
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    // Base roughness
    const val = heights[i] > 0.85 ? 175 : 215;
    rData[idx] = val;
    rData[idx + 1] = val;
    rData[idx + 2] = val;
    rData[idx + 3] = 255;
  }
  roughCtx.putImageData(roughImgData, 0, 0);

  const colorMap = new THREE.CanvasTexture(canvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(2.2, 2.0);

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2.2, 2.0);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2.2, 2.0);
  return { colorMap, normalMap, roughnessMap };
}

/**
 * Creates a small tapered party hat that fits over Peanut's top nub.
 * The lower cone has enough clearance to surround the nub without intersecting it.
 */
function createBirthdayConeGeometry(): THREE.BufferGeometry {
  const coneHeight = 0.5;
  const radiusTop = 0.035;
  const radiusBottom = 0.44;

  const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, coneHeight, 48, 20, true);

  // Translate so base is at y = 0
  geom.translate(0, coneHeight / 2, 0);

  // Give the lower cone a slight knit flare for clearance around the nub.
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const v = Math.max(0, Math.min(1, y / coneHeight));
    const nubClearance = Math.sin(Math.PI * Math.min(1, v / 0.55)) * 0.025;
    const baseR = radiusBottom + (radiusTop - radiusBottom) * v;
    const flareFactor = 1 + nubClearance / baseR;

    pos.setX(i, x * 0.98 * flareFactor);
    pos.setZ(i, z * 1.05 * flareFactor);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates the bright cyan scalloped crochet rim around the base of the small hat.
 */
function createScallopedRimGeometry(): THREE.BufferGeometry {
  const count = 18;
  const rimRadiusX = 0.44;
  const rimRadiusZ = 0.46;
  const bobbleRadius = 0.038;
  const baseSphere = new THREE.SphereGeometry(bobbleRadius, 14, 10);
  const geometries: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const x = Math.sin(theta) * rimRadiusX;
    const z = Math.cos(theta) * rimRadiusZ;
    const y = 0.012;

    const bobbleGeom = baseSphere.clone();
    bobbleGeom.scale(1.12, 0.94, 1.12);
    bobbleGeom.rotateY(theta);
    bobbleGeom.translate(x, y, z);
    geometries.push(bobbleGeom);
  }

  baseSphere.dispose();

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  geometries.forEach((g) => g.dispose());
  return merged;
}

/**
 * Creates the fluffy lavender purple pom-pom sitting on top of the party hat tip.
 */
function createPomPomGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(0.072, 24, 20);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const noise = Math.sin(x * 35) * Math.cos(y * 35) * Math.sin(z * 35) * 0.008;
    pos.setXYZ(i, x * (1 + noise), y * (1 + noise), z * (1 + noise));
  }

  geom.computeVertexNormals();
  return geom;
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

const COUNTDOWN_FLASH_COLOR = 0xfff4b0;
const POM_POM_COLOR = 0x8a5ff2;
const POM_POM_WIREFRAME_COLOR = 0x9c27b0;

/**
 * Creates the complete Birthday Party Hat accessory handle.
 */
export function createBirthdayHat(
  effectsRoot: THREE.Object3D,
  collisionBody: THREE.Object3D,
): BirthdayHatHandle {
  const hatRoot = new THREE.Group();
  hatRoot.name = "BirthdayHatRoot";

  // The cone starts at the base of Peanut's top nub and encloses it.
  const restX = 0.0;
  const restY = 3.0;
  const restZ = 0.01;
  const restRotX = -0.03;
  const restRotZ = 0.02;
  hatRoot.position.set(restX, restY, restZ);
  hatRoot.rotation.x = restRotX;
  hatRoot.rotation.z = restRotZ;

  // 1. Textures & Materials
  const textures = createBirthdayKnitTextures();

  // Fleece / Crochet physical material for the cone
  const coneFleeceMat = new THREE.MeshPhysicalMaterial({
    map: textures.colorMap,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: textures.roughnessMap,
    roughness: 0.82,
    metalness: 0.02,
    sheen: 0.6,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.6,
    side: THREE.DoubleSide,
  });

  const coneSmoothMat = new THREE.MeshStandardMaterial({
    map: textures.colorMap,
    roughness: 0.35,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const coneWireframeMat = new THREE.MeshBasicMaterial({
    color: 0x00bcd4,
    wireframe: true,
    side: THREE.DoubleSide,
  });

  // Scalloped bobble rim materials (vibrant cyan crochet yarn)
  const rimFleeceMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x00a8e8), // vibrant cyan / sky blue
    roughness: 0.74,
    metalness: 0.02,
    sheen: 0.7,
    sheenColor: new THREE.Color(0x6be0ff),
    sheenRoughness: 0.65,
  });

  const rimSmoothMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x00a8e8),
    roughness: 0.28,
    metalness: 0.06,
  });

  const rimWireframeMat = new THREE.MeshBasicMaterial({
    color: 0x0088cc,
    wireframe: true,
  });

  // Pom-pom materials (rich lavender / lilac purple yarn)
  const pomPomFleeceMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8a5ff2), // vibrant lavender purple
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.9,
    sheenColor: new THREE.Color(0xd7bdfa), // plush lilac halo
    sheenRoughness: 0.75,
  });

  const pomPomSmoothMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x8a5ff2),
    roughness: 0.3,
    metalness: 0.04,
  });

  const pomPomWireframeMat = new THREE.MeshBasicMaterial({
    color: 0x9c27b0,
    wireframe: true,
  });

  // 2. Meshes
  const coneGeom = createBirthdayConeGeometry();
  const coneMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    coneGeom,
    coneFleeceMat,
  );
  coneMesh.castShadow = true;
  coneMesh.receiveShadow = true;
  hatRoot.add(coneMesh);

  const rimGeom = createScallopedRimGeometry();
  const rimMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    rimGeom,
    rimFleeceMat,
  );
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  hatRoot.add(rimMesh);

  const pomPomGeom = createPomPomGeometry();
  const pomPomMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    pomPomGeom,
    pomPomFleeceMat,
  );
  // Sits at the tip of the small cone.
  pomPomMesh.position.set(0, 0.535, 0);
  pomPomMesh.receiveShadow = true;
  hatRoot.add(pomPomMesh);

  // Confetti lives in world space so Peanut's movement cannot lift it off the ground.
  const confettiHandle: ConfettiEffectHandle = createConfettiEffect({ collisionBody });
  effectsRoot.add(confettiHandle.mesh);
  const confettiOrigin = new THREE.Vector3();

  // Initially hidden
  let isVisible = false;
  hatRoot.visible = false;

  // 3-second transition timer when entering birthday mode
  let timeUntilConfetti: number | null = null;
  let popperRecoilTimer = 0;

  // Animation interpolation state
  let animProgress = 0;
  const animSpeed = 4.2;
  let countdownFlashIndex = -1;

  function setCountdownFlash(index: number) {
    if (countdownFlashIndex === index) return;
    countdownFlashIndex = index;
    pomPomFleeceMat.color.setHex(index >= 0 ? COUNTDOWN_FLASH_COLOR : POM_POM_COLOR);
    pomPomSmoothMat.color.setHex(index >= 0 ? COUNTDOWN_FLASH_COLOR : POM_POM_COLOR);
    pomPomWireframeMat.color.setHex(
      index >= 0 ? COUNTDOWN_FLASH_COLOR : POM_POM_WIREFRAME_COLOR,
    );
  }

  function setMaterialMode(mode: MaterialModeId) {
    if (mode === "fleece") {
      coneMesh.material = coneFleeceMat;
      rimMesh.material = rimFleeceMat;
      pomPomMesh.material = pomPomFleeceMat;
    } else if (mode === "smooth") {
      coneMesh.material = coneSmoothMat;
      rimMesh.material = rimSmoothMat;
      pomPomMesh.material = pomPomSmoothMat;
    } else {
      coneMesh.material = coneWireframeMat;
      rimMesh.material = rimWireframeMat;
      pomPomMesh.material = pomPomWireframeMat;
    }
  }

  function triggerConfetti() {
    setCountdownFlash(-1);
    timeUntilConfetti = null;
    confettiOrigin.set(0, 0.63, 0);
    hatRoot.localToWorld(confettiOrigin);
    confettiHandle.burst(confettiOrigin);
    popperRecoilTimer = 0.22;
  }

  function setVisible(visible: boolean) {
    if (isVisible === visible) return;
    isVisible = visible;
    if (visible) {
      hatRoot.visible = true;
      // Flash once per countdown beat, then launch confetti after 3 seconds.
      timeUntilConfetti = 3.0;
      setCountdownFlash(0);
    } else {
      timeUntilConfetti = null;
      setCountdownFlash(-1);
      popperRecoilTimer = 0;
      confettiHandle.reset();
    }
  }

  function toggle(): boolean {
    setVisible(!isVisible);
    return isVisible;
  }

  function update(deltaSeconds: number) {
    const dt = Math.min(deltaSeconds, 0.1);

    // Flash the pom-pom at 3, 2, and 1, then launch the confetti.
    if (isVisible && timeUntilConfetti !== null) {
      timeUntilConfetti -= deltaSeconds;
      if (timeUntilConfetti <= 0) {
        triggerConfetti();
      } else {
        const countdownElapsed = 3 - timeUntilConfetti;
        const flashIndex = Math.floor(countdownElapsed);
        setCountdownFlash(countdownElapsed % 1 < 0.4 ? flashIndex : -1);
      }
    }

    // Animate active confetti particles
    confettiHandle.update(deltaSeconds);

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
      // Resting on Peanut's head over the bean
      hatRoot.position.set(restX, restY, restZ);
      if (popperRecoilTimer > 0) {
        popperRecoilTimer = Math.max(0, popperRecoilTimer - dt);
        // Party popper recoil spring
        const recoil = Math.sin((popperRecoilTimer / 0.22) * Math.PI) * 0.08;
        hatRoot.scale.set(1.0 + recoil * 0.5, 1.0 - recoil, 1.0 + recoil * 0.5);
      } else {
        hatRoot.scale.set(1, 1, 1);
      }
      hatRoot.rotation.x = restRotX;
      hatRoot.rotation.z = restRotZ;
    } else {
      // Springy pop-in or lift-off
      const eased = easeOutBack(animProgress);
      const scale = Math.max(0.001, eased);
      hatRoot.scale.set(scale, scale, scale);

      // Drops in from above with celebratory wobble
      const dropHeight = (1.0 - animProgress) * 0.52;
      hatRoot.position.set(restX, restY + dropHeight, restZ);
      hatRoot.rotation.x = restRotX - (1.0 - animProgress) * 0.2;
      hatRoot.rotation.z = restRotZ + (1.0 - animProgress) * 0.22;
    }
  }

  function dispose() {
    coneGeom.dispose();
    rimGeom.dispose();
    pomPomGeom.dispose();

    textures.colorMap.dispose();
    textures.normalMap.dispose();
    textures.roughnessMap.dispose();

    coneFleeceMat.dispose();
    coneSmoothMat.dispose();
    coneWireframeMat.dispose();

    rimFleeceMat.dispose();
    rimSmoothMat.dispose();
    rimWireframeMat.dispose();

    pomPomFleeceMat.dispose();
    pomPomSmoothMat.dispose();
    pomPomWireframeMat.dispose();
    confettiHandle.mesh.removeFromParent();
    confettiHandle.dispose();
  }

  return {
    group: hatRoot,
    setVisible,
    toggle,
    setMaterialMode,
    update,
    triggerConfetti,
    dispose,
    get isVisible() {
      return isVisible;
    },
    get isConfettiPlaying() {
      return confettiHandle.isPlaying;
    },
  };
}
