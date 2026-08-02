<script setup lang="ts">
import MainContentSelector from '@/components/MainContentSelector.vue';
import { useUiText } from '@/composables/useUiText'
import { useStaticText } from '@/composables/useStaticText'
const text = useUiText()
const copy = useStaticText()
</script>
<template>
  <main class="app-page">
    <section class="lc-home-hero app-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="app-section-title flex items-center gap-3">
          <img src="../assets/img/logo 2-black.png" alt="LaoChristian.org Logo" class="h-12 inline dark:hidden sm:h-14" />
          <img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-12 hidden dark:inline sm:h-14" />
          <span lang="lo">ລາວຄຣິສຕຽນ</span>
        </h1>
        <span class="app-chip">LaoChristian.org</span>
      </div>
      <p class="app-muted mt-2 italic">
        {{ copy.text('home.tagline') }}
      </p>
      <hr class="app-divider" />
      <article class="space-y-4 text-slate-700 dark:text-slate-200">
        <p class="lc-eyebrow">{{ text.lao('chooseApplication') }} <span v-if="text.english('chooseApplication')">· {{ text.english('chooseApplication') }}</span></p>
        <MainContentSelector />
      </article>
    </section>

    <section class="app-panel mt-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="app-section-title">{{ text.lao('myStudy') }}</h2>
          <p class="app-muted">{{ copy.text('home.studyHelp') }}</p>
        </div>
        <router-link to="/study" class="lc-btn-link">→</router-link>
      </div>
    </section>

    <section class="app-panel mt-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="app-section-title">{{ copy.text('home.slideStudio') }}</h2><p class="app-muted">{{ copy.text('home.slideHelp') }}</p></div>
        <router-link to="/decks" class="lc-btn-link">→</router-link>
      </div>
    </section>

    <section class="app-panel mt-4">
      <h2 class="app-section-title">{{ copy.text('home.resources') }}</h2>
      <p class="app-muted mt-2 italic">
        {{ copy.text('home.resourcesHelp') }}
      </p>
      <hr class="app-divider" />
      <article class="text-slate-700 dark:text-slate-200">
        <ul class="space-y-2">
          <li>
            <a href="https://github.com/rcampbellbassac/KouangSiWaterfall" target="_blank" rel="noopener noreferrer" class="app-link">
              Kouang Si Waterfall Font
            </a>
            <span class="app-muted"> — {{ copy.text('home.fontDescription') }} </span>
            <span class="italic">{{ copy.text('action.preview') }}
              <a class="app-link" href="https://htmlpreview.github.io/?https://github.com/rober42539/KouangSiWaterfall/blob/master/example.html">here</a>.
            </span>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>
