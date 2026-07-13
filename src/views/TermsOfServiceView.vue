<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const showModal = ref(false)

onMounted(() => {
if (!document.cookie.includes('cookieConsent=true')) {
showModal.value = true
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
  <main class="app-page">
    <div class="app-panel dark:bg-slate-950/95 dark:border-slate-500/45">
      <hr class="app-divider" />
      <h1 class="app-section-title mb-4">Terms of Service</h1>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
        <p>
          By accessing or using our website, applications, or services, you agree to be bound by these Terms of Service
          and our <RouterLink to="/privacy-policy" class="app-link underline">Privacy Policy</RouterLink>. If you do not agree with these terms, please do not use our services.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">2. Use of the Service</h2>
        <p>
          You agree to use the service only for lawful purposes and in a manner that does not infringe the rights of,
          restrict, or inhibit anyone else's use of the service. Unauthorized use or access to our systems is strictly
          prohibited.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">3. Intellectual Property</h2>
        <p>
          All content, trademarks, and materials on this site are owned by or licensed to us and are protected by
          intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without prior
          written permission.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">4. User-Generated Content</h2>
        <p>
          If you submit or post content to our platform, you grant us a worldwide, non-exclusive, royalty-free license
          to use, reproduce, and display that content in connection with our services.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">5. Disclaimers</h2>
        <p>
          The service is provided "as is" and without warranties of any kind. We do not guarantee that the service will
          be error-free, uninterrupted, or secure. Use of the service is at your own risk.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">6. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect, incidental, consequential,
          or punitive damages arising from the use or inability to use our service.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">7. Changes to These Terms</h2>
        <p>
          We reserve the right to update these Terms of Service at any time. When changes are made, the updated version
          will be posted on our website with the effective date.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">8. Governing Law</h2>
        <p>
          These terms are governed by and construed in accordance with the laws of the applicable jurisdiction. Any
          disputes arising from these terms will be resolved in the courts of that jurisdiction.
        </p>
      </section>

      <section class="mb-6">
        <h2 class="text-2xl font-semibold mb-2">9. Contact Information</h2>
        <p>
          For questions regarding these Terms of Service, please contact us at [contact information].
        </p>
      </section>
    </div>

    <!-- Cookie Consent Modal -->
    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
          <h3 class="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cookie Consent</h3>
          <p class="mb-4">
            We use cookies to improve your experience on our site. By continuing, you agree to our use of cookies.
            Read the terms
            <RouterLink to="/cookie-policy" class="app-link underline">here</RouterLink>.
          </p>
          <div class="text-right">
            <button
              @click="agreeToCookies"
              class="rounded bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-800"
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>
