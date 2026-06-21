import { getCurrentUser } from './_auth.js'
import { getSupabaseAdmin } from '../src/lib/supabaseAdmin.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function getLinkedClientId(userId) {
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('client_users')
    .select('client_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) throw error
  return data?.[0]?.client_id || null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const user = await getCurrentUser(req)
  if (!user) return json(res, 401, { error: 'Unauthorized' })

  try {
    const clientId = await getLinkedClientId(user.id)
    if (!clientId) return json(res, 403, { error: 'No linked client account found.' })

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, original_file_name, file_type, file_size, category, status, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return json(res, 200, {
      clientId,
      documents: data || [],
    })
  } catch (error) {
    console.error('[documents-list]', error)
    return json(res, 500, { error: 'Failed to load documents.' })
  }
}
