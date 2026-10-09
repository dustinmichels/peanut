<script setup lang="ts">
import type { PoetryQuote } from "../data/poetryLines";

defineProps<{
  quote: PoetryQuote | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "next"): void;
}>();
</script>

<template>
  <Transition name="bubble-pop">
    <div
      v-if="visible && quote"
      class="poetry-bubble-container"
      role="region"
      aria-live="polite"
      aria-label="Peanut's poetry thought bubble"
    >
      <div class="poetry-bubble" @click="emit('next')" title="Click for another line of poetry">
        <button
          type="button"
          class="close-btn"
          aria-label="Close speech bubble"
          title="Close speech bubble"
          @click.stop="emit('close')"
        >
          ×
        </button>

        <div class="bubble-content">
          <span class="quote-mark" aria-hidden="true">“</span>
          <p class="poetry-text">{{ quote.line }}</p>
          <div class="poetry-meta">
            <span class="poet-name">— {{ quote.poet }}</span>
            <span v-if="quote.work" class="poem-work">({{ quote.work }})</span>
          </div>
        </div>

        <div class="bubble-hint" aria-hidden="true">
          <span>tap for more</span>
          <span class="hint-icon">📜</span>
        </div>

        <!-- Speech bubble pointer tail directed towards Peanut -->
        <div class="bubble-tail" aria-hidden="true" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.poetry-bubble-container {
  position: absolute;
  top: calc(96px + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  pointer-events: auto;
  max-width: min(340px, calc(100vw - 32px));
  width: max-content;
}

.poetry-bubble {
  position: relative;
  background: rgba(255, 253, 248, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2px solid rgba(230, 200, 162, 0.9);
  border-radius: 22px;
  padding: 1.1rem 1.35rem 0.95rem;
  box-shadow:
    0 16px 40px -6px rgba(120, 70, 20, 0.16),
    0 4px 16px rgba(120, 70, 20, 0.08),
    inset 0 1px 0 #ffffff;
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease;
}

.poetry-bubble:hover {
  transform: translateY(-2px) scale(1.015);
  box-shadow:
    0 20px 48px -6px rgba(120, 70, 20, 0.22),
    0 6px 20px rgba(120, 70, 20, 0.1),
    inset 0 1px 0 #ffffff;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 220, 195, 0.4);
  border: 1px solid rgba(210, 175, 140, 0.4);
  font-size: 1.15rem;
  line-height: 1;
  color: #8c532b;
  cursor: pointer;
  border-radius: 50%;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.close-btn:hover {
  color: #612f0c;
  background-color: rgba(200, 140, 80, 0.22);
  transform: scale(1.15);
}

.bubble-content {
  position: relative;
  padding-right: 1.25rem;
}

.quote-mark {
  position: absolute;
  top: -14px;
  left: -8px;
  font-family: Georgia, serif;
  font-size: 2.4rem;
  line-height: 1;
  color: rgba(220, 160, 100, 0.35);
  pointer-events: none;
}

.poetry-text {
  margin: 0 0 0.5rem;
  font-family:
    "Fredoka",
    "Nunito",
    -apple-system,
    sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.45;
  color: #4a2810;
  font-style: italic;
  padding-left: 0.25rem;
}

.poetry-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
  padding-left: 0.25rem;
}

.poet-name {
  font-family: "Nunito", sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  color: #8c532b;
  letter-spacing: 0.02em;
}

.poem-work {
  font-family: "Nunito", sans-serif;
  font-size: 0.74rem;
  font-weight: 600;
  color: #b08259;
  font-style: italic;
}

.bubble-hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #c49970;
  opacity: 0.8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hint-icon {
  font-size: 0.8rem;
}

/* Speech bubble pointer beak pointing downwards toward Peanut */
.bubble-tail {
  position: absolute;
  bottom: -11px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 12px;
  pointer-events: none;
}

.bubble-tail::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 11px solid rgba(230, 200, 162, 0.9);
}

.bubble-tail::after {
  content: "";
  position: absolute;
  top: -2px;
  left: 1px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #fffdf8;
}

/* Animations */
.bubble-pop-enter-active {
  transition:
    opacity 0.36s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-pop-leave-active {
  transition:
    opacity 0.22s ease-out,
    transform 0.22s ease-out;
}

.bubble-pop-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(14px) scale(0.85);
}

.bubble-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.92);
}

@media (max-width: 480px) {
  .poetry-bubble-container {
    top: calc(82px + env(safe-area-inset-top, 0px));
    max-width: min(320px, calc(100vw - 24px));
  }
  .poetry-bubble {
    padding: 0.85rem 1.05rem 0.75rem;
    border-radius: 18px;
  }
  .poetry-text {
    font-size: 0.86rem;
    line-height: 1.38;
  }
  .poet-name {
    font-size: 0.74rem;
  }
  .poem-work {
    font-size: 0.68rem;
  }
}
</style>
