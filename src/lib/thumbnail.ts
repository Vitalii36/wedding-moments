import { fitWithin, type MediaKind } from './media'

/**
 * Client-side preview generation (ADR-004). Always resolves; returns null when the device
 * cannot decode the media — the original upload must never depend on this.
 */
export async function makeThumbnail(file: File, kind: MediaKind, maxSide: number): Promise<Blob | null> {
  try {
    const work = kind === 'photo' ? imageThumb(file, maxSide) : videoThumb(file, maxSide)
    return await withTimeout(work, kind === 'photo' ? 15000 : 10000)
  } catch {
    return null
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))])
}

function drawToBlob(source: CanvasImageSource, w: number, h: number, maxSide: number): Promise<Blob | null> {
  const { width, height } = fitWithin(w, h, maxSide)
  if (!width || !height) return Promise.resolve(null)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8))
}

async function imageThumb(file: File, maxSide: number): Promise<Blob | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      try {
        return await drawToBlob(bmp, bmp.width, bmp.height, maxSide)
      } finally {
        bmp.close()
      }
    } catch {
      /* fall through to <img> (e.g. HEIC on Safari versions without bitmap support) */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return await drawToBlob(img, img.naturalWidth, img.naturalHeight, maxSide)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function videoThumb(file: File, maxSide: number): Promise<Blob | null> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.src = url
  try {
    await once(video, 'loadedmetadata')
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    video.currentTime = Math.min(1, duration / 2)
    await once(video, 'seeked')
    // iOS sometimes needs a decoded frame before drawImage works
    if (video.readyState < 2) await once(video, 'loadeddata')
    return await drawToBlob(video, video.videoWidth, video.videoHeight, maxSide)
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}

function once(el: HTMLElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      cleanup()
      resolve()
    }
    const fail = () => {
      cleanup()
      reject(new Error(`media error waiting for ${event}`))
    }
    const cleanup = () => {
      el.removeEventListener(event, ok)
      el.removeEventListener('error', fail)
    }
    el.addEventListener(event, ok, { once: true })
    el.addEventListener('error', fail, { once: true })
  })
}
