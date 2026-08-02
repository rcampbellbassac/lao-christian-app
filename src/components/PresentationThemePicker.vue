<script setup lang="ts">
import type { AspectRatioId } from '@/utils/aspectRatios'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import {
  getPresentationThemeBackground,
  presentationThemePresets,
} from '@/utils/presentationThemes'
import { useStaticText } from '@/composables/useStaticText'

defineProps<{
  modelValue: PresentationThemeId
  aspectRatio: AspectRatioId
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PresentationThemeId]
}>()
const copy = useStaticText()
</script>

<template>
  <div class="theme-picker" role="radiogroup" :aria-label="copy.text('presentation.theme')">
    <button
      v-for="preset in presentationThemePresets"
      :key="preset.id"
      class="theme-option"
      :class="{ 'theme-option--selected': modelValue === preset.id }"
      type="button"
      role="radio"
      :aria-checked="modelValue === preset.id"
      :aria-label="copy.text(preset.labelKey)"
      @click="emit('update:modelValue', preset.id)"
    >
      <span
        class="theme-option-art"
        :style="{
          aspectRatio: aspectRatio === 'a4' ? '8.5 / 11' : aspectRatio.replace(':', ' / '),
          background: getPresentationThemeBackground(preset, aspectRatio),
        }"
      >
        <span v-if="modelValue === preset.id" class="theme-option-check" aria-hidden="true">✓</span>
      </span>
      <span class="theme-option-label">{{ copy.text(preset.labelKey) }}</span>
    </button>
  </div>
</template>

<style scoped>
.theme-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: .65rem; width: 100%; }
.theme-option { min-width: 0; border: 1px solid var(--lc-border); border-radius: .7rem; padding: .35rem; background: var(--app-panel); color: var(--app-ink); text-align: start; transition: border-color .15s ease, transform .15s ease, box-shadow .15s ease; }
.theme-option:hover { transform: translateY(-1px); border-color: var(--lc-brand); }
.theme-option--selected { border-color: var(--lc-brand); box-shadow: 0 0 0 2px color-mix(in srgb, var(--lc-brand), transparent 65%); }
.theme-option-art { position: relative; display: block; width: 100%; max-height: 6.5rem; overflow: hidden; border-radius: .45rem; background-color: var(--lc-dark-bg); }
.theme-option-check { position: absolute; top: .35rem; right: .35rem; display: grid; width: 1.5rem; height: 1.5rem; place-items: center; border-radius: 999px; background: var(--lc-brand); color: white; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
.theme-option-label { display: block; overflow: hidden; padding: .4rem .15rem .1rem; font-size: .78rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
</style>
