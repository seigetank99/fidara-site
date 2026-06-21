import { getCurrentUser } from './_auth.js'
import { getLinkedClientId, json } from './_portal.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

function isOutstandingStatus(status) {
  return status === 'open' || status === 'overdue'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const user = await getCurrentUser(req)
  if (!user) return json(res, 401, { error: 'Unauthorized' })

  try {
    const clientId = await getLinkedClientId(user.id)
    if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

    const supabaseAdmin = getSupabaseAdmin()
    const [
      { count: documentsCount, error: documentsCountError },
      { data: latestDocumentRows, error: latestDocumentError },
      { data: requestRows, error: requestError },
      { data: invoiceRows, error: invoiceError },
    ] = await Promise.all([
      supabaseAdmin
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId),
      supabaseAdmin
        .from('documents')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabaseAdmin
        .from('document_requests')
        .select('status')
        .eq('client_id', clientId),
      supabaseAdmin
        .from('billing_items')
        .select('amount_cents, status')
        .eq('client_id', clientId),
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
  } catch (error) {
    console.error('[portal-summary]', error)
    return json(res, 500, { error: 'Failed to load portal summary.' })
  }
}
