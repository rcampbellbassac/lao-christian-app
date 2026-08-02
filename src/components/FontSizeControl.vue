<script setup lang="ts">
import { computed } from 'vue'
import { FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, useSettingsStore } from '@/stores/settings'
import { useStaticText } from '@/composables/useStaticText'

const settings = useSettingsStore()
const copy = useStaticText()

const percentLabel = computed(() => `${Math.round(settings.contentFontScale * 100)}%`)

function decrease(): void {
  settings.setContentFontScale(
    Math.round((settings.contentFontScale - FONT_SCALE_STEP) * 100) / 100
  )
}

function increase(): void {
  settings.setContentFontScale(
    Math.round((settings.contentFontScale + FONT_SCALE_STEP) * 100) / 100
  )
}
</script>

<template>
  <div
    class="inline-flex items-center gap-1 rounded-full border border-slate-300/70 bg-white/85 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-500 dark:bg-slate-800/85 dark:text-slate-100"
    role="group"
    :aria-label="copy.text('reader.textSize')"
  >
    <button
      type="button"
      class="rounded-full px-1.5 py-0.5 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-700"
      :title="copy.text('reader.decreaseText')"
      :aria-label="copy.text('reader.decreaseText')"
      :disabled="settings.contentFontScale <= FONT_SCALE_MIN"
      @click="decrease"
    >
      −
    </button>
    <span class="min-w-[3ch] text-center" :title="copy.text('reader.textSize')">Aa {{ percentLabel }}</span>
    <button
      type="button"
      class="rounded-full px-1.5 py-0.5 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-700"
      :title="copy.text('reader.increaseText')"
      :aria-label="copy.text('reader.increaseText')"
      :disabled="settings.contentFontScale >= FONT_SCALE_MAX"
      @click="increase"
    >
      +
    </button>
    <button
      type="button"
      class="rounded-full px-1.5 py-0.5 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-slate-700"
      :title="copy.text('reader.resetText')"
      :aria-label="copy.text('reader.resetText')"
      :disabled="settings.contentFontScale === 1"
      @click="settings.resetContentFontScale"
    >
      ↺
    </button>
  </div>
</template>
