#!/usr/bin/env node
// E2E: anonymous sign-in → TUS upload of a 20 MB "video" that is aborted mid-way and resumed →
// row insert. Run against local Supabase: node --env-file=.env.local-supabase scripts/e2e-tus.mjs
import { createClient } from '@supabase/supabase-js'
import { Upload } from 'tus-js-client'
import { randomBytes, createHash } from 'node:crypto'

const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY
const sb = createClient(url, anon, { auth: { persistSession: false } })
const { data: { session }, error } = await sb.auth.signInAnonymously()
if (error) throw error
const owner = session.user.id
const id = crypto.randomUUID()
const path = `${owner}/${id}.mp4`
const data = randomBytes(20 * 1024 * 1024)
const endpoint = `${url}/storage/v1/upload/resumable`

function start(resumeUrl, abortAt) {
  return new Promise((resolve, reject) => {
    const up = new Upload(data, {
      endpoint, uploadUrl: resumeUrl ?? undefined, chunkSize: 6 * 1024 * 1024, retryDelays: [0, 1000],
      uploadDataDuringCreation: true,
      headers: { authorization: `Bearer ${session.access_token}`, apikey: anon, 'x-upsert': 'false' },
      metadata: { bucketName: 'media', objectName: path, contentType: 'video/mp4', cacheControl: '3600' },
      onChunkComplete(_c, sent) {
        if (abortAt && sent >= abortAt) { up.abort(); resolve({ aborted: true, url: up.url, sent }) }
      },
      onError: reject,
      onSuccess: () => resolve({ aborted: false, url: up.url }),
    })
    up.start()
  })
}

const first = await start(null, 6 * 1024 * 1024)
console.log('aborted after', first.sent, 'bytes; upload url', first.url)
const off = await fetch(first.url, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0', authorization: `Bearer ${session.access_token}`, apikey: anon } })
const offset = Number(off.headers.get('upload-offset'))
console.log('server offset before resume:', offset)
if (!(offset > 0)) throw new Error('server did not keep partial upload')
const second = await start(first.url)
console.log('resumed and finished:', !second.aborted)

const ins = await sb.from('uploads').insert({ id, owner, guest_name: 'E2E Тест', kind: 'video', path, mime: 'video/mp4', size_bytes: data.length })
if (ins.error) throw ins.error
const dl = await sb.storage.from('media').download(path)
if (dl.error) throw dl.error
const got = Buffer.from(await dl.data.arrayBuffer())
const same = createHash('sha256').update(got).digest('hex') === createHash('sha256').update(data).digest('hex')
console.log('downloaded', got.length, 'bytes; byte-identical:', same)
process.exit(same ? 0 : 1)
