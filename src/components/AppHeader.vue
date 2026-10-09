<script setup lang="ts">
const emit = defineEmits<{
  (e: "bounce"): void;
}>();
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <div class="brand-badge">
        <div class="peanut-avatar" aria-hidden="true">
          <span class="peanut-icon">🥜</span>
          <span class="blush-glow" />
        </div>
        <h1 class="brand-title">Julie's Peanut</h1>
      </div>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="action-btn bounce-btn"
        title="Make the peanut bounce and wiggle"
        @click="emit('bounce')"
      >
        <span class="btn-sparkle" aria-hidden="true">✨</span>
        <span>Bounce!</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(0.85rem + env(safe-area-inset-top, 0px)) 1.75rem 0.85rem;
  pointer-events: none;
}

.header-brand {
  pointer-events: auto;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 1.05rem;
  background: rgba(255, 253, 248, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2.5px solid rgba(240, 218, 192, 0.9);
  padding: 0.65rem 1.45rem 0.65rem 0.85rem;
  border-radius: 32px;
  box-shadow:
    0 14px 38px -4px rgba(120, 70, 20, 0.13),
    0 4px 14px rgba(120, 70, 20, 0.06),
    inset 0 1px 0 #ffffff;
  transition:
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.28s ease;
  user-select: none;
}

.brand-badge:hover {
  transform: translateY(-3px) scale(1.015);
  box-shadow:
    0 18px 44px -4px rgba(120, 70, 20, 0.18),
    0 6px 18px rgba(120, 70, 20, 0.09),
    inset 0 1px 0 #ffffff;
}

.peanut-avatar {
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff8ee 0%, #ffeacc 100%);
  border: 2.5px solid #f6cda3;
  box-shadow:
    0 4px 12px rgba(160, 90, 30, 0.16),
    inset 0 2px 4px rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: peanut-idle 4s ease-in-out infinite;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes peanut-idle {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-4deg) scale(1.03);
  }
  50% {
    transform: rotate(4deg) scale(1.04);
  }
  75% {
    transform: rotate(-2deg) scale(1.02);
  }
}

.brand-badge:hover .peanut-avatar {
  animation: peanut-wiggle 0.6s ease-in-out infinite alternate;
}

@keyframes peanut-wiggle {
  0% {
    transform: rotate(-10deg) scale(1.1);
  }
  100% {
    transform: rotate(10deg) scale(1.15);
  }
}

.blush-glow {
  position: absolute;
  bottom: 8px;
  width: 32px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 140, 140, 0.35) 0%,
    rgba(255, 140, 140, 0) 75%
  );
  pointer-events: none;
}

.peanut-icon {
  font-size: 2.15rem;
  line-height: 1;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(130, 70, 20, 0.18));
}

.brand-title {
  margin: 0;
  font-family:
    "Fredoka", "Nunito", "Quicksand", ui-rounded, "Hiragino Maru Gothic ProN",
    "Arial Rounded MT Bold", sans-serif;
  font-size: 2.1rem;
  font-weight: 700;
  color: #3d210d;
  letter-spacing: -0.015em;
  line-height: 1.12;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 8px rgba(120, 60, 10, 0.07);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  pointer-events: auto;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.35rem;
  border-radius: 9999px;
  font-family: "Fredoka", "Nunito", "Quicksand", sans-serif;
  font-size: 0.98rem;
  font-weight: 600;
  color: #4b3823;
  background: rgba(255, 253, 248, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 2px solid rgba(225, 205, 185, 0.85);
  cursor: pointer;
  transition: all 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(120, 80, 40, 0.1);
}

.action-btn:hover {
  background: #ffffff;
  border-color: #d1b596;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 22px rgba(120, 80, 40, 0.16);
}

.action-btn:active {
  transform: translateY(0) scale(0.98);
}

.bounce-btn {
  background: linear-gradient(135deg, #fff7ec 0%, #ffeed5 100%);
  border-color: #f4cba0;
  color: #723e0c;
  box-shadow: 0 4px 16px rgba(180, 110, 40, 0.14);
}

.bounce-btn:hover {
  background: linear-gradient(135deg, #fffbf3 0%, #fff2dd 100%);
  border-color: #eebf8e;
}

.btn-sparkle {
  font-size: 0.95rem;
  animation: sparkle-twinkle 2s ease-in-out infinite;
}

@keyframes sparkle-twinkle {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(15deg);
  }
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: calc(0.6rem + env(safe-area-inset-top, 0px)) 0.85rem 0.6rem;
  }
  .header-brand {
    flex-shrink: 1;
    min-width: 0;
  }
  .brand-badge {
    padding: 0.45rem 0.85rem 0.5rem 0.65rem;
    gap: 0.6rem;
    border-radius: 20px;
    border-width: 1.5px;
  }
  .peanut-avatar {
    width: 38px;
    height: 38px;
  }
  .peanut-icon {
    font-size: 1.4rem;
  }
  .brand-title {
    font-size: 1.22rem;
    white-space: nowrap;
  }
  .header-actions {
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .action-btn {
    padding: 0.45rem 0.85rem;
    font-size: 0.82rem;
    gap: 0.3rem;
    min-height: 36px;
  }
}

@media (max-width: 400px) {
  .app-header {
    padding: calc(0.45rem + env(safe-area-inset-top, 0px)) 0.6rem 0.45rem;
    gap: 0.35rem;
  }
  .brand-badge {
    padding: 0.35rem 0.65rem 0.4rem 0.5rem;
    gap: 0.45rem;
    border-radius: 16px;
  }
  .peanut-avatar {
    width: 32px;
    height: 32px;
  }
  .peanut-icon {
    font-size: 1.2rem;
  }
  .brand-title {
    font-size: 0.95rem;
  }
  .action-btn {
    padding: 0.35rem 0.55rem;
    font-size: 0.74rem;
    gap: 0.25rem;
  }
}
</style>
