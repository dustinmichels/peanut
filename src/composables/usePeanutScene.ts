import { shallowRef, onUnmounted } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createPeanutModel, type PeanutModelHandle } from "../utils/peanutModel";
import type { LightingPresetId, MaterialModeId, ViewPresetId } from "../types/peanut";

export interface CameraPresetConfig {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const VIEW_PRESETS: Record<ViewPresetId, CameraPresetConfig> = {
  // Matches the exact 3/4 hero camera angle in the reference image
  photo: {
    position: new THREE.Vector3(3.3, 2.5, 8.0),
    target: new THREE.Vector3(0.0, 1.85, 0.0),
  },
  front: {
    position: new THREE.Vector3(0.0, 1.9, 6.7),
    target: new THREE.Vector3(0.0, 1.65, 0.0),
  },
  face: {
    position: new THREE.Vector3(0.7, 2.7, 3.5),
    target: new THREE.Vector3(0.0, 2.35, 0.4),
  },
  feet: {
    position: new THREE.Vector3(1.1, 0.8, 2.6),
    target: new THREE.Vector3(0.0, 0.35, 0.0),
  },
  side: {
    position: new THREE.Vector3(5.6, 1.7, 0.0),
    target: new THREE.Vector3(0.0, 1.5, 0.0),
  },
};

export function usePeanutScene() {
  const isLoaded = shallowRef(false);
  const isBouncing = shallowRef(false);

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let peanutHandle: PeanutModelHandle | null = null;
  let animationFrameId: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  // Lights
  let keyLight: THREE.DirectionalLight | null = null;
  let fillLight: THREE.DirectionalLight | null = null;
  let rimLight: THREE.DirectionalLight | null = null;
  let hemiLight: THREE.HemisphereLight | null = null;

  // Camera lerp transition state
  let targetCamPos: THREE.Vector3 | null = null;
  let targetCamLook: THREE.Vector3 | null = null;
  let isTransitioningCam = false;

  // Bounce state
  let bounceStartTime = 0;
  const bounceDuration = 750; // ms

  // Jump state
  const isJumping = shallowRef(false);
  let jumpStartTime = 0;
  const jumpDuration = 1250; // ms
  let jumpTargetSitting = true;
  // Scene animation parameters
  let autoRotateActive = shallowRef(false);
  let breathingActive = shallowRef(true);
  const cowboyHatActive = shallowRef(false);
  const cowboyBootsActive = shallowRef(false);
  const birthdayHatActive = shallowRef(false);
  const sillyMustacheActive = shallowRef(false);
  const isSitting = shallowRef(false);
  const isLegsCrossed = shallowRef(false);
  const isYodeling = shallowRef(false);
  function init(container: HTMLElement) {
    // 1. Scene & Background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f5f3);

    // 2. Camera: Studio portrait perspective (adaptive FOV for mobile/portrait)
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 50);
    const initialView = VIEW_PRESETS.photo;
    camera.position.copy(initialView.position);
    // 3. Renderer with soft PCF shadows and ACES Filmic tone mapping
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    // 4. Orbit Controls (with mobile touch gestures)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(initialView.target);
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // prevent clipping beneath floor
    controls.minDistance = 1.2;
    controls.maxDistance = 24.0;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    // 5. Lighting Setup
    // Key Light: warm studio soft light
    keyLight = new THREE.DirectionalLight(0xfff3e5, 1.8);
    keyLight.position.set(3.5, 5.0, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 14.0;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 4.0;
    keyLight.shadow.camera.bottom = -1.0;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 3.5;
    scene.add(keyLight);

    // Fill Light: soft cool-warm fill
    fillLight = new THREE.DirectionalLight(0xe5edfa, 0.9);
    fillLight.position.set(-4.0, 3.0, 2.5);
    scene.add(fillLight);

    // Rim / Hair Light: golden highlight along plush fleece edge
    rimLight = new THREE.DirectionalLight(0xffd5a0, 2.2);
    rimLight.position.set(1.0, 4.5, -3.5);
    scene.add(rimLight);

    // Studio Reflector Bounce: soft upward fill from low front
    const bounceLight = new THREE.DirectionalLight(0xfff1e5, 0.85);
    bounceLight.position.set(0.0, -1.0, 3.5);
    scene.add(bounceLight);

    // Hemisphere Ambient: sky to ground bounce
    hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xe5ded4, 0.95);
    // 6. Studio Seamless Ground Cyclorama
    const groundGeom = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3f0,
      roughness: 0.95,
      metalness: 0.0,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.001;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    peanutHandle = createPeanutModel(scene);
    peanutHandle.setCowboyHat(cowboyHatActive.value);
    peanutHandle.setCowboyBoots(cowboyBootsActive.value);
    peanutHandle.setBirthdayHat(birthdayHatActive.value);
    peanutHandle.setSillyMustache(sillyMustacheActive.value);
    peanutHandle.setSitting(isSitting.value);
    peanutHandle.setLegsCrossed(isLegsCrossed.value);
    peanutHandle.setYodeling(isYodeling.value);
    scene.add(peanutHandle.group);

    // 8. Responsive Projection & Resize Observer
    function updateCameraProjection(width: number, height: number) {
      if (!camera || !renderer) return;
      const currentAspect = width / height;
      camera.aspect = currentAspect;

      // On portrait / mobile screens, adapt FOV so the peanut is never cut off
      const baseFov = 34;
      if (currentAspect < 1.0) {
        const halfBaseRad = THREE.MathUtils.degToRad(baseFov / 2);
        const targetHalfH = Math.atan(
          Math.tan(halfBaseRad) * (1.1 / Math.max(currentAspect, 0.42)),
        );
        const adaptiveFov = THREE.MathUtils.radToDeg(targetHalfH * 2);
        camera.fov = Math.min(Math.max(adaptiveFov, 34), 58);
      } else {
        camera.fov = baseFov;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    updateCameraProjection(container.clientWidth, container.clientHeight);

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        updateCameraProjection(width, height);
      }
    });
    resizeObserver.observe(container);
    // 9. Start Render Loop
    const sceneStartTime = performance.now();
    let lastFrameTime = sceneStartTime;

    function renderLoop() {
      animationFrameId = requestAnimationFrame(renderLoop);
      const currentTime = performance.now();
      const elapsed = (currentTime - sceneStartTime) * 0.001;
      const delta = (currentTime - lastFrameTime) * 0.001;
      lastFrameTime = currentTime;
      // Camera lerp animation
      if (isTransitioningCam && camera && controls && targetCamPos && targetCamLook) {
        camera.position.lerp(targetCamPos, 0.08);
        controls.target.lerp(targetCamLook, 0.08);

        if (
          camera.position.distanceTo(targetCamPos) < 0.01 &&
          controls.target.distanceTo(targetCamLook) < 0.01
        ) {
          camera.position.copy(targetCamPos);
          controls.target.copy(targetCamLook);
          isTransitioningCam = false;
        }
      }

      // Auto rotation
      if (controls) {
        controls.autoRotate = autoRotateActive.value && !isTransitioningCam;
        controls.autoRotateSpeed = 2.0;
        controls.update();
      }

      // Jump progress
      let jumpProg = 0;
      if (jumpStartTime > 0) {
        const now = performance.now();
        const diff = now - jumpStartTime;
        if (diff < jumpDuration) {
          jumpProg = diff / jumpDuration;
        } else {
          jumpProg = 1.0;
          jumpStartTime = 0;
          isJumping.value = false;
          setSitting(jumpTargetSitting);
        }
      }

      // Bounce progress
      let bounceProg = 0;
      if (bounceStartTime > 0 && !isJumping.value) {
        const now = performance.now();
        const diff = now - bounceStartTime;
        if (diff < bounceDuration) {
          bounceProg = diff / bounceDuration;
        } else {
          bounceStartTime = 0;
          isBouncing.value = false;
        }
      }

      // Animate peanut model
      if (peanutHandle) {
        peanutHandle.animate(elapsed, breathingActive.value, bounceProg, delta, jumpProg);
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    }

    renderLoop();
    isLoaded.value = true;
  }

  function setViewPreset(presetId: ViewPresetId) {
    const preset = VIEW_PRESETS[presetId];
    if (!preset) return;
    targetCamPos = preset.position.clone();
    targetCamLook = preset.target.clone();
    isTransitioningCam = true;
  }

  function setLightingPreset(presetId: LightingPresetId) {
    if (!scene || !keyLight || !fillLight || !rimLight || !hemiLight) return;

    if (presetId === "studio") {
      scene.background = new THREE.Color(0xf6f5f3);
      keyLight.color.setHex(0xfff6ee);
      keyLight.intensity = 2.2;
      fillLight.color.setHex(0xe5edfa);
      fillLight.intensity = 1.1;
      rimLight.color.setHex(0xffdfba);
      rimLight.intensity = 2.6;
      hemiLight.color.setHex(0xfff7ed);
      hemiLight.groundColor.setHex(0xdfd8ce);
      hemiLight.intensity = 0.85;
    } else if (presetId === "golden") {
      scene.background = new THREE.Color(0xfbf3e8);
      keyLight.color.setHex(0xffcb85);
      keyLight.intensity = 2.8;
      fillLight.color.setHex(0xfcefd9);
      fillLight.intensity = 1.4;
      rimLight.color.setHex(0xff9e40);
      rimLight.intensity = 3.2;
      hemiLight.color.setHex(0xffddb0);
      hemiLight.groundColor.setHex(0x9d6f46);
      hemiLight.intensity = 0.95;
    } else if (presetId === "daylight") {
      scene.background = new THREE.Color(0xf0f5fa);
      keyLight.color.setHex(0xffffff);
      keyLight.intensity = 2.4;
      fillLight.color.setHex(0xcedeff);
      fillLight.intensity = 1.5;
      rimLight.color.setHex(0xffffff);
      rimLight.intensity = 2.0;
      hemiLight.color.setHex(0xe8f0fa);
      hemiLight.groundColor.setHex(0xd0d8e2);
      hemiLight.intensity = 0.9;
    } else if (presetId === "dramatic") {
      scene.background = new THREE.Color(0x23201e);
      keyLight.color.setHex(0xffebcf);
      keyLight.intensity = 3.4;
      fillLight.color.setHex(0x73695d);
      fillLight.intensity = 0.4;
      rimLight.color.setHex(0xffb56b);
      rimLight.intensity = 4.0;
      hemiLight.color.setHex(0x383028);
      hemiLight.groundColor.setHex(0x1a1614);
      hemiLight.intensity = 0.35;
    }
  }

  function setMaterialMode(mode: MaterialModeId) {
    if (peanutHandle) {
      peanutHandle.setMaterialMode(mode);
    }
  }

  function setFuzzIntensity(val: number) {
    if (peanutHandle) {
      peanutHandle.setFuzzIntensity(val);
    }
  }

  function triggerBounce() {
    if (isJumping.value) return;
    bounceStartTime = performance.now();
    isBouncing.value = true;
  }

  function triggerJump(targetSitting = true) {
    if (isJumping.value) return;
    isBouncing.value = false;
    bounceStartTime = 0;
    jumpStartTime = performance.now();
    jumpTargetSitting = targetSitting;
    isJumping.value = true;
    isLegsCrossed.value = false;
    peanutHandle?.setLegsCrossed(false);
    peanutHandle?.setSitting(targetSitting);
  }
  const raycaster = new THREE.Raycaster();
  const raycastPointer = new THREE.Vector2();

  function hitTestPeanut(clientX: number, clientY: number): boolean {
    if (!renderer || !camera || !peanutHandle) return false;
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    raycastPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    raycastPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(raycastPointer, camera);
    const intersects = raycaster.intersectObject(peanutHandle.group, true);

    return intersects.some((hit) => hit.object.visible && !hit.object.userData?.isShadow);
  }

  function toggleAutoRotate(val?: boolean) {
    autoRotateActive.value = typeof val === "boolean" ? val : !autoRotateActive.value;
  }

  function toggleBreathing(val?: boolean) {
    breathingActive.value = typeof val === "boolean" ? val : !breathingActive.value;
  }

  function setCowboyHat(val: boolean) {
    cowboyHatActive.value = val;
    if (peanutHandle) {
      peanutHandle.setCowboyHat(val);
    }
  }

  function toggleCowboyHat(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !cowboyHatActive.value;
    setCowboyHat(next);
    return next;
  }
  function setBirthdayHat(val: boolean) {
    birthdayHatActive.value = val;
    if (peanutHandle) {
      peanutHandle.setBirthdayHat(val);
    }
  }

  function toggleBirthdayHat(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !birthdayHatActive.value;
    setBirthdayHat(next);
    return next;
  }

  function setSillyMustache(val: boolean) {
    sillyMustacheActive.value = val;
    if (peanutHandle) {
      peanutHandle.setSillyMustache(val);
    }
  }

  function toggleSillyMustache(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !sillyMustacheActive.value;
    setSillyMustache(next);
    return next;
  }

  function triggerConfetti() {
    peanutHandle?.triggerConfetti();
  }
  function setYodeling(val: boolean) {
    isYodeling.value = val;
    peanutHandle?.setYodeling(val);
  }
  function setCowboyBoots(val: boolean) {
    cowboyBootsActive.value = val;
    if (peanutHandle) {
      peanutHandle.setCowboyBoots(val);
    }
  }

  function toggleCowboyBoots(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !cowboyBootsActive.value;
    setCowboyBoots(next);
    return next;
  }

  function setSitting(val: boolean) {
    isSitting.value = val;
    if (!val) {
      isLegsCrossed.value = false;
      peanutHandle?.setLegsCrossed(false);
    }
    peanutHandle?.setSitting(val);
  }

  function toggleSitting(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !isSitting.value;
    setSitting(next);
    return next;
  }

  function setLegsCrossed(val: boolean) {
    if (val && !isSitting.value) {
      setSitting(true);
    }
    isLegsCrossed.value = val;
    peanutHandle?.setLegsCrossed(val);
  }

  function toggleLegsCrossed(val?: boolean): boolean {
    const next = typeof val === "boolean" ? val : !isLegsCrossed.value;
    setLegsCrossed(next);
    return next;
  }

  function dispose() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (peanutHandle) {
      peanutHandle.dispose();
      peanutHandle = null;
    }
    if (controls) {
      controls.dispose();
      controls = null;
    }
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
  }

  onUnmounted(() => {
    dispose();
  });

  return {
    isLoaded,
    isBouncing,
    isJumping,
    triggerJump,
    autoRotateActive,
    breathingActive,
    init,
    setViewPreset,
    setLightingPreset,
    setMaterialMode,
    setFuzzIntensity,
    triggerBounce,
    toggleAutoRotate,
    toggleBreathing,
    cowboyHatActive,
    setCowboyHat,
    toggleCowboyHat,
    cowboyBootsActive,
    setCowboyBoots,
    toggleCowboyBoots,
    birthdayHatActive,
    setBirthdayHat,
    toggleBirthdayHat,
    sillyMustacheActive,
    setSillyMustache,
    toggleSillyMustache,
    triggerConfetti,
    isYodeling,
    setYodeling,
    isSitting,
    setSitting,
    toggleSitting,
    isLegsCrossed,
    setLegsCrossed,
    toggleLegsCrossed,
    dispose,
    hitTestPeanut,
  };
}
