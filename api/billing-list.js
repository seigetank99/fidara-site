import { getCurrentUser } from './_auth.js'
import { getLinkedClientId, json } from './_portal.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const user = await getCurrentUser(req)
  if (!user) return json(res, 401, { error: 'Unauthorized' })

  try {
    const clientId = await getLinkedClientId(user.id)
    if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

    const { data, error } = await getSupabaseAdmin()
      .from('billing_items')
      .select(
        'id, title, description, amount_cents, currency, status, due_date, stripe_hosted_invoice_url, invoice_pdf_url, created_at',
      )
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const sorted = [...(data || [])].sort((left, right) => {
      const leftRank = left.status === 'open' || left.status === 'overdue' ? 0 : 1
      const rightRank = right.status === 'open' || right.status === 'overdue' ? 0 : 1
      if (leftRank !== rightRank) return leftRank - rightRank
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })

    return json(res, 200, { clientId, billingItems: sorted })
  } catch (error) {
    console.error('[billing-list]', error)
    return json(res, 500, { error: 'Failed to load billing records.' })
  }
}
