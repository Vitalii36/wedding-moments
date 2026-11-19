<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { config } from './config'
import Gallery from './components/Gallery.vue'
import Hero from './components/Hero.vue'
import NameField from './components/NameField.vue'
import UploadList from './components/UploadList.vue'
import Viewer from './components/Viewer.vue'
import { rejectionMessage, validateFile } from './lib/media'
import { createQueue } from './lib/queue'
import { ensureSession, isConfigured } from './lib/supabase'
import {
  deleteUpload,
  listMine,
  signedThumbs,
  uploadOne,
  type UploadItem,
  type UploadRow,
} from './lib/uploads'

const NAME_KEY = 'wm.guestName'

type Phase = 'connecting' | 'ready' | 'offline' | 'unconfigured'
const phase = ref<Phase>(isConfigured ? 'connecting' : 'unconfigured')
const owner = ref<string | null>(null)
const guestName = ref(readName())
const items = reactive<UploadItem[]>([])
const rows = ref<UploadRow[]>([])
const thumbs = ref<Record<string, string>>({})
const galleryLoading = ref(true)
const viewing = ref<UploadRow | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const queue = createQueue(config.parallelUploads)

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}
watch(guestName, (v) => {
  try {
    localStorage.setItem(NAME_KEY, v.trim())
  } catch {
    /* private mode */
  }
})

onMounted(async () => {
  if (!isConfigured) return
  try {
    const session = await ensureSession()
    owner.value = session.user.id
    phase.value = 'ready'
    await refreshGallery()
  } catch (e) {
    console.error(e)
    phase.value = 'offline'
  }
})

async function refreshGallery() {
  if (!owner.value) return
  try {
    const list = await listMine(owner.value)
    rows.value = list
    thumbs.value = { ...thumbs.value, ...(await signedThumbs(list.filter((r) => r.thumb_path && !thumbs.value[r.thumb_path]))) }
  } catch (e) {
    console.error('gallery', e)
  } finally {
    galleryLoading.value = false
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | undefined
function scheduleRefresh() {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(refreshGallery, 400)
}

function pickFiles() {
  fileInput.value?.click()
}

function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = '' // allow selecting the same files again
  for (const file of files) {
    const v = validateFile(file, config.maxFileBytes)
    const item = reactive<UploadItem>({
      localId: crypto.randomUUID(),
      file,
      kind: v.ok ? v.kind : 'photo',
      mime: v.ok ? v.mime : file.type,
      ext: v.ok ? v.ext : 'bin',
      status: v.ok ? 'queued' : 'error',
      progress: 0,
      error: v.ok ? undefined : rejectionMessage(v.reason, config.maxFileBytes),
      rejected: !v.ok,
    }) as UploadItem
    items.unshift(item)
    if (v.ok) enqueue(item)
  }
}

function enqueue(item: UploadItem) {
  item.status = 'queued'
  item.error = undefined
  queue.push(async () => {
    if (!owner.value) throw new Error('no session')
    await uploadOne(item, owner.value, guestName.value)
    scheduleRefresh()
  })
}

function clearFinished() {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]
    if (it.status === 'done' || it.rejected) {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      items.splice(i, 1)
    }
  }
}

async function remove(row: UploadRow) {
  try {
    await deleteUpload(row)
    rows.value = rows.value.filter((r) => r.id !== row.id)
    viewing.value = null
  } catch (e) {
    console.error(e)
    window.alert('Не вдалося видалити. Спробуйте ще раз.')
    viewing.value = null
  }
}

window.addEventListener('beforeunload', (e) => {
  if (items.some((i) => i.status === 'queued' || i.status === 'thumb' || i.status === 'uploading' || i.status === 'saving')) {
    e.preventDefault()
  }
})
</script>

<template>
  <div class="frame" aria-hidden="true" />
  <main class="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-16">
    <Hero />

    <div v-if="phase === 'unconfigured'" class="mx-auto mt-4 max-w-xs rounded-xl border border-line bg-paper p-4 text-center">
      Сайт ще не підключено до сховища. Додайте <code>VITE_SUPABASE_URL</code> та <code>VITE_SUPABASE_ANON_KEY</code>.
    </div>
    <p v-else-if="phase === 'offline'" class="mx-auto mt-4 max-w-xs text-center text-lg text-danger">{{ config.copy.offline }}</p>

    <div class="mt-4 flex flex-col items-center gap-8">
      <button
        type="button"
        class="btn btn-solid w-full max-w-xs disabled:opacity-50"
        :disabled="phase !== 'ready'"
        @click="pickFiles"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        {{ phase === 'connecting' ? config.copy.connecting : config.copy.uploadButton }}
      </button>
      <input ref="fileInput" type="file" accept="image/*,video/*" multiple class="hidden" @change="onFiles" />

      <NameField v-model="guestName" />
    </div>

    <UploadList :items="items" @retry="enqueue" @clear="clearFinished" />

    <Gallery v-if="phase === 'ready'" :rows="rows" :thumbs="thumbs" :loading="galleryLoading" @open="viewing = $event" />

    <footer class="mt-auto pt-16 text-center">
      <p class="text-lg italic text-ink/70">{{ config.copy.thanks }}</p>
    </footer>
  </main>

  <Viewer v-if="viewing" :row="viewing" @close="viewing = null" @remove="remove" />
</template>
