<script setup lang="ts">
import { onMounted, useTemplateRef, shallowRef, watch } from 'vue';
import { usePeanutScene } from '../composables/usePeanutScene';
import type {
  LightingPresetId,
  MaterialModeId,
  ViewPresetId
} from '../types/peanut';

const props = defineProps<{
  currentView: ViewPresetId;
  currentLighting: LightingPresetId;
  currentMaterial: MaterialModeId;
  autoRotate: boolean;
  breathing: boolean;
  fuzzIntensity: number;
  showCowboyHat?: boolean;
  showCowboyBoots?: boolean;
}>();

const emit = defineEmits<{
  (e: 'bounced'): void;
  (e: 'update:cowboyHat', val: boolean): void;
  (e: 'update:cowboyBoots', val: boolean): void;
}>();
const containerRef = useTemplateRef<HTMLDivElement>('canvasContainer');
const hasInteracted = shallowRef(false);

const {
  isLoaded,
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
  toggleCowboyBoots
} = usePeanutScene();
// Differentiate drag from click
let pointerDownTime = 0;
let pointerDownX = 0;
let pointerDownY = 0;

function onPointerDown(e: PointerEvent) {
  pointerDownTime = performance.now();
  pointerDownX = e.clientX;
  pointerDownY = e.clientY;
}

function onPointerUp(e: PointerEvent) {
  const duration = performance.now() - pointerDownTime;
  const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);

  // If tapped/clicked without substantial dragging, trigger bounce
  // Finger touches move up to 16px on tap release
  if (duration < 350 && dist < 16) {
    triggerBounce();
    emit('bounced');
    hasInteracted.value = true;
  }
}

onMounted(() => {
  if (containerRef.value) {
    init(containerRef.value);
    setViewPreset(props.currentView);
    setLightingPreset(props.currentLighting);
    setMaterialMode(props.currentMaterial);
    setFuzzIntensity(props.fuzzIntensity);
    toggleAutoRotate(props.autoRotate);
    toggleBreathing(props.breathing);
    if (typeof props.showCowboyHat === 'boolean') {
      setCowboyHat(props.showCowboyHat);
    }
    if (typeof props.showCowboyBoots === 'boolean') {
      setCowboyBoots(props.showCowboyBoots);
    }
    setTimeout(() => {
      hasInteracted.value = true;
    }, 6000);
  }
});
watch(
  () => props.showCowboyHat,
  (val) => {
    if (typeof val === 'boolean' && val !== cowboyHatActive.value) {
      setCowboyHat(val);
    }
  }
);
watch(
  () => props.showCowboyBoots,
  (val) => {
    if (typeof val === 'boolean' && val !== cowboyBootsActive.value) {
      setCowboyBoots(val);
    }
  }
);

defineExpose({
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
  toggleCowboyBoots
});
</script>

<template>
  <main class="viewer-viewport">
    <div
      ref="canvasContainer"
      class="canvas-container"
      role="application"
      aria-label="3D peanut model interactive stage"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
    />

    <!-- Initial interaction hint -->
    <div v-if="isLoaded && !hasInteracted" class="hint-pill">
      <span class="hint-icon" aria-hidden="true">👆</span>
      <span>Tap peanut to bounce • Drag to spin</span>
    </div>

    <!-- Loading spinner placeholder -->
    <div v-if="!isLoaded" class="loading-overlay">
      <div class="loading-spinner" />
      <span class="loading-text">Weaving fleece & crafting peanut...</span>
    </div>
  </main>
</template>

<style scoped>
.viewer-viewport {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f6f5f3;
  user-select: none;
}

.canvas-container {
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}

.canvas-container:active {
  cursor: grabbing;
}

.hint-pill {
  position: absolute;
  top: calc(4.6rem + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(220, 205, 185, 0.5);
  font-size: 0.78rem;
  font-weight: 600;
  color: #695440;
  box-shadow: 0 4px 16px rgba(100, 70, 35, 0.08);
  pointer-events: none;
  animation: fadeInHint 0.5s ease-out;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .hint-pill {
    top: calc(3.8rem + env(safe-area-inset-top, 0px));
    font-size: 0.72rem;
    padding: 0.3rem 0.75rem;
  }
}

.hint-icon {
  font-size: 1rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #f6f5f3;
  z-index: 10;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(200, 160, 110, 0.2);
  border-top-color: #8b5528;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: #795e44;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInHint {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
