import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from './_auth.js'
import { getR2Client } from '../src/lib/r2.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

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

  const documentId = String(payload?.documentId || '').trim()
  if (!documentId) return json(res, 400, { error: 'documentId is required.' })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select('id, client_id, storage_key, original_file_name, file_type')
      .eq('id', documentId)
      .single()

    if (error || !document) return json(res, 404, { error: 'Document not found.' })

    const hasAccess = await userHasClientAccess(user.id, document.client_id)
    if (!hasAccess) return json(res, 403, { error: 'You do not have access to this document.' })

    const downloadUrl = await getSignedUrl(
      getR2Client(),
      new GetObjectCommand({
        Bucket: bucketName,
        Key: document.storage_key,
        ResponseContentType: document.file_type || undefined,
        ResponseContentDisposition: `inline; filename="${document.original_file_name.replace(/"/g, '')}"`,
      }),
      { expiresIn: 60 * 10 },
    )

    return json(res, 200, { downloadUrl })
  } catch (error) {
    console.error('[documents-download-url]', error)
    return json(res, 500, { error: 'Failed to create download URL.' })
  }
}
