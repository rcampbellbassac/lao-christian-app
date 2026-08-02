<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  useSettingsStore,
} from '@/stores/settings'
import { aspectRatioPresets } from '@/utils/aspectRatios'
import type { AspectRatioId } from '@/utils/aspectRatios'
import { laoFontPresets } from '@/utils/laoFonts'
import type { LaoFontId } from '@/utils/laoFonts'
import { presentationThemePresets } from '@/utils/presentationThemes'
import type { PresentationThemeId } from '@/utils/presentationThemes'
import type { PresentationTextAlign } from '@/stores/settings'
import { useUiText } from '@/composables/useUiText'

const settings = useSettingsStore()
const text = useUiText()

onMounted(async () => {
  await settings.load()
})

const contentFontPercent = computed(() => Math.round(settings.contentFontScale * 100))
const presentationFontPercent = computed(() => Math.round(settings.presentationFontScale * 100))

function onContentFontInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  settings.setContentFontScale(value / 100)
}

function onPresentationFontInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  settings.setPresentationFontScale(value / 100)
}

function onAspectRatioChange(event: Event): void {
  settings.setPresentationAspectRatio((event.target as HTMLSelectElement).value as AspectRatioId)
}

function onThemeChange(event: Event): void {
  settings.setPresentationTheme((event.target as HTMLSelectElement).value as PresentationThemeId)
}

function onFontFamilyChange(event: Event): void {
  settings.setPresentationFontFamily((event.target as HTMLSelectElement).value as LaoFontId)
}

function onTextAlignChange(value: PresentationTextAlign): void {
  settings.setPresentationTextAlign(value)
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <h1 class="app-section-title">Settings</h1>
      <p class="app-muted mt-2 mb-4">
        These preferences are saved on this device and apply the next time you open the app.
      </p>
      <hr class="app-divider" />

      <article class="space-y-8">
        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">{{ text.lao('bilingual') }}</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            ສະແດງຄຳອະທິບາຍພາສາອັງກິດຂະໜາດນ້ອຍສຳລັບເມນູ. Content remains in Lao.
          </p>
          <button
            type="button"
            class="app-chip"
            @click="settings.setBilingualUi(!settings.bilingualUi)"
          >
            {{ settings.bilingualUi ? text.accessible('laoOnly') : text.accessible('bilingual') }}
          </button>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Reading text size</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            Adjusts the base font size for chapter content across the app.
          </p>
          <div class="flex items-center gap-4">
            <input
              type="range"
              class="w-full max-w-xs"
              :min="FONT_SCALE_MIN * 100"
              :max="FONT_SCALE_MAX * 100"
              :step="FONT_SCALE_STEP * 100"
              :value="contentFontPercent"
              @input="onContentFontInput"
            />
            <span class="w-14 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ contentFontPercent }}%</span>
            <button
              type="button"
              class="app-chip hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="settings.resetContentFontScale"
            >
              Reset
            </button>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Presentation font size</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            Default slide text size used in Presentation mode. Can also be adjusted from within a presentation.
          </p>
          <div class="flex items-center gap-4">
            <input
              type="range"
              class="w-full max-w-xs"
              :min="FONT_SCALE_MIN * 100"
              :max="FONT_SCALE_MAX * 100"
              :step="FONT_SCALE_STEP * 100"
              :value="presentationFontPercent"
              @input="onPresentationFontInput"
            />
            <span class="w-14 shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">{{ presentationFontPercent }}%</span>
            <button
              type="button"
              class="app-chip hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="settings.resetPresentationFontScale"
            >
              Reset
            </button>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Default presentation size</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            Aspect ratio used when a presentation starts. Can also be changed from within a presentation.
          </p>
          <select
            class="rounded-lg border border-slate-300/70 bg-white/85 px-3 py-2 text-sm text-slate-700 dark:border-slate-500 dark:bg-slate-800/85 dark:text-slate-100"
            :value="settings.presentationAspectRatio"
            @change="onAspectRatioChange"
          >
            <option v-for="preset in aspectRatioPresets" :key="preset.id" :value="preset.id">
              {{ preset.label }}
            </option>
          </select>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Default presentation theme</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            Background/text theme used when a presentation starts. Can also be changed from within a presentation.
          </p>
          <select
            class="rounded-lg border border-slate-300/70 bg-white/85 px-3 py-2 text-sm text-slate-700 dark:border-slate-500 dark:bg-slate-800/85 dark:text-slate-100"
            :value="settings.presentationTheme"
            @change="onThemeChange"
          >
            <option v-for="preset in presentationThemePresets" :key="preset.id" :value="preset.id">
              {{ preset.label }}
            </option>
          </select>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Default presentation text alignment</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            How content slide text is aligned. Can also be changed from within a presentation.
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="app-chip hover:bg-slate-100 dark:hover:bg-slate-800"
              :class="{ 'bg-teal-100 dark:bg-teal-900/50': settings.presentationTextAlign === 'left' }"
              @click="onTextAlignChange('left')"
            >
              Left
            </button>
            <button
              type="button"
              class="app-chip hover:bg-slate-100 dark:hover:bg-slate-800"
              :class="{ 'bg-teal-100 dark:bg-teal-900/50': settings.presentationTextAlign === 'center' }"
              @click="onTextAlignChange('center')"
            >
              Center
            </button>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-semibold text-sky-900 dark:text-sky-100">Default presentation font</h2>
          <p class="app-muted mt-1 mb-3 text-sm">
            Lao font used for slide text. Can also be changed from within a presentation.
          </p>
          <select
            class="rounded-lg border border-slate-300/70 bg-white/85 px-3 py-2 text-sm text-slate-700 dark:border-slate-500 dark:bg-slate-800/85 dark:text-slate-100"
            :value="settings.presentationFontFamily"
            @change="onFontFamilyChange"
          >
            <option v-for="preset in laoFontPresets" :key="preset.id" :value="preset.id">
              {{ preset.label }}
            </option>
          </select>
        </section>
      </article>
    </section>
  </main>
</template>
