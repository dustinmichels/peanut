import * as THREE from "three";
import type { MaterialModeId } from "../types/peanut";
import { createFleeceTextures } from "./textureGenerator";

export interface SillyMustacheHandle {
  group: THREE.Group;
  setVisible: (visible: boolean) => void;
  toggle: () => boolean;
  setMaterialMode: (mode: MaterialModeId) => void;
  update: (
    deltaSeconds: number,
    jumpProgress?: number,
    bounceProgress?: number,
    time?: number,
  ) => void;
  dispose: () => void;
  readonly isVisible: boolean;
}

function easeOutBack(value: number): number {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * Math.pow(value - 1, 3) + overshoot * Math.pow(value - 1, 2);
}

function createMustacheHalf(side: -1 | 1): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.012, 0, 0),
    new THREE.Vector3(side * 0.09, -0.035, 0.012),
    new THREE.Vector3(side * 0.19, -0.018, 0.004),
    new THREE.Vector3(side * 0.27, 0.045, -0.008),
    new THREE.Vector3(side * 0.235, 0.09, -0.012),
  ]);
  return new THREE.TubeGeometry(curve, 28, 0.04, 9, false);
}

/** Creates Choo-Choo Mode's fuzzy yeti mustache and goatee. */
export function createSillyMustache(): SillyMustacheHandle {
  const root = new THREE.Group();
  root.name = "SillyMustacheRoot";
  root.position.set(0, 2.31, 0.865);

  const leftGroup = new THREE.Group();
  const rightGroup = new THREE.Group();
  const goateeGroup = new THREE.Group();
  root.add(leftGroup, rightGroup, goateeGroup);

  const leftGeometry = createMustacheHalf(-1);
  const rightGeometry = createMustacheHalf(1);
  const knotGeometry = new THREE.SphereGeometry(0.055, 16, 12);
  const tuftGeometry = new THREE.ConeGeometry(0.04, 0.11, 9, 2);
  const chinGeometry = new THREE.SphereGeometry(0.09, 14, 10);
  const fleeceTextures = createFleeceTextures(192);

  const fleeceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7ff,
    bumpMap: fleeceTextures.bumpMap,
    bumpScale: 0.035,
    roughnessMap: fleeceTextures.roughnessMap,
    roughness: 0.92,
    metalness: 0,
    sheen: 1,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.58,
  });
  const smoothMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8f0fb,
    roughness: 0.48,
    metalness: 0,
  });
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xb8e5f7,
    wireframe: true,
  });

  const leftMustache = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    leftGeometry,
    fleeceMaterial,
  );
  const rightMustache = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    rightGeometry,
    fleeceMaterial,
  );
  const knot = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(knotGeometry, fleeceMaterial);
  const chin = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(chinGeometry, fleeceMaterial);
  chin.position.set(0, -0.145, -0.005);
  chin.scale.set(0.8, 0.55, 0.65);

  leftGroup.add(leftMustache);
  rightGroup.add(rightMustache);
  root.add(knot);
  goateeGroup.add(chin);

  const fuzzyMeshes = [leftMustache, rightMustache, knot, chin];
  const mustacheTufts = [
    [-0.09, -0.045, 0.62, 2.8],
    [-0.17, -0.018, 0.72, 2.45],
    [-0.235, 0.045, 0.58, 2.15],
    [0.09, -0.045, 0.62, -2.8],
    [0.17, -0.018, 0.72, -2.45],
    [0.235, 0.045, 0.58, -2.15],
  ] as const;
  for (const [x, y, scale, rotation] of mustacheTufts) {
    const tuft = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(tuftGeometry, fleeceMaterial);
    tuft.position.set(x, y, -0.005);
    tuft.rotation.z = rotation;
    tuft.scale.setScalar(scale);
    root.add(tuft);
    fuzzyMeshes.push(tuft);
  }

  const goateeTufts = [
    [-0.06, -0.2, 0.95, Math.PI + 0.12],
    [0, -0.235, 1.25, Math.PI],
    [0.06, -0.2, 0.95, Math.PI - 0.12],
  ] as const;
  for (const [x, y, scale, rotation] of goateeTufts) {
    const tuft = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(tuftGeometry, fleeceMaterial);
    tuft.position.set(x, y, 0);
    tuft.rotation.z = rotation;
    tuft.scale.setScalar(scale);
    goateeGroup.add(tuft);
    fuzzyMeshes.push(tuft);
  }

  for (const mesh of fuzzyMeshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  let isVisible = false;
  let animationProgress = 0;
  root.visible = false;

  function setMaterialMode(mode: MaterialModeId) {
    const material =
      mode === "fleece"
        ? fleeceMaterial
        : mode === "smooth"
          ? smoothMaterial
          : wireframeMaterial;
    for (const mesh of fuzzyMeshes) mesh.material = material;
  }

  function setVisible(visible: boolean) {
    isVisible = visible;
    if (visible) root.visible = true;
  }

  function toggle(): boolean {
    setVisible(!isVisible);
    return isVisible;
  }

  function update(deltaSeconds: number, jumpProgress = 0, bounceProgress = 0, time = 0) {
    const delta = Math.min(deltaSeconds, 0.1);
    const direction = isVisible ? 1 : -1.3;
    animationProgress = THREE.MathUtils.clamp(animationProgress + delta * 5 * direction, 0, 1);

    if (animationProgress === 0 && !isVisible) {
      root.visible = false;
      return;
    }

    const entranceScale = Math.max(0.001, easeOutBack(animationProgress));
    const jumpWobble = jumpProgress > 0 ? Math.sin(jumpProgress * Math.PI * 4) * 0.13 : 0;
    const bounceWobble =
      bounceProgress > 0 ? Math.sin(bounceProgress * Math.PI * 5) * (1 - bounceProgress) * 0.16 : 0;
    const idleWiggle = Math.sin(time * 5.5) * 0.04;
    const curl = idleWiggle + jumpWobble + bounceWobble;

    root.scale.setScalar(entranceScale);
    root.rotation.z = Math.sin(time * 2.1) * 0.014;
    leftGroup.rotation.z = curl;
    rightGroup.rotation.z = -curl;
    goateeGroup.rotation.z = Math.sin(time * 3.2) * 0.025 - bounceWobble * 0.3;
  }

  function dispose() {
    leftGeometry.dispose();
    rightGeometry.dispose();
    knotGeometry.dispose();
    tuftGeometry.dispose();
    chinGeometry.dispose();
    fleeceTextures.map.dispose();
    fleeceTextures.bumpMap.dispose();
    fleeceTextures.normalMap.dispose();
    fleeceTextures.roughnessMap.dispose();
    fleeceMaterial.dispose();
    smoothMaterial.dispose();
    wireframeMaterial.dispose();
  }

  return {
    group: root,
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
