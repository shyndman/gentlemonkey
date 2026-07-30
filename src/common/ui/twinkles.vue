<template>
  <span
    ref="field"
    class="twinkle-field"
    aria-hidden="true"
    @animationiteration="onAnimationIteration">
    <span
      v-for="(style, index) in twinkles"
      :key="index"
      class="twinkle"
      :style />
  </span>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const HOST_CLASS = 'twinkle-host';
const TWINKLE_COLORS = Object.freeze(['#ffffff', '#fff3a8', '#e8d2ff', '#c8b5ff']);
const MIN_SIZE_PX = 7;
const MAX_SIZE_PX = 22;
const MIN_DURATION_SECONDS = 1.35;
const MAX_DURATION_SECONDS = 3.1;

const props = defineProps({
  count: {
    type: Number,
    required: true,
    validator: value => Number.isInteger(value) && value > 0,
  },
});
const emit = defineEmits({ shown: null });
const field = ref(null);
let host;
let addedHostClass;
/** @type {IntersectionObserver | undefined} */
let visibilityObserver;

/** @param {number} minimum @param {number} maximum @returns {number} */
function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

/** @returns {string} */
function randomColor() {
  return TWINKLE_COLORS[Math.floor(Math.random() * TWINKLE_COLORS.length)];
}

/** @returns {Record<string, string>} */
function makePositionStyle() {
  return {
    '--x': `${randomBetween(2, 98).toFixed(2)}%`,
    '--y': `${randomBetween(5, 95).toFixed(2)}%`,
    '--size': `${randomBetween(MIN_SIZE_PX, MAX_SIZE_PX).toFixed(1)}px`,
    '--rotation': `${randomBetween(-25, 25).toFixed(1)}deg`,
    '--color': randomColor(),
  };
}

/** @returns {Record<string, string>} */
function makeTwinkleStyle() {
  const duration = randomBetween(MIN_DURATION_SECONDS, MAX_DURATION_SECONDS);
  return {
    ...makePositionStyle(),
    '--duration': `${duration.toFixed(2)}s`,
    '--delay': `${randomBetween(-duration, 0).toFixed(2)}s`,
  };
}

const twinkles = Array.from({ length: props.count }, makeTwinkleStyle);

/** @param {AnimationEvent} event */
function onAnimationIteration(event) {
  const twinkle = event.target;
  if (!(twinkle instanceof HTMLElement) || !twinkle.classList.contains('twinkle')) return;
  for (const [property, value] of Object.entries(makePositionStyle())) {
    twinkle.style.setProperty(property, value);
  }
}

onMounted(() => {
  host = field.value?.parentElement;
  if (host) {
    addedHostClass = !host.classList.contains(HOST_CLASS);
    host.classList.add(HOST_CLASS);
  }
  visibilityObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    visibilityObserver.disconnect();
    emit('shown');
  }, { threshold: .35 });
  visibilityObserver.observe(field.value);
});

onBeforeUnmount(() => {
  visibilityObserver?.disconnect();
  if (addedHostClass) host?.classList.remove(HOST_CLASS);
});
</script>

<style>
/*
 * A twinkle field can decorate any element without affecting its layout or input.
 * Its bright, independently timed four-point stars repeatedly appear at new random
 * positions, making the host look unmistakably dusted with light-catching glitter.
 */
.twinkle-host {
  position: relative;
  isolation: isolate;
}

.twinkle-field {
  position: absolute;
  z-index: 5;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.twinkle {
  position: absolute;
  top: var(--y);
  left: var(--x);
  width: var(--size);
  aspect-ratio: 1;
  opacity: 0;
  background: radial-gradient(circle, #fff 0 16%, var(--color) 38% 100%);
  clip-path: polygon(50% 0, 58% 41%, 100% 50%, 58% 59%, 50% 100%, 42% 59%, 0 50%, 42% 41%);
  filter:
    drop-shadow(0 0 2px #fff)
    drop-shadow(0 0 7px var(--color));
  transform: translate(-50%, -50%) rotate(var(--rotation)) scale(0);
  animation: twinkle var(--duration) var(--delay) ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes twinkle {
  0%, 67%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--rotation)) scale(0);
  }
  73% {
    opacity: .75;
    transform: translate(-50%, -50%) rotate(var(--rotation)) scale(.45);
  }
  79% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 12deg)) scale(1.35);
  }
  86% {
    opacity: .9;
    transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 18deg)) scale(.8);
  }
  93% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(calc(var(--rotation) + 24deg)) scale(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .twinkle {
    animation-duration: calc(var(--duration) * 2);
  }
}
</style>
