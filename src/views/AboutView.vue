<script setup lang="ts">
import { useStaticText } from '@/composables/useStaticText'
const copy = useStaticText()
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <h1 class="app-section-title flex items-center gap-3">
        <img src="../assets/img/logo 2-black.png" alt="LaoChristian.org Logo" class="h-12 inline dark:hidden sm:h-14" />
        <img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-12 hidden dark:inline sm:h-14" />
        <span>{{ copy.text('about.title') }}</span>
      </h1>
      <p class="app-muted mt-2 italic mb-4">
        {{ copy.text('about.intro') }}
      </p>
      <hr class="app-divider" />
      <article class="space-y-4 text-slate-700 dark:text-slate-200">
        <p>
          {{ copy.text('about.mission') }}
        </p>

        <h2 class="text-2xl font-semibold text-sky-900 dark:text-sky-100">{{ copy.text('about.generationTitle') }}</h2>
        <p>
          {{ copy.text('about.generation') }}
          <a href="https://laobible.net" target="_blank" rel="noopener noreferrer" class="app-link">LaoBible.net</a>
        </p>
        <p>
          {{ copy.text('about.script') }}
        </p>

        <h3 class="text-xl font-semibold text-sky-900 dark:text-sky-100">{{ copy.text('about.bibleTitle') }}</h3>
        <p>
          {{ copy.text('about.bible') }}
        </p>

        <h3 class="text-xl font-semibold text-sky-900 dark:text-sky-100">{{ copy.text('about.songsTitle') }}</h3>
        <p>
          {{ copy.text('about.songs') }}
        </p>
        <p>
          {{ copy.text('about.songbook') }}
        </p>

        <h2 class="text-2xl font-semibold text-sky-900 dark:text-sky-100">{{ copy.text('about.commitmentTitle') }}</h2>
        <p>
          {{ copy.text('about.commitment') }}
        </p>
        <p>
          {{ copy.text('about.improve') }}
        </p>

        <blockquote class="rounded-r-xl border-l-4 border-slate-300 pl-4 italic text-slate-600 dark:border-slate-500 dark:text-slate-300">
          “{{ copy.text('about.quote') }}”<br />
          — <span class="text-sky-900 dark:text-sky-100">Ellen G. White, <em>Our Father Cares</em></span>
        </blockquote>

        <p class="text-xl font-bold text-sky-900 dark:text-sky-100">LaoChristian.org — {{ copy.text('about.tagline') }}</p>
      </article>
    </section>
  </main>
</template>
