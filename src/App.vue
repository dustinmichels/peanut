<script setup lang="ts">
import { useTemplateRef } from 'vue';
import AppHeader from './components/AppHeader.vue';
import PeanutViewer from './components/PeanutViewer.vue';

const viewerRef = useTemplateRef<InstanceType<typeof PeanutViewer>>('viewer');

function handleBounce() {
  viewerRef.value?.triggerBounce();
}
</script>

<template>
  <div class="app-root">
    <AppHeader @bounce="handleBounce" />

    <PeanutViewer
      ref="viewer"
      current-view="photo"
      current-lighting="studio"
      current-material="fleece"
      :auto-rotate="false"
      :breathing="true"
      :fuzz-intensity="1.0"
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
