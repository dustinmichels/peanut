<script setup lang="ts">
import { shallowRef, useTemplateRef } from "vue";
import AppHeader from "./components/AppHeader.vue";
import PeanutViewer from "./components/PeanutViewer.vue";
import CowboyModeSwitch from "./components/CowboyModeSwitch.vue";

const viewerRef = useTemplateRef<InstanceType<typeof PeanutViewer>>("viewer");
const cowboyMode = shallowRef(false);

function handleBounce() {
  viewerRef.value?.triggerBounce();
}
</script>

<template>
  <div class="app-root">
    <AppHeader @bounce="handleBounce" />
    <!-- Cowboy boots disabled for now to refine later -->
    <PeanutViewer
      ref="viewer"
      current-view="photo"
      current-lighting="studio"
      current-material="fleece"
      :auto-rotate="false"
      :breathing="true"
      :fuzz-intensity="1.0"
      :show-cowboy-hat="cowboyMode"
      :show-cowboy-boots="false"
      @update:cowboy-hat="cowboyMode = $event"
    />

    <CowboyModeSwitch v-model="cowboyMode" />
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
