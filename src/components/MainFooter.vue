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
  <footer>
    <div class="bg-slate-800 shadow-md px-8 py-4">
      <div class="flex justify-between items-center">
        <div>

          <p class="flex items-center text-gray-50"><img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-8" /> <span class="ml-4">&copy; 2025 ລາວຄຣິສຕຽນ (LaoChristian.org)</span></p>
        </div>
        <div class="flex space-x-4">
          <a
            v-for="item in socialItems"
            :key="item.name"
            :href="item.to"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-200"
          >
            <font-awesome-icon :icon="item.icon" /> {{ item.name }}
        </a>
        </div>
      </div>
      <div class="mt-4 text-sm text-gray-300">
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
