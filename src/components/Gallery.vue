<script setup lang="ts">
import { config } from '../config'
import type { UploadRow } from '../lib/uploads'
import MediaIcon from './MediaIcon.vue'

defineProps<{ rows: UploadRow[]; thumbs: Record<string, string>; loading: boolean }>()
const emit = defineEmits<{ open: [row: UploadRow] }>()
</script>

<template>
  <section class="mx-auto mt-12 w-full max-w-md">
    <div class="flex items-center gap-3">
      <span class="h-px flex-1 bg-line" />
      <h2 class="caps text-ink">{{ config.copy.galleryTitle }}<span v-if="rows.length"> · {{ rows.length }}</span></h2>
      <span class="h-px flex-1 bg-line" />
    </div>

    <p v-if="!loading && rows.length === 0" class="mt-6 text-center text-lg text-ink/60">{{ config.copy.galleryEmpty }}</p>

    <ul class="mt-5 grid grid-cols-3 gap-1.5">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="relative block aspect-square w-full overflow-hidden rounded-md bg-paper text-olive"
          :aria-label="row.kind === 'video' ? 'Відкрити відео' : 'Відкрити фото'"
          @click="emit('open', row)"
        >
          <img
            v-if="row.thumb_path && thumbs[row.thumb_path]"
            :src="thumbs[row.thumb_path]"
            alt=""
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <MediaIcon v-else :kind="row.kind" class="absolute inset-0 m-auto h-8 w-8 opacity-70" />
          <span
            v-if="row.kind === 'video'"
            class="absolute bottom-1 right-1 rounded-full bg-ink/60 px-1.5 text-xs leading-5 text-paper"
            >▶</span
          >
        </button>
      </li>
    </ul>
  </section>
</template>
