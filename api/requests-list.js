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
      .from('document_requests')
      .select('id, title, description, status, due_date, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return json(res, 200, { clientId, requests: data || [] })
  } catch (error) {
    console.error('[requests-list]', error)
    return json(res, 500, { error: 'Failed to load requested items.' })
  }
}
