<script setup lang="ts">
import MainContentSelector from '@/components/MainContentSelector.vue';
</script>
<template>
  <main class="mx-auto max-w-3xl p-6 mb-20 bg-white rounded-xl shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:outline-white/10 overflow-y-auto">
    <section>
      <h1 class="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
          <img src="../assets/img/logo 2-black.png" alt="LaoChristian.org Logo" class="h-16 inline dark:hidden" /> <img src="../assets/img/logo 2-white.png" alt="LaoChristian.org Logo" class="h-16 hidden dark:inline" /> <span class="ml-4">LaoChristian.org App Platform</span>
      </h1>
        <p class="italic text-gray-500 dark:text-gray-400 mb-4">
          We are migrating our SEA-SDA.org Apps to the new LaoChristian.org App platform!
        </p>
        <hr class="border-gray-300 dark:border-gray-600 mb-4" />
        <article class="text-gray-700 dark:text-gray-300 space-y-4">
          <p class="mt-2">Which application would you like to use?</p>
          <MainContentSelector />
        </article>
    </section>
    <section class="mt-16">
      <h1 class="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
          LaoChristian.org Other Digital Resources
      </h1>
        <p class="italic text-gray-500 dark:text-gray-400 mb-4">
          We also provide other digital resources to help the Lao people learn about Jesus Christ and the Bible.
        </p>
        <hr class="border-gray-300 dark:border-gray-600 mb-4" />
        <article class="text-gray-700 dark:text-gray-300 space-y-4">
          <ul>
            <li>
              <a href="https://github.com/rcampbellbassac/KouangSiWaterfall" target="_blank" rel="noopener noreferrer" class="text-blue-700 dark:text-blue-300 hover:underline">
                Kouang Si Waterfall Font
              </a> - A display font for children's books, posters, and other materials in the Lao language. (<span class="italic">Preview it <a class="text-blue-700 dark:text-blue-300 hover:underline" href="https://htmlpreview.github.io/?https://github.com/rober42539/KouangSiWaterfall/blob/master/example.html">here.</a></span>)

            </li>
          </ul>
        </article>
    </section>
  </main>
</template>
