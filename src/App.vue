<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue';
import AppHeader from './components/AppHeader.vue';
import PeanutViewer from './components/PeanutViewer.vue';
import ViewerControls from './components/ViewerControls.vue';
import ReferenceCompare from './components/ReferenceCompare.vue';
import type {
  LightingPresetId,
  MaterialModeId,
  ViewPresetId
} from './types/peanut';

const viewerRef = useTemplateRef<InstanceType<typeof PeanutViewer>>('viewer');

const currentView = shallowRef<ViewPresetId>('photo');
const currentLighting = shallowRef<LightingPresetId>('studio');
const currentMaterial = shallowRef<MaterialModeId>('fleece');
const autoRotate = shallowRef(false);
const breathing = shallowRef(true);
const fuzzIntensity = shallowRef(1.0);
const showReference = shallowRef(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
function handleViewChange(view: ViewPresetId) {
  currentView.value = view;
  viewerRef.value?.setViewPreset(view);
}

function handleLightingChange(light: LightingPresetId) {
  currentLighting.value = light;
  viewerRef.value?.setLightingPreset(light);
}

function handleMaterialChange(mat: MaterialModeId) {
  currentMaterial.value = mat;
  viewerRef.value?.setMaterialMode(mat);
}

function handleFuzzChange(fuzz: number) {
  fuzzIntensity.value = fuzz;
  viewerRef.value?.setFuzzIntensity(fuzz);
}

function handleToggleAutoRotate() {
  autoRotate.value = !autoRotate.value;
  viewerRef.value?.toggleAutoRotate(autoRotate.value);
}

function handleToggleBreathing() {
  breathing.value = !breathing.value;
  viewerRef.value?.toggleBreathing(breathing.value);
}

function handleBounce() {
  viewerRef.value?.triggerBounce();
}

function handleResetCamera() {
  currentView.value = 'photo';
  viewerRef.value?.setViewPreset('photo');
}

function handleToggleReference() {
  showReference.value = !showReference.value;
}
</script>

<template>
  <div class="app-root">
    <AppHeader
      :show-reference="showReference"
      @toggle-reference="handleToggleReference"
      @reset-camera="handleResetCamera"
      @bounce="handleBounce"
    />

    <PeanutViewer
      ref="viewer"
      :current-view="currentView"
      :current-lighting="currentLighting"
      :current-material="currentMaterial"
      :auto-rotate="autoRotate"
      :breathing="breathing"
      :fuzz-intensity="fuzzIntensity"
    />

    <ReferenceCompare
      :visible="showReference"
      @close="showReference = false"
    />

    <ViewerControls
      :current-view="currentView"
      :current-lighting="currentLighting"
      :current-material="currentMaterial"
      :auto-rotate="autoRotate"
      :breathing="breathing"
      :fuzz-intensity="fuzzIntensity"
      @update:view="handleViewChange"
      @update:lighting="handleLightingChange"
      @update:material="handleMaterialChange"
      @update:fuzz="handleFuzzChange"
      @toggle:auto-rotate="handleToggleAutoRotate"
      @toggle:breathing="handleToggleBreathing"
      @trigger:bounce="handleBounce"
    />
  </div>
</template>

<style scoped>
.app-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f6f5f3;
}
</style>
