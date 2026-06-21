import { parse } from 'cookie'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || 'fidara_session'
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
