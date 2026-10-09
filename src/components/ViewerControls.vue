<script setup lang="ts">
import { shallowRef } from "vue";
import type { LightingPresetId, MaterialModeId, ViewPresetId } from "../types/peanut";

defineProps<{
  currentView: ViewPresetId;
  currentLighting: LightingPresetId;
  currentMaterial: MaterialModeId;
  autoRotate: boolean;
  breathing: boolean;
  fuzzIntensity: number;
  cowboyMode?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:view", val: ViewPresetId): void;
  (e: "update:lighting", val: LightingPresetId): void;
  (e: "update:material", val: MaterialModeId): void;
  (e: "update:fuzz", val: number): void;
  (e: "toggle:autoRotate"): void;
  (e: "toggle:breathing"): void;
  (e: "toggle:cowboyMode"): void;
  (e: "trigger:bounce"): void;
}>();

const activeTab = shallowRef<"view" | "material" | "light" | "animate">("view");

const viewOptions: Array<{ id: ViewPresetId; label: string; icon: string }> = [
  { id: "photo", label: "Photo Hero", icon: "📸" },
  { id: "face", label: "Cute Face", icon: "👀" },
  { id: "front", label: "Front", icon: "🧍" },
  { id: "feet", label: "Booties", icon: "👞" },
  { id: "side", label: "Profile", icon: "🥜" },
];

const materialOptions: Array<{ id: MaterialModeId; label: string; icon: string }> = [
  { id: "fleece", label: "Bouclé Fleece", icon: "🧶" },
  { id: "smooth", label: "Smooth Toy", icon: "✨" },
  { id: "wireframe", label: "Wireframe", icon: "📐" },
];

const lightingOptions: Array<{ id: LightingPresetId; label: string; icon: string }> = [
  { id: "studio", label: "Studio Warm", icon: "💡" },
  { id: "golden", label: "Golden Hour", icon: "🌅" },
  { id: "daylight", label: "Daylight", icon: "☀️" },
  { id: "dramatic", label: "Spotlight", icon: "🎭" },
];

function onFuzzChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:fuzz", parseFloat(target.value));
}
</script>

<template>
  <nav class="controls-dock" aria-label="3D peanut viewer controls">
    <!-- Category Tabs -->
    <div class="dock-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'view' }"
        @click="activeTab = 'view'"
      >
        <span>Angles</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'material' }"
        @click="activeTab = 'material'"
      >
        <span>Material</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'light' }"
        @click="activeTab = 'light'"
      >
        <span>Lighting</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'animate' }"
        @click="activeTab = 'animate'"
      >
        <span>Motion</span>
      </button>
    </div>

    <!-- Active Category Panel -->
    <div class="dock-panel">
      <!-- 1. View Angles -->
      <div v-show="activeTab === 'view'" class="panel-row">
        <button
          v-for="opt in viewOptions"
          :key="opt.id"
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn-active': currentView === opt.id }"
          @click="emit('update:view', opt.id)"
        >
          <span class="chip-icon">{{ opt.icon }}</span>
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <!-- 2. Materials & Fuzz -->
      <div v-show="activeTab === 'material'" class="panel-row-column">
        <div class="panel-chips">
          <button
            v-for="opt in materialOptions"
            :key="opt.id"
            type="button"
            class="chip-btn"
            :class="{ 'chip-btn-active': currentMaterial === opt.id }"
            @click="emit('update:material', opt.id)"
          >
            <span class="chip-icon">{{ opt.icon }}</span>
            <span>{{ opt.label }}</span>
          </button>
        </div>

        <div v-show="currentMaterial === 'fleece'" class="slider-group">
          <label class="slider-label" for="fuzz-slider">
            <span>Fleece Texture</span>
            <span class="slider-value">{{ Math.round(fuzzIntensity * 100) }}%</span>
          </label>
          <input
            id="fuzz-slider"
            type="range"
            min="0.3"
            max="1.8"
            step="0.05"
            :value="fuzzIntensity"
            class="slider-input"
            @input="onFuzzChange"
          />
        </div>
      </div>

      <!-- 3. Lighting Moods -->
      <div v-show="activeTab === 'light'" class="panel-row">
        <button
          v-for="opt in lightingOptions"
          :key="opt.id"
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn-active': currentLighting === opt.id }"
          @click="emit('update:lighting', opt.id)"
        >
          <span class="chip-icon">{{ opt.icon }}</span>
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <!-- 4. Animation & Physics -->
      <div v-show="activeTab === 'animate'" class="panel-row">
        <button type="button" class="chip-btn bounce-action-btn" @click="emit('trigger:bounce')">
          <span class="chip-icon">🦘</span>
          <span>Bounce!</span>
        </button>

        <button
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn-active': cowboyMode }"
          @click="emit('toggle:cowboyMode')"
        >
          <span class="chip-icon">🤠</span>
          <span>Cowboy Mode ({{ cowboyMode ? "ON" : "OFF" }})</span>
        </button>
        <button
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn-active': breathing }"
          @click="emit('toggle:breathing')"
        >
          <span class="chip-icon">🫁</span>
          <span>Breathe ({{ breathing ? "ON" : "OFF" }})</span>
        </button>

        <button
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn-active': autoRotate }"
          @click="emit('toggle:autoRotate')"
        >
          <span class="chip-icon">🔄</span>
          <span>360° Spin ({{ autoRotate ? "ON" : "OFF" }})</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.controls-dock {
  position: absolute;
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: auto;
  max-width: calc(100vw - 2rem);
  pointer-events: auto;
}

.dock-tabs {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0.3rem 0.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(220, 205, 185, 0.5);
  box-shadow: 0 4px 20px rgba(100, 70, 35, 0.08);
}

.tab-btn {
  padding: 0.35rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #6d5843;
  background: transparent;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-btn:hover {
  color: #382717;
  background: rgba(230, 215, 195, 0.3);
}

.tab-btn-active {
  color: #ffffff;
  background: #734821;
}

.tab-btn-active:hover {
  color: #ffffff;
  background: #603a18;
}

.dock-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 0.6rem 0.85rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(220, 205, 185, 0.6);
  box-shadow: 0 8px 30px rgba(100, 70, 35, 0.12);
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: center;
}

.panel-row-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
}

.panel-chips {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: center;
}

.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #55412e;
  background: #f8f4ee;
  border: 1px solid rgba(210, 190, 170, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.chip-btn:hover {
  background: #efe7dc;
  border-color: #c9ab8b;
  transform: translateY(-1px);
}

.chip-btn:active {
  transform: translateY(0);
}

.chip-btn-active {
  background: #8b5528;
  color: #ffffff;
  border-color: #8b5528;
  box-shadow: 0 2px 8px rgba(139, 85, 40, 0.28);
}

.chip-btn-active:hover {
  background: #77461e;
  border-color: #77461e;
  color: #ffffff;
}

.bounce-action-btn {
  background: #fbf0dc;
  border-color: #e5cb9e;
  color: #7d4812;
  font-weight: 700;
}

.bounce-action-btn:hover {
  background: #fae6c4;
}

.chip-icon {
  font-size: 0.95rem;
  line-height: 1;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 280px;
  padding: 0.1rem 0.4rem;
}

.slider-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #695440;
  white-space: nowrap;
}

.slider-value {
  color: #8b5528;
  font-weight: 700;
}

.slider-input {
  flex: 1;
  accent-color: #8b5528;
  cursor: pointer;
}

@media (max-width: 640px) {
  .controls-dock {
    bottom: calc(0.65rem + env(safe-area-inset-bottom, 0px));
    width: calc(100% - 1.25rem);
    max-width: 440px;
    gap: 0.35rem;
  }
  .dock-tabs {
    padding: 0.22rem 0.3rem;
    gap: 0.2rem;
  }
  .tab-btn {
    padding: 0.35rem 0.65rem;
    font-size: 0.73rem;
    min-height: 32px;
  }
  .dock-panel {
    width: 100%;
    padding: 0.45rem 0.5rem;
    border-radius: 1rem;
    box-sizing: border-box;
  }
  .panel-row {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    justify-content: flex-start;
    padding: 0.1rem 0.2rem;
    gap: 0.35rem;
  }
  .panel-row::-webkit-scrollbar {
    display: none;
  }
  .panel-row-column {
    width: 100%;
    gap: 0.4rem;
  }
  .panel-chips {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    justify-content: center;
    gap: 0.35rem;
  }
  .panel-chips::-webkit-scrollbar {
    display: none;
  }
  .chip-btn {
    flex-shrink: 0;
    padding: 0.35rem 0.6rem;
    font-size: 0.74rem;
    min-height: 34px;
  }
  .slider-group {
    max-width: 100%;
    padding: 0.1rem 0.2rem;
  }
}

@media (max-width: 380px) {
  .tab-btn {
    padding: 0.3rem 0.45rem;
    font-size: 0.68rem;
  }
  .chip-btn {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
  }
}
</style>
