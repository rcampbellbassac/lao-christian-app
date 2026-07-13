<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHouse, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faInstagram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faHouse, faCircleInfo, faFacebook, faInstagram, faYoutube, faTiktok)

const socialItems = [
  { name: 'Facebook', to: 'https://www.facebook.com/sklgospel', icon: 'fa-brands fa-facebook'},
  { name: 'Instagram', to: 'https://www.instagram.com/sklgospel/', icon: 'fa-brands fa-instagram'},
  { name: 'YouTube', to: 'https://www.youtube.com/@SiengKhaenLaoGospel', icon: 'fa-brands fa-youtube'},
  { name: 'TikTok', to: 'https://www.tiktok.com/@siengkhaenlaogospel', icon: 'fa-brands fa-tiktok'},
]

const policies = [
  { name: 'Cookie Policy', to: '/cookie-policy' },
  { name: 'Privacy Policy', to: '/privacy-policy' },
  { name: 'Terms of Service', to: '/terms-of-service' },
]
</script>

<template>
  <footer class="px-2 pb-2 pt-1 sm:px-4">
    <div class="mx-auto w-full max-w-6xl rounded-2xl border border-slate-600/30 bg-slate-900/92 px-4 py-4 text-slate-100 shadow-2xl backdrop-blur">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex items-center text-sm text-slate-100">
          <img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-8" />
          <span class="ml-3">&copy; 2025 ລາວຄຣິສຕຽນ (LaoChristian.org)</span>
        </p>
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <a
            v-for="item in socialItems"
            :key="item.name"
            :href="item.to"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-full border border-slate-500/40 px-3 py-1 text-slate-100 transition hover:bg-slate-800"
          >
            <font-awesome-icon :icon="item.icon" /> {{ item.name }}
          </a>
        </div>
      </div>
      <div class="mt-4 text-xs text-slate-300 sm:text-sm">
        <span v-for="(policy, index) in policies" :key="policy.name">
          <RouterLink :to="policy.to" class="hover:underline">
            {{ policy.name }}
          </RouterLink>
          <span v-if="index < policies.length - 1"> | </span>
        </span>
      </div>
    </div>
  </footer>
</template>
