<script setup lang="ts">
import { computed } from 'vue'
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  useSettingsStore,
} from '@/stores/settings'
import { useStaticText } from '@/composables/useStaticText'

const settings = useSettingsStore()
const copy = useStaticText()

const percentLabel = computed(() => `${Math.round(settings.contentFontScale * 100)}%`)

function decrease(): void {
  settings.setContentFontScale(
    Math.round((settings.contentFontScale - FONT_SCALE_STEP) * 100) / 100,
  )
}

function increase(): void {
  settings.setContentFontScale(
    Math.round((settings.contentFontScale + FONT_SCALE_STEP) * 100) / 100,
  )
}
</script>

<template>
  <div
    class="inline-flex min-h-11 items-center gap-0 rounded-full border border-[var(--lc-border)] bg-[var(--app-panel)] text-xs font-semibold text-[var(--app-muted)] shadow-sm"
    role="group"
    :aria-label="copy.text('reader.textSize')"
  >
    <button
      type="button"
      class="min-h-11 min-w-11 rounded-full hover:bg-[var(--lc-soft)] disabled:opacity-40"
      :title="copy.text('reader.decreaseText')"
      :aria-label="copy.text('reader.decreaseText')"
      :disabled="settings.contentFontScale <= FONT_SCALE_MIN"
      @click="decrease"
    >
      −
    </button>
    <span class="min-w-[5.5rem] text-center" :title="copy.text('reader.textSize')"
      >Aa {{ percentLabel }}</span
    >
    <button
      type="button"
      class="min-h-11 min-w-11 rounded-full hover:bg-[var(--lc-soft)] disabled:opacity-40"
      :title="copy.text('reader.increaseText')"
      :aria-label="copy.text('reader.increaseText')"
      :disabled="settings.contentFontScale >= FONT_SCALE_MAX"
      @click="increase"
    >
      +
    </button>
    <button
      type="button"
      class="min-h-11 min-w-11 rounded-full hover:bg-[var(--lc-soft)] disabled:opacity-40"
      :title="copy.text('reader.resetText')"
      :aria-label="copy.text('reader.resetText')"
      :disabled="settings.contentFontScale === 1"
      @click="settings.resetContentFontScale"
    >
      ↺
    </button>
  </div>
</template>
