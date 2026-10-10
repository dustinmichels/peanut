<script setup lang="ts">
import { onUnmounted, shallowRef, useTemplateRef, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import PeanutViewer from "./components/PeanutViewer.vue";
import CowboyModeSwitch from "./components/CowboyModeSwitch.vue";
import BirthdayModeSwitch from "./components/BirthdayModeSwitch.vue";
// import ChooChooModeSwitch from "./components/ChooChooModeSwitch.vue";
import PoetryBubble from "./components/PoetryBubble.vue";
import { getRandomPoetryLine, type PoetryQuote } from "./data/poetryLines";
import { playYodel, type YodelHandle } from "./utils/yodelAudio";

const cowboyMode = shallowRef(false);
const birthdayMode = shallowRef(false);
const chooChooMode = shallowRef(false);
const isYodeling = shallowRef(false);
const isSitting = shallowRef(false);
const isJumping = shallowRef(false);
const isLegsCrossed = shallowRef(false);
const showPoetryBubble = shallowRef(false);
const currentQuote = shallowRef<PoetryQuote | null>(null);
const YODEL_MOUTH_DELAY_MS = 500;
let currentQuoteIndex: number | undefined = undefined;
let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
let yodelMouthTimer: ReturnType<typeof setTimeout> | null = null;
let activeYodel: YodelHandle | null = null;

function showNewPoem() {
  const result = getRandomPoetryLine(currentQuoteIndex);
  currentQuote.value = result.quote;
  currentQuoteIndex = result.index;
  showPoetryBubble.value = true;
}

watch(isLegsCrossed, (crossed) => {
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
  if (crossed) {
    // After his legs are crossed, speech bubble appears
    bubbleTimer = setTimeout(() => {
      showNewPoem();
    }, 420);
  } else {
    showPoetryBubble.value = false;
  }
});

function stopActiveYodel() {
  if (yodelMouthTimer) {
    clearTimeout(yodelMouthTimer);
    yodelMouthTimer = null;
  }
  activeYodel?.stop();
  activeYodel = null;
  isYodeling.value = false;
}

function startYodel() {
  stopActiveYodel();

  const yodel = playYodel();
  activeYodel = yodel;
  yodelMouthTimer = setTimeout(() => {
    yodelMouthTimer = null;
    if (activeYodel === yodel && yodel.isPlaying) {
      isYodeling.value = true;
    }
  }, YODEL_MOUTH_DELAY_MS);
  void yodel.finished.then(() => {
    if (activeYodel !== yodel) return;
    if (yodelMouthTimer) {
      clearTimeout(yodelMouthTimer);
      yodelMouthTimer = null;
    }
    activeYodel = null;
    isYodeling.value = false;
  });
}
const viewerRef = useTemplateRef<InstanceType<typeof PeanutViewer>>("viewerRef");
function handleBirthdayMode(val: boolean) {
  birthdayMode.value = val;
  if (val) {
    handleCowboyMode(false);
  }
}

function handleCowboyMode(val: boolean) {
  if (cowboyMode.value === val) return;

  cowboyMode.value = val;
  if (val) {
    birthdayMode.value = false;
    // Mobile browsers require media playback to begin in the input event handler.
    startYodel();
  } else {
    stopActiveYodel();
  }
}

function handleChooChooMode(val: boolean) {
  chooChooMode.value = val;
}

function handleWee() {
  if (isJumping.value) return;
  showPoetryBubble.value = false;
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
  viewerRef.value?.triggerJump(!isSitting.value);
}

function handleToggleLegsCross() {
  if (isJumping.value) return;
  if (!isSitting.value) {
    isSitting.value = true;
  }
  isLegsCrossed.value = !isLegsCrossed.value;
}

onUnmounted(() => {
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
  }
  stopActiveYodel();
});
</script>

<template>
  <div class="app-root">
    <AppHeader
      :is-sitting="isSitting"
      :is-jumping="isJumping"
      :is-legs-crossed="isLegsCrossed"
      @wee="handleWee"
      @toggle-legs-cross="handleToggleLegsCross"
    />
    <PoetryBubble
      :visible="showPoetryBubble"
      :quote="currentQuote"
      @close="showPoetryBubble = false"
      @next="showNewPoem"
    />
    <PeanutViewer
      ref="viewerRef"
      current-view="photo"
      current-lighting="studio"
      current-material="fleece"
      :auto-rotate="false"
      :breathing="true"
      :fuzz-intensity="1.0"
      :is-sitting="isSitting"
      :show-cowboy-hat="cowboyMode"
      :show-birthday-hat="birthdayMode"
      :show-silly-mustache="chooChooMode"
      :is-yodeling="isYodeling"
      :show-cowboy-boots="false"
      @update:is-sitting="(val) => (isSitting = val)"
      @update:is-jumping="(val) => (isJumping = val)"
      @update:cowboy-hat="handleCowboyMode"
      @update:birthday-hat="handleBirthdayMode"
      @update:silly-mustache="handleChooChooMode"
      :is-legs-crossed="isLegsCrossed"
      @update:is-legs-crossed="(val) => (isLegsCrossed = val)"
    />
    <div class="bottom-modes-dock">
      <!-- Choo-Choo Mode is hidden until the accessory is ready.
      <ChooChooModeSwitch
        :model-value="chooChooMode"
        docked
        @update:model-value="handleChooChooMode"
      />
      -->
      <BirthdayModeSwitch
        :model-value="birthdayMode"
        docked
        @update:model-value="handleBirthdayMode"
      />
      <CowboyModeSwitch :model-value="cowboyMode" docked @update:model-value="handleCowboyMode" />
    </div>
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

.bottom-modes-dock {
  position: absolute;
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  max-width: calc(100vw - 2rem);
  flex-wrap: wrap;
  pointer-events: auto;
}
</style>
