/** Pure helpers for media classification, validation and storage paths (unit-tested). */

export type MediaKind = 'photo' | 'video'

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  dng: 'image/x-adobe-dng',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  mkv: 'video/x-matroska',
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/3gpp': '3gp',
  'video/x-m4v': 'm4v',
  'video/x-matroska': 'mkv',
}

export function extensionOf(name: string): string | null {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name.trim())
  return m ? m[1].toLowerCase() : null
}

/** Browser-reported type, falling back to the file extension (some Androids report "" for HEIC). */
export function resolveMime(name: string, reported: string): string {
  if (reported && reported !== 'application/octet-stream') return reported.toLowerCase()
  const ext = extensionOf(name)
  return (ext && EXT_TO_MIME[ext]) || 'application/octet-stream'
}

export function kindOf(mime: string): MediaKind | null {
  if (mime.startsWith('image/')) return 'photo'
  if (mime.startsWith('video/')) return 'video'
  return null
}

export function storageExtension(name: string, mime: string): string {
  const ext = extensionOf(name)
  if (ext) return ext
  return MIME_TO_EXT[mime] ?? 'bin'
}

export type Validation =
  | { ok: true; kind: MediaKind; mime: string; ext: string }
  | { ok: false; reason: 'type' | 'size' | 'empty' }

export function validateFile(
  file: { name: string; type: string; size: number },
  maxBytes: number,
): Validation {
  if (file.size <= 0) return { ok: false, reason: 'empty' }
  const mime = resolveMime(file.name, file.type)
  const kind = kindOf(mime)
  if (!kind) return { ok: false, reason: 'type' }
  if (file.size > maxBytes) return { ok: false, reason: 'size' }
  return { ok: true, kind, mime, ext: storageExtension(file.name, mime) }
}

export function objectPaths(owner: string, id: string, ext: string) {
  return { path: `${owner}/${id}.${ext}`, thumbPath: `${owner}/${id}_t.jpg` }
}

/** Scale (w,h) so that the longest side is at most maxSide; never upscales. */
export function fitWithin(w: number, h: number, maxSide: number): { width: number; height: number } {
  if (w <= 0 || h <= 0) return { width: 0, height: 0 }
  const scale = Math.min(1, maxSide / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} Б`
  const units = ['КБ', 'МБ', 'ГБ']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`
}

export function rejectionMessage(reason: 'type' | 'size' | 'empty', maxBytes: number): string {
  switch (reason) {
    case 'type':
      return 'Можна додавати лише фото та відео'
    case 'size':
      return `Файл завеликий (максимум ${formatBytes(maxBytes)})`
    case 'empty':
      return 'Порожній файл'
  }
}
