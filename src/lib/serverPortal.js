import process from 'node:process'
import { getSupabaseAdmin } from './supabaseAdmin.js'

const DEFAULT_STORAGE_BUCKET = 'fidara-client-documents'

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function parseBody(body) {
  if (!body) return {}
  if (typeof body === 'string') return JSON.parse(body)
  return body
}

export function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET
}

export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

export async function getLinkedClientId(userId) {
  const { data, error } = await getSupabaseAdmin()
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) throw error
  return data?.[0]?.client_id || null
}

export async function userHasClientAccess(userId, clientId) {
  const { data, error } = await getSupabaseAdmin()
    .from('client_users')
    .select('id')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .limit(1)

  if (error) throw error
  return Boolean(data?.length)
}

export async function getCurrentProfile(userId) {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function requireAdmin(userId) {
  const profile = await getCurrentProfile(userId)
  if (profile?.role !== 'admin') {
    const error = new Error('Forbidden')
    error.code = 'FORBIDDEN'
    throw error
  }

  return profile
}

export async function recordAuditEvent({
  clientId,
  eventType,
  description,
  actorUserId = null,
  metadata = {},
}) {
  if (!clientId || !eventType || !description) return

  const { error } = await getSupabaseAdmin()
    .from('audit_events')
    .insert({
      client_id: clientId,
      event_type: eventType,
      description,
      actor_user_id: actorUserId,
      metadata,
    })

  if (error) {
    console.error('[audit-events]', error)
  }
}
