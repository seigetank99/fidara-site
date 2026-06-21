import { serialize } from 'cookie'
import { getSessionCookieName } from './_auth.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export default async function handler(_req, res) {
  res.setHeader(
    'set-cookie',
    serialize(getSessionCookieName(), '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    }),
  )

  return json(res, 200, { ok: true })
}
