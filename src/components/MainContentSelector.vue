<script setup lang="ts">
import { ref, onMounted } from "vue";

interface UrlItem {
  eng_name: string;
  native_name: string;
  url: string;
  lang: string;
  icon: string;
}

interface LangItem{
  name: string;
  native_name: string;
  emoji_flag: string;
}

const urls = ref<UrlItem[]>([]);
const langs = ref<LangItem[]>([]);

onMounted(async () => {
  const data = await import("../data/index.json");
  urls.value = data.urls || data.default.urls || [];
  langs.value = data.langs || data.default.langs || [];
});

function getLangDetails(langName: string): LangItem | undefined {
  return langs.value.find(lang => lang.name === langName);
}

</script>

<template>
  <ul>
    <li v-for="item in urls" :key="item.url" class="font-noto-sans-lao">
      {{ item.native_name }} ({{ item.eng_name }} in {{ item.lang }}) -
      <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-blue-700 dark:text-blue-300 hover:underline">
        JSON File
      </a>
      <span v-if="getLangDetails(item.lang)">
        — {{ getLangDetails(item.lang)?.emoji_flag }} ({{ getLangDetails(item.lang)?.native_name }})
      </span>
    </li>
  </ul>
</template>
