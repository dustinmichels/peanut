<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    docked?: boolean;
  }>(),
  {
    modelValue: false,
    docked: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
}>();

function toggle() {
  emit("update:modelValue", !props.modelValue);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggle();
  }
}
</script>

<template>
  <div class="bottom-switch-container" :class="{ 'is-docked': docked }">
    <div
      class="cowboy-switch-pill"
      :class="{ 'pill-active': modelValue }"
      role="button"
      tabindex="0"
      :aria-label="modelValue ? 'Disable Cowboy Mode' : 'Enable Cowboy Mode'"
      @click="toggle"
      @keydown="onKeydown"
    >
      <div class="pill-left">
        <span class="cowboy-icon" :class="{ 'cowboy-icon-active': modelValue }" aria-hidden="true">
          🤠
        </span>
        <span class="cowboy-title">Cowboy Mode</span>
      </div>

      <div
        class="switch-control"
        :class="{ 'switch-control-on': modelValue }"
        role="switch"
        :aria-checked="modelValue"
        aria-hidden="true"
      >
        <span class="switch-thumb" :class="{ 'thumb-on': modelValue }">
          <span v-if="modelValue" class="thumb-star" aria-hidden="true">★</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottom-switch-container {
  position: absolute;
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: auto;
  user-select: none;
}
.bottom-switch-container.is-docked {
  position: static;
  transform: none;
  bottom: auto;
  left: auto;
  z-index: auto;
}

.cowboy-switch-pill {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 2px solid rgba(223, 205, 189, 0.85);
  border-radius: 9999px;
  padding: 0.5rem 0.65rem 0.5rem 1.15rem;
  box-shadow:
    0 16px 36px -6px rgba(116, 62, 24, 0.16),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.cowboy-switch-pill:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.96);
  border-color: #c9ab93;
  box-shadow:
    0 20px 42px -6px rgba(116, 62, 24, 0.22),
    0 6px 16px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.cowboy-switch-pill:focus-visible {
  box-shadow:
    0 0 0 3px #f6f5f3,
    0 0 0 6px #743e18,
    0 16px 36px -6px rgba(116, 62, 24, 0.25);
}

.cowboy-switch-pill:active {
  transform: translateY(0) scale(0.98);
}

.pill-active {
  background: rgba(255, 252, 247, 0.95);
  border-color: rgba(184, 115, 51, 0.7);
  box-shadow:
    0 16px 38px -6px rgba(116, 62, 24, 0.22),
    0 0 0 1px rgba(248, 207, 72, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.pill-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.cowboy-icon {
  font-size: 1.35rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(116, 62, 24, 0.2));
}

.cowboy-switch-pill:hover .cowboy-icon {
  transform: scale(1.15) rotate(-6deg);
}

.cowboy-icon-active {
  transform: scale(1.12) rotate(6deg);
  animation: hatWiggle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes hatWiggle {
  0% {
    transform: scale(1) rotate(0deg);
  }
  35% {
    transform: scale(1.25) rotate(-14deg);
  }
  65% {
    transform: scale(1.18) rotate(10deg);
  }
  85% {
    transform: scale(1.12) rotate(-4deg);
  }
  100% {
    transform: scale(1.12) rotate(6deg);
  }
}

.cowboy-title {
  font-family: "Fredoka", "Nunito", "Quicksand", ui-rounded, sans-serif;
  font-size: 0.96rem;
  font-weight: 700;
  color: #553319;
  letter-spacing: -0.01em;
}


/* Switch control */
.switch-control {
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: 9999px;
  background: #dfcdbd;
  padding: 3px;
  box-sizing: border-box;
  transition:
    background-color 0.28s ease,
    box-shadow 0.28s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
}

.switch-control-on {
  background: linear-gradient(135deg, #743e18 0%, #51280b 100%);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.35),
    0 1px 3px rgba(248, 207, 72, 0.3);
}

.switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.2s ease;
}

.thumb-on {
  transform: translateX(20px);
  background: linear-gradient(135deg, #fff9f0 0%, #fae6cf 100%);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(248, 207, 72, 0.5);
}

.thumb-star {
  font-size: 0.62rem;
  color: #a8622c;
  line-height: 1;
}

@media (max-width: 480px) {
  .bottom-switch-container {
    bottom: calc(1.1rem + env(safe-area-inset-bottom, 0px));
  }
  .cowboy-switch-pill {
    padding: 0.45rem 0.55rem 0.45rem 1rem;
    gap: 0.85rem;
  }
  .cowboy-title {
    font-size: 0.88rem;
  }
}
</style>
