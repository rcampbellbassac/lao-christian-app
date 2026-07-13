<script setup lang="ts">
import MainContentSelector from '@/components/MainContentSelector.vue';
</script>
<template>
  <main class="app-page">
    <section class="app-panel">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="app-section-title flex items-center gap-3">
          <img src="../assets/img/logo 2-black.png" alt="LaoChristian.org Logo" class="h-12 inline dark:hidden sm:h-14" />
          <img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-12 hidden dark:inline sm:h-14" />
          <span>LaoChristian.org App Platform</span>
        </h1>
        <span class="app-chip">PWA-ready</span>
      </div>
      <p class="app-muted mt-2 italic">
        We are migrating our SEA-SDA.org Apps to the new LaoChristian.org App platform.
      </p>
      <hr class="app-divider" />
      <article class="space-y-4 text-slate-700 dark:text-slate-200">
        <p class="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Choose an application</p>
        <MainContentSelector />
      </article>
    </section>

    <section class="app-panel mt-4">
      <h2 class="app-section-title">LaoChristian.org Other Digital Resources</h2>
      <p class="app-muted mt-2 italic">
        We also provide additional digital resources to help Lao communities study the Bible.
      </p>
      <hr class="app-divider" />
      <article class="text-slate-700 dark:text-slate-200">
        <ul class="space-y-2">
          <li>
            <a href="https://github.com/rcampbellbassac/KouangSiWaterfall" target="_blank" rel="noopener noreferrer" class="app-link">
              Kouang Si Waterfall Font
            </a>
            <span class="app-muted"> - A display font for Lao-language children's books, posters, and print resources. </span>
            <span class="italic">Preview it
              <a class="app-link" href="https://htmlpreview.github.io/?https://github.com/rober42539/KouangSiWaterfall/blob/master/example.html">here</a>.
            </span>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>
