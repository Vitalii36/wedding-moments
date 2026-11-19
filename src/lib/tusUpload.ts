import { Upload } from 'tus-js-client'
import { accessToken, supabaseAnonKey, supabaseUrl } from './supabase'

/** Supabase requires exactly 6 MB chunks for resumable uploads. */
const CHUNK_SIZE = 6 * 1024 * 1024

/** Direct storage hostname gives better performance for large files (research R1). */
export function resumableEndpoint(projectUrl: string): string {
  const u = new URL(projectUrl)
  const m = /^([a-z0-9]+)\.supabase\.co$/i.exec(u.hostname)
  if (m) return `https://${m[1]}.storage.supabase.co/storage/v1/upload/resumable`
  return `${u.origin}/storage/v1/upload/resumable`
}

export interface TusOptions {
  bucket: string
  objectName: string
  contentType: string
  onProgress: (fraction: number) => void
}

export interface TusResult {
  /** Object name actually written — may differ from the requested one when resuming an earlier attempt. */
  objectName: string
}

/**
 * Upload `file` resumably. If an unfinished upload of the same file exists (tus fingerprint in
 * localStorage), it is resumed into its original object name.
 */
export async function tusUpload(file: File, opts: TusOptions): Promise<TusResult> {
  const metadata: Record<string, string> = {
    bucketName: opts.bucket,
    objectName: opts.objectName,
    contentType: opts.contentType,
    cacheControl: '3600',
  }

  return new Promise<TusResult>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: resumableEndpoint(supabaseUrl),
      chunkSize: CHUNK_SIZE,
      retryDelays: [0, 3000, 5000, 10000, 20000, 30000, 60000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata,
      headers: { 'x-upsert': 'false', apikey: supabaseAnonKey },
      async onBeforeRequest(req) {
        req.setHeader('authorization', `Bearer ${await accessToken()}`)
      },
      onProgress(sent, total) {
        opts.onProgress(total > 0 ? sent / total : 0)
      },
      onError(err) {
        reject(err)
      },
      onSuccess() {
        resolve({ objectName: upload.options.metadata?.objectName ?? opts.objectName })
      },
    })

    upload
      .findPreviousUploads()
      .then((previous) => {
        const prev = previous.find(
          (p) => p.metadata?.bucketName === opts.bucket && p.metadata?.objectName?.split('/')[0] === opts.objectName.split('/')[0],
        )
        if (prev) {
          upload.options.metadata = { ...metadata, ...prev.metadata }
          upload.resumeFromPreviousUpload(prev)
        }
        upload.start()
      })
      .catch(reject)
  })
}
