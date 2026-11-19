import { config } from '../config'
import { objectPaths, type MediaKind } from './media'
import { supabase } from './supabase'
import { makeThumbnail } from './thumbnail'
import { tusUpload } from './tusUpload'

export interface UploadRow {
  id: string
  owner: string
  guest_name: string | null
  kind: MediaKind
  path: string
  thumb_path: string | null
  mime: string
  size_bytes: number
  is_public: boolean
  created_at: string
}

export type ItemStatus = 'queued' | 'thumb' | 'uploading' | 'saving' | 'done' | 'error'

/** Client-side state of one selected file (data-model.md). */
export interface UploadItem {
  localId: string
  file: File
  kind: MediaKind
  mime: string
  ext: string
  status: ItemStatus
  progress: number
  error?: string
  /** Rejected before upload (type/size) — cannot be retried. */
  rejected?: boolean
  previewUrl?: string
  // pipeline checkpoints so a retry continues where it failed
  id?: string
  originalPath?: string
  thumb?: Blob | null
  thumbPath?: string | null
}

const BUCKET = config.bucket

/** Runs (or continues) the pipeline: thumbnail → original (TUS) → thumbnail upload → DB row. */
export async function uploadOne(item: UploadItem, owner: string, guestName: string | null): Promise<void> {
  item.error = undefined
  try {
    if (item.thumb === undefined) {
      item.status = 'thumb'
      item.thumb = await makeThumbnail(item.file, item.kind, config.thumbMaxSide)
      if (item.thumb && !item.previewUrl) item.previewUrl = URL.createObjectURL(item.thumb)
    }

    if (!item.originalPath) {
      item.status = 'uploading'
      const id = item.id ?? crypto.randomUUID()
      const { path } = objectPaths(owner, id, item.ext)
      const res = await tusUpload(item.file, {
        bucket: BUCKET,
        objectName: path,
        contentType: item.mime,
        onProgress: (f) => (item.progress = f),
      })
      item.originalPath = res.objectName
      item.id = idFromPath(res.objectName) ?? id
      item.progress = 1
    }

    item.status = 'saving'
    if (item.thumbPath === undefined) {
      item.thumbPath = item.thumb ? await uploadThumb(item.thumb, objectPaths(owner, item.id!, item.ext).thumbPath) : null
    }

    const { error } = await supabase.from('uploads').insert({
      id: item.id,
      owner,
      guest_name: guestName?.trim() || null,
      kind: item.kind,
      path: item.originalPath,
      thumb_path: item.thumbPath,
      mime: item.mime,
      size_bytes: item.file.size,
    })
    // 23505 = unique violation → the row was already saved by an earlier attempt
    if (error && error.code !== '23505') throw error
    item.status = 'done'
  } catch (e) {
    item.status = 'error'
    item.error = humanError(e)
    throw e
  }
}

function idFromPath(path: string): string | null {
  const m = /\/([0-9a-f-]{36})\.[^/]+$/i.exec(path)
  return m ? m[1] : null
}

/** Thumbnail failures are non-fatal (constitution III): return null instead of throwing. */
async function uploadThumb(blob: Blob, path: string): Promise<string | null> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (!error) return path
  if (/exists|duplicate/i.test(error.message)) return path
  console.warn('thumbnail upload failed', error)
  return null
}

export async function listMine(owner: string): Promise<UploadRow[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('owner', owner)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UploadRow[]
}

/** Map of thumb_path → signed URL. Missing entries mean "show placeholder". */
export async function signedThumbs(rows: UploadRow[]): Promise<Record<string, string>> {
  const paths = rows.map((r) => r.thumb_path).filter((p): p is string => Boolean(p))
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, config.signedUrlTtlSec)
  if (error) throw error
  const out: Record<string, string> = {}
  for (const d of data ?? []) if (d.path && d.signedUrl && !d.error) out[d.path] = d.signedUrl
  return out
}

export async function signedOriginal(row: UploadRow): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.path, config.signedUrlTtlSec)
  if (error || !data) throw error ?? new Error('No signed URL')
  return data.signedUrl
}

export async function deleteUpload(row: UploadRow): Promise<void> {
  const paths = [row.path, row.thumb_path].filter((p): p is string => Boolean(p))
  const { error: sErr } = await supabase.storage.from(BUCKET).remove(paths)
  if (sErr) throw sErr
  const { error } = await supabase.from('uploads').delete().eq('id', row.id)
  if (error) throw error
}

export function humanError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/413|too large|exceeded the maximum/i.test(msg)) return 'Файл завеликий для сервера'
  if (/415|mime|invalid_mime/i.test(msg)) return 'Цей тип файлу не підтримується'
  if (/network|failed to fetch|offline|timeout/i.test(msg) || !navigator.onLine) return 'Немає зʼєднання — спробуйте ще раз'
  return 'Не вдалося завантажити — спробуйте ще раз'
}
