import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'wm.auth' },
})

export const supabaseUrl = url
export const supabaseAnonKey = anonKey

/** Returns a valid session, signing in anonymously on first visit (ADR-002). */
export async function ensureSession(): Promise<Session> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session) return data.session
  const res = await supabase.auth.signInAnonymously()
  if (res.error || !res.data.session) throw res.error ?? new Error('Anonymous sign-in failed')
  return res.data.session
}

/** Fresh access token (getSession refreshes an expired token). */
export async function accessToken(): Promise<string> {
  return (await ensureSession()).access_token
}
