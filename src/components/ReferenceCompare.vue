<script setup lang="ts">
import { shallowRef } from 'vue';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isMinimized = shallowRef(false);

const features = [
  {
    title: 'Peanut Silhouette',
    desc: 'Dual-bulb pinched waist with organic asymmetry and cute top tuft'
  },
  {
    title: 'Bouclé Fleece',
    desc: 'Procedural curly sherpa plush texture with velvet sheen rim highlights'
  },
  {
    title: 'Safety Bead Eyes',
    desc: 'Glossy black bead eyes nestled in plush sockets with specular catchlights'
  },
  {
    title: 'Stitched Smile',
    desc: 'Friendly asymmetrical smirk embroidered across the upper bulb'
  },
  {
    title: 'Corduroy Booties',
    desc: 'Brown vertically ribbed corduroy legs and stable standing shoe feet'
  }
];

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}
</script>

<template>
  <div v-if="visible" class="ref-backdrop" @click="emit('close')"></div>
  <aside v-if="visible" class="ref-card" :class="{ 'ref-card-minimized': isMinimized }">
    <div class="ref-header">
      <div class="ref-title-group">
        <span class="ref-badge">Reference Match</span>
        <h2 class="ref-heading">Original Plush Toy</h2>
      </div>

      <div class="ref-actions">
        <button
          type="button"
          class="icon-btn"
          :title="isMinimized ? 'Expand' : 'Minimize'"
          @click="toggleMinimize"
        >
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <g v-if="!isMinimized">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
            </g>
            <g v-else>
              <polyline points="14 10 20 10 20 4" />
              <polyline points="10 14 4 14 4 20" />
            </g>
          </svg>
        </button>

        <button
          type="button"
          class="icon-btn"
          title="Close comparison"
          @click="emit('close')"
        >
          <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <div v-show="!isMinimized" class="ref-body">
      <div class="photo-wrapper">
        <img
          src="/peanut-reference.webp"
          alt="Amuseable Peanut plush reference photograph"
          class="ref-img"
          loading="eager"
        />
        <div class="photo-overlay">
          <span class="photo-tag">Source Photo</span>
        </div>
      </div>

      <div class="features-list">
        <div v-for="item in features" :key="item.title" class="feature-item">
          <span class="feature-bullet" aria-hidden="true">✓</span>
          <div class="feature-content">
            <strong class="feature-title">{{ item.title }}</strong>
            <p class="feature-desc">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.ref-card {
  position: absolute;
  top: 5rem;
  right: 1.5rem;
  z-index: 15;
  width: 320px;
  max-width: calc(100vw - 3rem);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(220, 205, 185, 0.55);
  border-radius: 1.25rem;
  box-shadow: 0 12px 36px rgba(95, 65, 30, 0.15), 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.ref-card-minimized {
  width: 240px;
}

.ref-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: rgba(248, 243, 235, 0.7);
  border-bottom: 1px solid rgba(230, 218, 202, 0.5);
}

.ref-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b5321;
}

.ref-heading {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #3b2b1d;
}

.ref-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid rgba(200, 185, 170, 0.4);
  background: #ffffff;
  color: #695440;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: #f5ece0;
  color: #3a2717;
}

.icon-svg {
  width: 13px;
  height: 13px;
}

.ref-body {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: calc(100vh - 14rem);
  overflow-y: auto;
}

.photo-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #fbf8f4;
  border: 1px solid rgba(215, 195, 175, 0.4);
}

.ref-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-overlay {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
}

.photo-tag {
  font-size: 0.68rem;
  font-weight: 600;
  color: #4a3420;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.78rem;
}

.feature-bullet {
  color: #2e8b57;
  font-weight: 800;
  line-height: 1.3;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.feature-title {
  color: #3f2e1e;
  font-weight: 600;
}

.feature-desc {
  margin: 0;
  color: #7a6652;
  font-size: 0.72rem;
  line-height: 1.35;
}

.ref-backdrop {
  display: none;
}

@media (max-width: 640px) {
  .ref-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 28;
    background: rgba(30, 20, 10, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }

  .ref-card {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    z-index: 30;
    border-radius: 1.5rem 1.5rem 0 0;
    border-bottom: none;
    box-shadow: 0 -8px 36px rgba(70, 45, 20, 0.22);
    animation: slideUpSheet 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    max-height: 82vh;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .ref-card-minimized {
    width: 100%;
  }

  .ref-body {
    max-height: calc(82vh - 4.5rem - env(safe-area-inset-bottom, 0px));
    padding: 0.75rem 1rem 1rem;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUpSheet {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
