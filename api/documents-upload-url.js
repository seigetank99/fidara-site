import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from './_auth.js'
import { getR2Client } from '../src/lib/r2.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

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

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

async function userHasClientAccess(userId, clientId) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_users')
    .select('id')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .limit(1)

  if (error) throw error
  return Boolean(data?.length)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const user = await getCurrentUser(req)
  if (!user) return json(res, 401, { error: 'Unauthorized' })

  const bucketName = process.env.R2_BUCKET_NAME
  if (!bucketName) return json(res, 500, { error: 'Document storage is not configured.' })

  let payload
  try {
    payload = parseBody(req.body)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body.' })
  }

  const clientId = String(payload?.clientId || '').trim()
  const fileName = String(payload?.fileName || '').trim()
  const fileType = String(payload?.fileType || '').trim()
  const fileSize = Number(payload?.fileSize)
  const category = String(payload?.category || 'general').trim() || 'general'

  if (!clientId || !fileName || !fileType || !Number.isFinite(fileSize)) {
    return json(res, 400, { error: 'clientId, fileName, fileType, and fileSize are required.' })
  }

  if (fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
    return json(res, 400, { error: 'File size must be 25MB or less.' })
  }

  if (!ALLOWED_FILE_TYPES.has(fileType)) {
    return json(res, 400, { error: 'Unsupported file type.' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const hasAccess = await userHasClientAccess(user.id, clientId)
    if (!hasAccess) return json(res, 403, { error: 'You do not have access to this client account.' })

    const safeFileName = sanitizeFileName(fileName) || 'document'
    const storageKey = `clients/${clientId}/${randomUUID()}-${safeFileName}`

    const uploadUrl = await getSignedUrl(
      getR2Client(),
      new PutObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
        ContentType: fileType,
      }),
      { expiresIn: 60 * 10 },
    )

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        client_id: clientId,
        uploaded_by: user.id,
        original_file_name: fileName,
        storage_key: storageKey,
        file_type: fileType,
        file_size: fileSize,
        category,
        status: 'received',
      })
      .select('id, client_id, uploaded_by, original_file_name, file_type, file_size, category, status, created_at')
      .single()

    if (error) throw error

    return json(res, 200, {
      uploadUrl,
      document: data,
    })
  } catch (error) {
    console.error('[documents-upload-url]', error)
    return json(res, 500, { error: 'Failed to create upload URL.' })
  }
}
