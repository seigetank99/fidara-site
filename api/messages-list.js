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
      .from('portal_messages')
      .select('id, title, body, created_by, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return json(res, 200, { clientId, messages: data || [] })
  } catch (error) {
    console.error('[messages-list]', error)
    return json(res, 500, { error: 'Failed to load portal messages.' })
  }
}
