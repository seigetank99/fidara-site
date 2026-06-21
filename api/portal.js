import { randomUUID } from 'node:crypto'
import {
  clearSessionCookieHeader,
  createServerAuthClient,
  getCurrentUser,
  setSessionCookieHeader,
} from '../src/lib/serverAuth.js'
import {
  getLinkedClientId,
  getStorageBucket,
  json,
  parseBody,
  recordAuditEvent,
  sanitizeFileName,
  userHasClientAccess,
} from '../src/lib/serverPortal.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function isOutstandingStatus(status) {
  return status === 'open' || status === 'overdue'
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

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

  try {
    const supabase = createServerAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.session?.access_token) {
      return json(res, 401, { error: 'Invalid email or password.' })
    }

    res.setHeader('set-cookie', setSessionCookieHeader(data.session.access_token))
    return json(res, 200, { ok: true })
  } catch (error) {
    console.error('[portal:login]', error)
    return json(res, 500, { error: 'Server auth is not configured.' })
  }
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  res.setHeader('set-cookie', clearSessionCookieHeader())
  return json(res, 200, { ok: true })
}

async function requirePortalUser(req, res) {
  const user = await getCurrentUser(req)
  if (!user) {
    json(res, 401, { error: 'Unauthorized' })
    return null
  }

  return user
}

async function handleDocuments(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const { data, error } = await getSupabaseAdmin()
    .from('documents')
    .select('id, original_file_name, file_type, file_size, category, status, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return json(res, 200, { clientId, documents: data || [] })
}

async function handleUploadUrl(req, res, user) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

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

  const hasAccess = await userHasClientAccess(user.id, clientId)
  if (!hasAccess) {
    return json(res, 403, { error: 'You do not have access to this client account.' })
  }

  const bucketName = getStorageBucket()
  const safeFileName = sanitizeFileName(fileName) || 'document'
  const storageKey = `clients/${clientId}/${randomUUID()}-${safeFileName}`
  const supabaseAdmin = getSupabaseAdmin()

  const { data: upload, error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(storageKey)

  if (uploadError || !upload) throw uploadError || new Error('Failed to create signed upload URL.')

  const { data: document, error: insertError } = await supabaseAdmin
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

  if (insertError) throw insertError

  void recordAuditEvent({
    clientId,
    eventType: 'document_uploaded',
    description: `Uploaded ${fileName}`,
    actorUserId: user.id,
    metadata: {
      document_id: document.id,
      category,
      file_type: fileType,
      file_size: fileSize,
    },
  })

  return json(res, 200, {
    upload: {
      path: upload.path,
      token: upload.token,
      signedUrl: upload.signedUrl,
    },
    document,
  })
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

  const hasAccess = await userHasClientAccess(user.id, document.client_id)
  if (!hasAccess) return json(res, 403, { error: 'You do not have access to this document.' })

  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(document.storage_key, 60 * 10)

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw signedUrlError || new Error('Failed to create signed download URL.')
  }

  void recordAuditEvent({
    clientId: document.client_id,
    eventType: 'document_download_requested',
    description: `Requested download for document ${document.id}`,
    actorUserId: user.id,
    metadata: {
      document_id: document.id,
    },
  })

  return json(res, 200, { downloadUrl: signedUrlData.signedUrl })
}

async function handleSummary(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const supabaseAdmin = getSupabaseAdmin()
  const [
    { count: documentsCount, error: documentsCountError },
    { data: latestDocumentRows, error: latestDocumentError },
    { data: requestRows, error: requestError },
    { data: invoiceRows, error: invoiceError },
  ] = await Promise.all([
    supabaseAdmin.from('documents').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    supabaseAdmin.from('documents').select('created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('document_requests').select('status').eq('client_id', clientId),
    supabaseAdmin.from('billing_items').select('amount_cents, status').eq('client_id', clientId),
  ])

  if (documentsCountError) throw documentsCountError
  if (latestDocumentError) throw latestDocumentError
  if (requestError) throw requestError
  if (invoiceError) throw invoiceError

  const openRequestsCount = (requestRows || []).filter((item) => item.status === 'open').length
  const openInvoices = (invoiceRows || []).filter((item) => isOutstandingStatus(item.status))
  const openInvoicesCount = openInvoices.length
  const outstandingBalanceCents = openInvoices.reduce((sum, item) => sum + (item.amount_cents || 0), 0)
  const lastUploadDate = latestDocumentRows?.[0]?.created_at || null

  return json(res, 200, {
    clientId,
    stats: {
      documentsCount: documentsCount || 0,
      openRequestsCount,
      openInvoicesCount,
      outstandingBalanceCents,
      lastUploadDate,
    },
  })
}

async function handleBilling(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const { data, error } = await getSupabaseAdmin()
    .from('billing_items')
    .select('id, title, description, amount_cents, currency, status, due_date, stripe_hosted_invoice_url, invoice_pdf_url, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const sorted = [...(data || [])].sort((left, right) => {
    const leftRank = isOutstandingStatus(left.status) ? 0 : 1
    const rightRank = isOutstandingStatus(right.status) ? 0 : 1
    if (leftRank !== rightRank) return leftRank - rightRank
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })

  return json(res, 200, { clientId, billingItems: sorted })
}

async function handleRequests(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const { data, error } = await getSupabaseAdmin()
    .from('document_requests')
    .select('id, title, description, status, due_date, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return json(res, 200, { clientId, requests: data || [] })
}

async function handleMessages(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const { data, error } = await getSupabaseAdmin()
    .from('portal_messages')
    .select('id, title, body, created_by, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return json(res, 200, { clientId, messages: data || [] })
}

async function handleAudit(req, res, user) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const clientId = await getLinkedClientId(user.id)
  if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

  const { data, error } = await getSupabaseAdmin()
    .from('audit_events')
    .select('id, event_type, description, actor_user_id, metadata, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return json(res, 200, { clientId, auditEvents: data || [] })
}

export default async function handler(req, res) {
  const action = String(req.query?.action || '').trim()

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res)
      case 'logout':
        return await handleLogout(req, res)
      case 'documents': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleDocuments(req, res, user)
      }
      case 'upload-url': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleUploadUrl(req, res, user)
      }
      case 'download-url': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleDownloadUrl(req, res, user)
      }
      case 'summary': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleSummary(req, res, user)
      }
      case 'billing': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleBilling(req, res, user)
      }
      case 'requests': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleRequests(req, res, user)
      }
      case 'messages': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleMessages(req, res, user)
      }
      case 'audit': {
        const user = await requirePortalUser(req, res)
        if (!user) return
        return await handleAudit(req, res, user)
      }
      default:
        return json(res, 404, { error: 'Unknown action.' })
    }
  } catch (error) {
    console.error('[portal]', error)
    return json(res, 500, { error: 'Request failed.' })
  }
}
