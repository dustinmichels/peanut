<script setup lang="ts">
const model = defineModel<boolean>({ default: false });
const { docked = false } = defineProps<{ docked?: boolean }>();

function toggle() {
  model.value = !model.value;
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
      class="choochoo-switch-pill"
      :class="{ 'pill-active': model }"
      role="button"
      tabindex="0"
      :aria-label="model ? 'Disable Choo-Choo Mode' : 'Enable Choo-Choo Mode'"
      @click="toggle"
      @keydown="onKeydown"
    >
      <div class="pill-left">
        <span class="choochoo-icon" :class="{ 'choochoo-icon-active': model }" aria-hidden="true">
          🥸
        </span>
        <span class="choochoo-title">Choo-Choo Mode</span>
        <span class="choochoo-status-badge" :class="{ 'badge-active': model }">
          {{ model ? "ON" : "OFF" }}
        </span>
      </div>

      <div
        class="switch-control"
        :class="{ 'switch-control-on': model }"
        role="switch"
        :aria-checked="model"
        aria-hidden="true"
      >
        <span class="switch-thumb" :class="{ 'thumb-on': model }">
          <span v-if="model" class="thumb-sparkle" aria-hidden="true">✨</span>
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

.choochoo-switch-pill {
  display: inline-flex;
  align-items: center;
  gap: 1.05rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 2px solid rgba(255, 79, 163, 0.28);
  border-radius: 9999px;
  padding: 0.5rem 0.65rem 0.5rem 1.15rem;
  box-shadow:
    0 16px 36px -6px rgba(255, 63, 155, 0.18),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.choochoo-switch-pill:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.96);
  border-color: #ff3f9b;
  box-shadow:
    0 20px 42px -6px rgba(255, 63, 155, 0.28),
    0 6px 16px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.choochoo-switch-pill:focus-visible {
  box-shadow:
    0 0 0 3px #f6f5f3,
    0 0 0 6px #ff3f9b,
    0 16px 36px -6px rgba(255, 63, 155, 0.3);
}

.choochoo-switch-pill:active {
  transform: translateY(0) scale(0.98);
}

.pill-active {
  background: rgba(255, 250, 251, 0.95);
  border-color: rgba(255, 63, 155, 0.72);
  box-shadow:
    0 16px 38px -6px rgba(255, 63, 155, 0.24),
    0 0 0 1px rgba(255, 112, 184, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.pill-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.choochoo-icon {
  font-size: 1.35rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(255, 63, 155, 0.24));
}

.choochoo-switch-pill:hover .choochoo-icon {
  transform: scale(1.15) rotate(-5deg);
}

.choochoo-icon-active {
  transform: scale(1.12);
  animation: mustacheWiggle 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes mustacheWiggle {
  0% {
    transform: scale(1) rotate(0);
  }
  30% {
    transform: scale(1.24) rotate(-12deg);
  }
  60% {
    transform: scale(1.16) rotate(10deg);
  }
  80% {
    transform: scale(1.2) rotate(-4deg);
  }
  100% {
    transform: scale(1.12) rotate(0);
  }

}

.choochoo-title {
  font-family: "Fredoka", "Nunito", "Quicksand", ui-rounded, sans-serif;
  font-size: 0.96rem;
  font-weight: 700;
  color: #59161c;
  letter-spacing: -0.01em;
}

.choochoo-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "Fredoka", "Nunito", sans-serif;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.16rem 0.5rem;
  border-radius: 9999px;
  background: rgba(89, 22, 28, 0.08);
  color: #8c2a34;
  transition: all 0.25s ease;
}

.badge-active {
  background: linear-gradient(135deg, #ffb6d9 0%, #ff70b8 100%);
  color: #6b123f;
  font-weight: 900;
  box-shadow: 0 1px 4px rgba(255, 63, 155, 0.28);
}

/* Switch control */
.switch-control {
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: 9999px;
  background: #ecd4d8;
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
  background: linear-gradient(135deg, #ff4fa3 0%, #d91b79 100%);
  box-shadow:
    inset 0 1px 3px rgba(84, 5, 46, 0.32),
    0 1px 3px rgba(255, 112, 184, 0.42);
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
  background: linear-gradient(135deg, #fff7fb 0%, #ffd6ea 100%);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 112, 184, 0.55);
}

.thumb-sparkle {
  font-size: 0.62rem;
  line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
  .choochoo-icon-active {
    animation: none;
  }
}

@media (max-width: 480px) {
  .bottom-switch-container {
    bottom: calc(1.1rem + env(safe-area-inset-bottom, 0px));
  }
  .choochoo-switch-pill {
    padding: 0.45rem 0.55rem 0.45rem 1rem;
    gap: 0.85rem;
  }
  .choochoo-title {
    font-size: 0.88rem;
  }
}
</style>
