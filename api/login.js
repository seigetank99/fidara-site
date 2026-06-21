import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'
import { getSessionCookieName } from './_auth.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function parseBody(body) {
  if (!body) return {}
  if (typeof body === 'string') return JSON.parse(body)
  return body
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return json(res, 500, { error: 'Server auth is not configured.' })
  }

  let payload
  try {
    payload = parseBody(req.body)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body.' })
  }

  const email = String(payload?.email || '').trim()
  const password = String(payload?.password || '')

  if (!email || !password) {
    return json(res, 400, { error: 'Email and password are required.' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data?.session?.access_token) {
    return json(res, 401, { error: 'Invalid email or password.' })
  }

  res.setHeader(
    'set-cookie',
    serialize(getSessionCookieName(), data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    }),
  )

  return json(res, 200, { ok: true })
}
