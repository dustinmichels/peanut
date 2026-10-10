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
      class="birthday-switch-pill"
      :class="{ 'pill-active': modelValue }"
      role="button"
      tabindex="0"
      :aria-label="modelValue ? 'Disable Birthday Mode' : 'Enable Birthday Mode'"
      @click="toggle"
      @keydown="onKeydown"
    >
      <div class="pill-left">
        <span
          class="birthday-icon"
          :class="{ 'birthday-icon-active': modelValue }"
          aria-hidden="true"
        >
          🥳
        </span>
        <span class="birthday-title">Birthday Mode</span>
      </div>

      <div
        class="switch-control"
        :class="{ 'switch-control-on': modelValue }"
        role="switch"
        :aria-checked="modelValue"
        aria-hidden="true"
      >
        <span class="switch-thumb" :class="{ 'thumb-on': modelValue }">
          <span v-if="modelValue" class="thumb-party" aria-hidden="true">🎉</span>
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

.birthday-switch-pill {
  display: inline-flex;
  align-items: center;
  gap: 1.05rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 2px solid rgba(220, 212, 230, 0.85);
  border-radius: 9999px;
  padding: 0.5rem 0.65rem 0.5rem 1.15rem;
  box-shadow:
    0 16px 36px -6px rgba(138, 95, 242, 0.16),
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.birthday-switch-pill:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.98);
  border-color: #00b4d8;
  box-shadow:
    0 20px 42px -6px rgba(0, 168, 232, 0.22),
    0 6px 16px rgba(0, 0, 0, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.birthday-switch-pill:focus-visible {
  box-shadow:
    0 0 0 3px #f6f5f3,
    0 0 0 6px #00a8e8,
    0 16px 36px -6px rgba(0, 168, 232, 0.28);
}

.birthday-switch-pill:active {
  transform: translateY(0) scale(0.98);
}

.pill-active {
  background: rgba(255, 253, 250, 0.96);
  border-color: rgba(0, 168, 232, 0.8);
  box-shadow:
    0 16px 38px -6px rgba(0, 168, 232, 0.24),
    0 0 0 1px rgba(138, 95, 242, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.pill-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.birthday-icon {
  font-size: 1.35rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 4px rgba(138, 95, 242, 0.2));
}

.birthday-switch-pill:hover .birthday-icon {
  transform: scale(1.15) rotate(-6deg);
}

.birthday-icon-active {
  transform: scale(1.12) rotate(6deg);
  animation: partyWiggle 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes partyWiggle {
  0% {
    transform: scale(1) rotate(0deg);
  }
  35% {
    transform: scale(1.28) rotate(-14deg);
  }
  65% {
    transform: scale(1.18) rotate(10deg);
  }
  85% {
    transform: scale(1.22) rotate(-4deg);
  }
  100% {
    transform: scale(1.12) rotate(6deg);
  }
}

.birthday-title {
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: #2b2520;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.pill-active .birthday-title {
  color: #0b2545;
}


/* Switch control */
.switch-control {
  position: relative;
  width: 44px;
  height: 26px;
  background: #ded7ce;
  border-radius: 9999px;
  padding: 2px;
  transition:
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
}

.switch-control-on {
  background: linear-gradient(135deg, #00a8e8, #00c2ff);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 2px 10px rgba(0, 168, 232, 0.4);
}

.switch-thumb {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-on {
  transform: translateX(18px);
}

.thumb-party {
  font-size: 0.72rem;
  line-height: 1;
  user-select: none;
}

@media (max-width: 480px) {
  .birthday-switch-pill {
    padding: 0.4rem 0.55rem 0.4rem 0.85rem;
    gap: 0.75rem;
  }

  .birthday-title {
    font-size: 0.85rem;
  }

  .birthday-icon {
    font-size: 1.15rem;
  }

  .switch-control {
    width: 38px;
    height: 22px;
  }

  .switch-thumb {
    width: 18px;
    height: 18px;
  }

  .thumb-on {
    transform: translateX(16px);
  }
}
</style>
