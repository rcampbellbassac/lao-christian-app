<script setup lang="ts">
import { computed } from 'vue'
import darkLogo from '@/assets/img/logo 2-black.png'
import lightLogo from '@/assets/img/logo 2-white.png'
import type { DeckSlide } from '@/stores/decks'
import type { AspectRatioId } from '@/utils/aspectRatios'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import { getAspectRatioPreset } from '@/utils/aspectRatios'
import {
  getPresentationThemeBackground,
  getPresentationThemePreset,
} from '@/utils/presentationThemes'
import { sanitizeContentHtml } from '@/utils/sanitize'
import { getLaoFontPreset, type LaoFontId } from '@/utils/laoFonts'
import type { PresentationTextAlign } from '@/stores/settings'

const props = withDefaults(
  defineProps<{
    slide?: Pick<DeckSlide, 'title' | 'html' | 'layout'>
    aspectRatio: AspectRatioId
    theme: PresentationThemeId
    fontScale?: number
    fontFamily?: LaoFontId
    textAlign?: PresentationTextAlign
    blank?: boolean
  }>(),
  {
    fontScale: 1,
    fontFamily: 'noto-sans-lao',
    textAlign: 'left',
  },
)
const ratio = computed(() => getAspectRatioPreset(props.aspectRatio).ratio)
const colors = computed(() => getPresentationThemePreset(props.theme))
const slideBackground = computed(() =>
  getPresentationThemeBackground(colors.value, props.aspectRatio),
)
const logo = computed(() => (colors.value.logoTone === 'light' ? lightLogo : darkLogo))
const font = computed(() => getLaoFontPreset(props.fontFamily))
const layout = computed(() => props.slide?.layout ?? 'content')
</script>

<template>
  <article
    class="deck-canvas"
    :style="{
      aspectRatio: String(ratio),
      background: slideBackground,
      color: colors.textColor,
      '--deck-ratio': ratio,
      '--deck-font-scale': fontScale,
      '--deck-font-family': font.cssFamily,
      '--deck-text-align': textAlign,
      '--deck-muted-color': colors.mutedColor,
    }"
  >
    <div v-if="blank" class="deck-blank"></div>
    <div
      v-else-if="slide"
      class="deck-content"
      :class="{ 'deck-content--title': layout === 'title' }"
    >
      <img class="deck-logo" :src="logo" alt="" aria-hidden="true" />
      <h1
        class="deck-title"
        :class="{ 'deck-title--header': layout === 'content' }"
        v-html="sanitizeContentHtml(slide.title)"
      ></h1>
      <div
        :class="layout === 'title' ? 'deck-subtitle' : 'deck-body'"
        v-html="sanitizeContentHtml(slide.html)"
      ></div>
    </div>
  </article>
</template>

<style scoped>
.deck-canvas {
  position: relative;
  width: 100%;
  max-height: 100%;
  container-type: inline-size;
  overflow: hidden;
  border-radius: 0.5rem;
  font-family: var(--deck-font-family, inherit);
  text-align: var(--deck-text-align, left);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.3);
}
.deck-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding: 4.2cqw;
}
.deck-content--title {
  align-items: center;
  text-align: center;
}
.deck-logo {
  position: absolute;
  left: 3.5%;
  bottom: 3.5%;
  width: 14%;
  height: auto;
  opacity: 0.82;
}
.deck-title {
  margin: 0;
  font-family: var(--deck-font-family, inherit);
  font-size: calc(4.2cqw * var(--deck-font-scale, 1));
  line-height: 1.1;
  font-weight: 600;
}
.deck-title--header {
  font-size: calc(1.8cqw * var(--deck-font-scale, 1));
  color: var(--deck-muted-color);
  opacity: 0.88;
}
.deck-subtitle {
  margin-top: 1.1cqw;
  font-size: calc(2.1cqw * var(--deck-font-scale, 1));
  color: var(--deck-muted-color);
}
.deck-body {
  margin-top: 1.8cqw;
  font-size: calc(2.25cqw * var(--deck-font-scale, 1));
  line-height: 1.5;
}
.deck-blank {
  position: absolute;
  inset: 0;
  background: #000;
}
:global(.deck-body p) {
  margin: 0 0 0.9em;
}
:global(.deck-body ul),
:global(.deck-body ol) {
  padding-left: 1.4em;
}
</style>
