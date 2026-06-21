import { getCurrentUser } from '../src/lib/serverAuth.js'
import {
  getStorageBucket,
  json,
  parseBody,
  recordAuditEvent,
  requireAdmin,
} from '../src/lib/serverPortal.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

async function requireAdminUser(req, res) {
  const user = await getCurrentUser(req)
  if (!user) {
    json(res, 401, { error: 'Unauthorized' })
    return null
  }

  try {
    await requireAdmin(user.id)
    return user
  } catch (error) {
    if (error.code === 'FORBIDDEN') {
      json(res, 403, { error: 'Forbidden' })
      return null
    }

    throw error
  }
}

async function handleSummary(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const supabaseAdmin = getSupabaseAdmin()
  const [
    { count: clientsCount, error: clientsError },
    { count: documentsCount, error: docsError },
    { count: openRequestsCount, error: requestsError },
    { data: invoiceRows, error: invoiceError },
    { data: recentActivity, error: activityError },
  ] = await Promise.all([
    supabaseAdmin.from('clients').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('documents').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('document_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabaseAdmin.from('billing_items').select('amount_cents, status'),
    supabaseAdmin.from('audit_events').select('id, event_type, description, client_id, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  if (clientsError) throw clientsError
  if (docsError) throw docsError
  if (requestsError) throw requestsError
  if (invoiceError) throw invoiceError
  if (activityError) throw activityError

  const outstandingBalanceCents = (invoiceRows || [])
    .filter((row) => row.status === 'open' || row.status === 'overdue')
    .reduce((sum, row) => sum + (row.amount_cents || 0), 0)

  return json(res, 200, {
    stats: {
      clientsCount: clientsCount || 0,
      documentsCount: documentsCount || 0,
      openRequestsCount: openRequestsCount || 0,
      outstandingBalanceCents,
    },
    recentActivity: recentActivity || [],
  })
}

async function handleDocuments(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const { data, error } = await getSupabaseAdmin()
    .from('documents')
    .select('id, client_id, original_file_name, file_type, file_size, category, status, created_at, clients(name, business_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return json(res, 200, { documents: data || [] })
}

async function handleDownloadUrl(req, res, user) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  let payload
  try {
    payload = parseBody(req.body)
  } catch {
    return json(res, 400, { error: 'Invalid JSON body.' })
  }

  const documentId = String(payload?.documentId || '').trim()
  if (!documentId) return json(res, 400, { error: 'documentId is required.' })

  const supabaseAdmin = getSupabaseAdmin()
  const bucketName = getStorageBucket()
  const { data: document, error } = await supabaseAdmin
    .from('documents')
    .select('id, client_id, storage_key')
    .eq('id', documentId)
    .single()

  if (error || !document) return json(res, 404, { error: 'Document not found.' })

  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(document.storage_key, 60 * 10)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw signedUrlError || new Error('Failed to create signed download URL.')
  }

  void recordAuditEvent({
    clientId: document.client_id,
    eventType: 'admin_document_download_requested',
    description: `Admin requested download for document ${document.id}`,
    actorUserId: user.id,
    metadata: {
      document_id: document.id,
    },
  })

  return json(res, 200, { downloadUrl: signedUrlData.signedUrl })
}

export default async function handler(req, res) {
  const action = String(req.query?.action || '').trim()

  try {
    const user = await requireAdminUser(req, res)
    if (!user) return

    switch (action) {
      case 'summary':
        return await handleSummary(req, res)
      case 'documents':
        return await handleDocuments(req, res)
      case 'download-url':
        return await handleDownloadUrl(req, res, user)
      default:
        return json(res, 404, { error: 'Unknown action.' })
    }
  } catch (error) {
    console.error('[admin]', error)
    return json(res, 500, { error: 'Request failed.' })
  }
}
