<script setup lang="ts">
import { computed } from 'vue'
import { config } from '../config'
import { formatBytes } from '../lib/media'
import type { UploadItem } from '../lib/uploads'
import MediaIcon from './MediaIcon.vue'

const props = defineProps<{ items: UploadItem[] }>()
const emit = defineEmits<{ retry: [item: UploadItem]; clear: [] }>()

const doneCount = computed(() => props.items.filter((i) => i.status === 'done').length)
const allSettled = computed(() => props.items.every((i) => i.status === 'done' || i.status === 'error'))

const statusLabel: Record<UploadItem['status'], string> = {
  queued: 'У черзі',
  thumb: 'Готуємо…',
  uploading: 'Завантажуємо',
  saving: 'Зберігаємо…',
  done: 'Готово',
  error: 'Помилка',
}
</script>

<template>
  <section v-if="items.length" class="mx-auto mt-8 w-full max-w-md" aria-live="polite">
    <div class="flex items-baseline justify-between px-1">
      <h2 class="caps text-ink/80">{{ config.copy.uploadsTitle }} · {{ doneCount }}/{{ items.length }}</h2>
      <button v-if="allSettled" type="button" class="caps text-ink/60 underline-offset-4 hover:underline" @click="emit('clear')">
        Сховати
      </button>
    </div>
    <ul class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.localId"
        class="flex items-center gap-3 rounded-xl border border-line/70 bg-paper px-3 py-2"
      >
        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream text-olive">
          <img v-if="item.previewUrl" :src="item.previewUrl" alt="" class="h-full w-full object-cover" />
          <span v-else-if="item.rejected" class="flex h-full w-full items-center justify-center text-xl text-danger">!</span>
          <MediaIcon v-else :kind="item.kind" class="m-3 h-6 w-6" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-base">{{ item.file.name }}</p>
          <div class="mt-1 flex items-center gap-2 text-sm text-ink/70">
            <span :class="item.status === 'error' ? 'text-danger' : item.status === 'done' ? 'text-olive' : ''">
              {{ item.status === 'error' ? item.error || statusLabel.error : statusLabel[item.status] }}
            </span>
            <span v-if="item.status === 'uploading'">{{ Math.round(item.progress * 100) }}%</span>
            <span class="ml-auto shrink-0">{{ formatBytes(item.file.size) }}</span>
          </div>
          <div
            v-if="item.status !== 'done' && item.status !== 'error'"
            class="mt-1.5 h-1 overflow-hidden rounded-full bg-line/40"
          >
            <div class="h-full bg-olive transition-[width] duration-300" :style="{ width: `${Math.max(3, item.progress * 100)}%` }" />
          </div>
        </div>
        <button
          v-if="item.status === 'error' && !item.rejected"
          type="button"
          class="btn btn-ghost shrink-0 !px-3 !py-1.5 !text-sm"
          @click="emit('retry', item)"
        >
          {{ config.copy.retry }}
        </button>
        <span v-else-if="item.status === 'done'" class="shrink-0 text-olive" aria-label="Готово">✓</span>
      </li>
    </ul>
  </section>
</template>
