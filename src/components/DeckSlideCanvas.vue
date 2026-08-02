<script setup lang="ts">
import { computed } from 'vue'
import darkLogo from '@/assets/img/logo 2-black.png'
import lightLogo from '@/assets/img/logo 2-white.png'
import type { DeckSlide } from '@/stores/decks'
import type { AspectRatioId } from '@/utils/aspectRatios'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import { getAspectRatioPreset } from '@/utils/aspectRatios'
import { getPresentationThemeBackground, getPresentationThemePreset } from '@/utils/presentationThemes'
import { sanitizeContentHtml } from '@/utils/sanitize'

const props = defineProps<{ slide?: DeckSlide; aspectRatio: AspectRatioId; theme: PresentationThemeId; blank?: boolean }>()
const ratio = computed(() => getAspectRatioPreset(props.aspectRatio).ratio)
const colors = computed(() => getPresentationThemePreset(props.theme))
const slideBackground = computed(() => getPresentationThemeBackground(colors.value, props.aspectRatio))
const logo = computed(() => colors.value.logoTone === 'light' ? lightLogo : darkLogo)
</script>

<template>
  <article class="deck-canvas" :style="{ aspectRatio: String(ratio), background: slideBackground, color: colors.textColor }">
    <div v-if="blank" class="deck-blank"></div>
    <template v-else-if="slide">
      <img class="deck-logo" :src="logo" alt="" aria-hidden="true" />
      <h1>{{ slide.title }}</h1>
      <div class="deck-body" v-html="sanitizeContentHtml(slide.html)"></div>
    </template>
  </article>
</template>

<style scoped>
.deck-canvas { position: relative; width: 100%; max-height: 100%; display: grid; align-content: center; overflow: hidden; padding: clamp(1rem, 5vw, 5rem); border-radius: .5rem; text-align: center; box-shadow: 0 16px 50px rgba(0,0,0,.3); }
.deck-logo { position: absolute; left: 3.5%; bottom: 3.5%; width: clamp(4.5rem, 14%, 10rem); height: auto; opacity: .82; }
.deck-canvas h1 { margin: 0 0 1.4rem; font-family: "Noto Serif Lao Variable", serif; font-size: clamp(1.4rem, 4vw, 4rem); font-weight: 600; }
.deck-body { font-size: clamp(1rem, 2.5vw, 2.5rem); line-height: 1.55; }
.deck-blank { position: absolute; inset: 0; background: #000; }
:global(.deck-body p) { margin: .3em 0; }
</style>
