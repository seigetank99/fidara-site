import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import { parse, serialize } from 'cookie'
import { getSupabaseAdmin } from './supabaseAdmin.js'

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || 'fidara_session'
}

export function setSessionCookieHeader(token) {
  return serialize(getSessionCookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export function clearSessionCookieHeader() {
  return serialize(getSessionCookieName(), '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

export function createServerAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Server auth is not configured.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getCurrentUser(req) {
  const cookieHeader = req.headers?.cookie
  if (!cookieHeader) return null

  const cookies = parse(cookieHeader)
  const token = cookies[getSessionCookieName()]
  if (!token) return null

  const { data, error } = await getSupabaseAdmin().auth.getUser(token)
  if (error || !data?.user) return null

  return data.user
}
