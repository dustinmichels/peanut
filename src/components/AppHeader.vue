<script setup lang="ts">
defineProps<{
  showReference: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-reference'): void;
  (e: 'reset-camera'): void;
  (e: 'bounce'): void;
}>();
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <div class="brand-badge">
        <span class="peanut-icon" aria-hidden="true">🥜</span>
        <div class="brand-text">
          <div class="brand-title-row">
            <h1 class="brand-title">Julie's Peanut</h1>
            <span class="brand-pill">3D Plush</span>
          </div>
          <p class="brand-subtitle">Interactive WebGL Recreation of the Classic Plush Toy</p>
        </div>
      </div>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="action-btn reset-btn"
        title="Reset camera to photo matching angle"
        aria-label="Reset camera view"
        @click="emit('reset-camera')"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span class="btn-text-full">Reset View</span>
        <span class="btn-text-short">Reset</span>
      </button>

      <button
        type="button"
        class="action-btn bounce-btn"
        title="Make the peanut bounce and wiggle"
        @click="emit('bounce')"
      >
        <span class="btn-sparkle" aria-hidden="true">✨</span>
        <span>Bounce!</span>
      </button>

      <button
        type="button"
        class="action-btn"
        :class="{ 'action-btn-active': showReference }"
        title="Compare with original plush reference photo"
        @click="emit('toggle-reference')"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <span class="btn-text-full">{{ showReference ? 'Hide Photo' : 'Compare Photo' }}</span>
        <span class="btn-text-short">{{ showReference ? 'Hide' : 'Photo' }}</span>
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
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 1.5rem 0.75rem;
  pointer-events: none;
}

.header-brand {
  pointer-events: auto;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(220, 205, 185, 0.4);
  padding: 0.5rem 0.9rem;
  border-radius: 9999px;
  box-shadow: 0 4px 20px rgba(120, 80, 40, 0.08);
}

.peanut-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #3b2c1d;
  letter-spacing: -0.01em;
}

.brand-pill {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1dfca;
  color: #7b4b1a;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  letter-spacing: 0.04em;
}

.brand-subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: #7d6b58;
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
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #4b3823;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(215, 195, 175, 0.5);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(120, 80, 40, 0.06);
}

.action-btn:hover {
  background: #ffffff;
  border-color: #d1b596;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(120, 80, 40, 0.12);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn-active {
  background: #734821;
  color: #ffffff;
  border-color: #734821;
}

.action-btn-active:hover {
  background: #5e3a1a;
  border-color: #5e3a1a;
  color: #ffffff;
}

.bounce-btn {
  background: #fbf1e2;
  border-color: #e5cdb2;
  color: #744415;
}

.bounce-btn:hover {
  background: #faebd3;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.btn-sparkle {
  font-size: 0.85rem;
}

@media (min-width: 641px) {
  .btn-text-short {
    display: none;
  }
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding: calc(0.5rem + env(safe-area-inset-top, 0px)) 0.75rem 0.5rem;
  }
  .header-brand {
    flex-shrink: 1;
    min-width: 0;
  }
  .brand-badge {
    padding: 0.32rem 0.6rem;
    gap: 0.4rem;
  }
  .peanut-icon {
    font-size: 1.15rem;
  }
  .brand-title {
    font-size: 0.86rem;
    white-space: nowrap;
  }
  .brand-pill {
    display: none;
  }
  .brand-subtitle {
    display: none;
  }
  .header-actions {
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .action-btn {
    padding: 0.35rem 0.55rem;
    font-size: 0.73rem;
    gap: 0.25rem;
    min-height: 32px;
  }
  .reset-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
    border-radius: 9999px;
  }
  .reset-btn .btn-text-short {
    display: none;
  }
  .btn-text-full {
    display: none;
  }
  .btn-text-short {
    display: inline;
  }
}

@media (max-width: 380px) {
  .app-header {
    padding: calc(0.4rem + env(safe-area-inset-top, 0px)) 0.5rem 0.4rem;
    gap: 0.25rem;
  }
  .brand-badge {
    padding: 0.3rem 0.5rem;
    gap: 0.35rem;
  }
  .brand-title {
    font-size: 0.82rem;
  }
  .action-btn {
    padding: 0.3rem 0.45rem;
    font-size: 0.7rem;
  }
}
</style>
