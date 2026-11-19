#!/usr/bin/env node
// Two-session RLS isolation test (constitution II, PLAN §6 test 1).
// Usage: node --env-file=.env scripts/rls-test.mjs   (needs SUPABASE_URL + SUPABASE_ANON_KEY,
// and "Anonymous sign-ins" enabled on the project). Cleans up after itself.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!url || !anon) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY')
  process.exit(2)
}

const mk = () => createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
let failures = 0
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
  if (!cond) failures++
}

const A = mk()
const B = mk()
const nobody = mk()

const a = await A.auth.signInAnonymously()
const b = await B.auth.signInAnonymously()
if (a.error || b.error) {
  console.error('Anonymous sign-in failed — is it enabled?', a.error ?? b.error)
  process.exit(2)
}
const aId = a.data.user.id
const bId = b.data.user.id

const id = crypto.randomUUID()
const path = `${aId}/${id}.jpg`
const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]) // tiny JPEG markers

// A writes
const up = await A.storage.from('media').upload(path, bytes, { contentType: 'image/jpeg' })
check('A can upload into own folder', !up.error)
const ins = await A.from('uploads').insert({ id, owner: aId, kind: 'photo', path, mime: 'image/jpeg', size_bytes: bytes.length })
check('A can insert own row', !ins.error)

// A cannot write into B's folder / as B / public
const foreign = await A.storage.from('media').upload(`${bId}/${crypto.randomUUID()}.jpg`, bytes, { contentType: 'image/jpeg' })
check("A cannot upload into B's folder", Boolean(foreign.error))
const spoof = await A.from('uploads').insert({ owner: bId, kind: 'photo', path: `${bId}/x.jpg`, mime: 'image/jpeg', size_bytes: 1 })
check('A cannot insert a row owned by B', Boolean(spoof.error))
const pub = await A.from('uploads').insert({ owner: aId, kind: 'photo', path: `${aId}/p.jpg`, mime: 'image/jpeg', size_bytes: 1, is_public: true })
check('A cannot self-publish (is_public)', Boolean(pub.error))
const upd = await A.from('uploads').update({ is_public: true }).eq('id', id).select()
check('A cannot update rows', Boolean(upd.error) || (upd.data ?? []).length === 0)

// Wrong type rejected by bucket
const pdf = await A.storage.from('media').upload(`${aId}/${crypto.randomUUID()}.pdf`, bytes, { contentType: 'application/pdf' })
check('bucket rejects non-media MIME', Boolean(pdf.error))

// B cannot see / download / delete A's stuff
const bSel = await B.from('uploads').select('*').eq('id', id)
check("B cannot select A's row", !bSel.error && bSel.data.length === 0)
const bDl = await B.storage.from('media').download(path)
check("B cannot download A's object", Boolean(bDl.error))
const bSign = await B.storage.from('media').createSignedUrl(path, 60)
check("B cannot sign A's object", Boolean(bSign.error))
const bList = await B.storage.from('media').list(aId)
check("B cannot list A's folder", (bList.data ?? []).length === 0)
await B.from('uploads').delete().eq('id', id)
await B.storage.from('media').remove([path])
const still = await A.from('uploads').select('id').eq('id', id)
check("B's delete did not remove A's row", still.data?.length === 1)
const stillObj = await A.storage.from('media').download(path)
check("B's delete did not remove A's object", !stillObj.error)

// No session → nothing
const nSel = await nobody.from('uploads').select('*')
check('no session cannot select uploads', Boolean(nSel.error) || nSel.data.length === 0)
const nDl = await nobody.storage.from('media').download(path)
check('no session cannot download', Boolean(nDl.error))

// Cleanup (A deletes own)
const rm = await A.storage.from('media').remove([path])
check('A can delete own object', !rm.error && (rm.data ?? []).length === 1)
const del = await A.from('uploads').delete().eq('id', id).select()
check('A can delete own row', !del.error && del.data.length === 1)

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll RLS checks passed')
process.exit(failures ? 1 : 0)
