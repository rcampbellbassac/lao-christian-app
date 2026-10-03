<script setup lang="ts">
import { useStaticText } from '@/composables/useStaticText'
import logo from '@/assets/img/sabbath-school/sabbath-school-pm-logo.png'
import appStore from '@/assets/img/sabbath-school/adventech-ss-app-store.png'
import playStore from '@/assets/img/sabbath-school/adventech-ss-play-store.png'
import web from '@/assets/img/sabbath-school/adventech-ss-web.png'

const copy = useStaticText()

// Official Sabbath School (Adventech / General Conference). External sites.
const badges = [
  { name: 'Google Play', alt: 'Get Sabbath School on Google Play', img: playStore, href: 'https://play.google.com/store/apps/details?id=com.cryart.sabbathschool' },
  { name: 'App Store', alt: 'Download Sabbath School on the App Store', img: appStore, href: 'https://itunes.apple.com/us/app/sabbath-school/id895272167?mt=8' },
  { name: 'Web', alt: 'Open Sabbath School on the web', img: web, href: 'https://sabbath-school.adventech.io/lo' },
]
</script>

<template>
  <section class="lc-sabbath-school app-panel" aria-labelledby="sabbath-school-title">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <img :src="logo" alt="Sabbath School" class="h-20 w-20 shrink-0 rounded-lg bg-white p-1" />
      <div>
        <h2 id="sabbath-school-title" class="app-section-title">{{ copy.text('home.sabbathSchoolTitle') }}</h2>
        <p class="mt-2 text-slate-700 dark:text-slate-200">{{ copy.text('home.sabbathSchoolBody') }}</p>
      </div>
    </div>
    <p class="mt-4">
      <a href="https://sabbath-school.adventech.io/lo" target="_blank" rel="noopener noreferrer" class="app-link font-semibold">
        {{ copy.text('home.sabbathSchoolOpen') }} ↗
      </a>
    </p>
    <ul class="mt-3 flex flex-wrap items-center gap-3">
      <li v-for="b in badges" :key="b.name">
        <a :href="b.href" target="_blank" rel="noopener noreferrer">
          <img :src="b.img" :alt="b.alt" class="h-12 w-auto" />
        </a>
      </li>
    </ul>
    <p class="app-muted mt-4 text-xs">
      {{ copy.text('home.sabbathSchoolAttribution') }}
      <a href="https://adventech.io/sabbath-school/" target="_blank" rel="noopener noreferrer" class="app-link">{{ copy.text('home.sabbathSchoolAbout') }}</a>
    </p>
  </section>
</template>
