<script setup lang="ts">
import MainContentSelector from '@/components/MainContentSelector.vue';
import { useUiText } from '@/composables/useUiText'
const text = useUiText()
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
        ພຣະຄຳພີ, ເພງນະມັດສະການ ແລະ ແຫຼ່ງຂໍ້ມູນຄຣິສຕຽນສຳລັບຊຸມຊົນລາວ.
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
          <p class="app-muted" v-if="text.english('myStudy')">{{ text.english('myStudy') }} · bookmarks, highlights, notes, and recent reading</p>
        </div>
        <router-link to="/study" class="lc-btn-link">→</router-link>
      </div>
    </section>

    <section class="app-panel mt-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="app-section-title">ສະຕູດິໂອສະໄລ້</h2><p class="app-muted">Slide Studio · create and save church presentations locally</p></div>
        <router-link to="/decks" class="lc-btn-link">→</router-link>
      </div>
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
