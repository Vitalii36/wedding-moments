<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { config } from '../config'
import { signedOriginal, type UploadRow } from '../lib/uploads'

const props = defineProps<{ row: UploadRow }>()
const emit = defineEmits<{ close: []; remove: [row: UploadRow] }>()

const src = ref<string | null>(null)
const failed = ref(false)
const busy = ref(false)

async function load() {
  src.value = null
  failed.value = false
  try {
    src.value = await signedOriginal(props.row)
  } catch {
    failed.value = true
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function confirmRemove() {
  if (busy.value) return
  if (window.confirm(config.copy.removeConfirm)) {
    busy.value = true
    emit('remove', props.row)
  }
}

watch(() => props.row.id, load)
onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-ink/95 text-paper" role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" class="caps py-2 text-paper/80" @click="confirmRemove">{{ config.copy.remove }}</button>
      <button type="button" class="caps py-2 text-paper" @click="emit('close')">{{ config.copy.close }} ✕</button>
    </div>
    <div class="flex min-h-0 flex-1 items-center justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" @click.self="emit('close')">
      <p v-if="failed" class="text-center text-lg">Не вдалося відкрити файл.</p>
      <p v-else-if="!src" class="caps text-paper/70">Завантаження…</p>
      <video
        v-else-if="row.kind === 'video'"
        :src="src"
        controls
        playsinline
        autoplay
        class="max-h-full max-w-full"
      />
      <img v-else :src="src" alt="" class="max-h-full max-w-full object-contain" />
    </div>
  </div>
</template>
