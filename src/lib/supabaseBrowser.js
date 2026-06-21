import { createClient } from '@supabase/supabase-js'

let supabaseBrowser

export function getSupabaseBrowser() {
  if (supabaseBrowser) return supabaseBrowser

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY.')
  }

  supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseBrowser
}
