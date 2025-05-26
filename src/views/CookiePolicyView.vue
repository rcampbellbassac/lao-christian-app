<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const showModal = ref(false)

// Set it so that it doesn't show the modal, but does show the button. Also, include logic in the main app, as opposed to each page - and only let the cookie page show until consent is given.
onMounted(() => {
if (!document.cookie.includes('cookieConsent=true')) {
// showModal.value = true
}
})

function agreeToCookies() {
const date = new Date()
date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
document.cookie = `cookieConsent=true; expires=${date.toUTCString()}; path=/`
showModal.value = false
}
</script>

<template>
  <main
    class="mx-auto max-w-3xl p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto"
  >
    <section>
      <div class="text-center mb-6">
        <img src="../assets/img/cookie-web-fast.webp" alt="Cookie Logo" class="mx-auto max-w-xs" />
      </div>
      <hr class="border-slate-300 dark:border-slate-600 mb-6" />
      <h1 class="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Cookie Policy</h1>
      <p class="text-lg mb-6">
        This is our cookie policy, explaining how we use cookies on our site.
      </p>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">What are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help the
          site remember your device and preferences, useful for various functions.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">How We Use Cookies</h2>
        <p>
          We use cookies to enhance your experience, personalize content, provide social media
          features, analyze traffic, and improve site functionality.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">Your Choices</h2>
        <p>
          You may choose to accept or decline cookies. Most browsers accept cookies by default, but
          settings can be adjusted to block them.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">More Information</h2>
        <p>
          For more detailed info, see our
          <RouterLink to="/privacy-policy" class="text-blue-600 hover:text-blue-800 underline"
            >Privacy Policy</RouterLink
          >.
        </p>
      </section>
    </section>

    <!-- Cookie Consent Modal -->
    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        role="dialog"
        aria-modal="true"
      >
        <div class="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cookie Consent</h3>
          <p class="mb-4">
            We use cookies to improve your experience on our site. By continuing, you agree to our use of cookies.
            Read the terms
            <RouterLink to="/cookie-policy" class="text-blue-600 hover:text-blue-800 underline">here</RouterLink>.
          </p>
          <div class="text-right">
            <button
              @click="agreeToCookies"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>
