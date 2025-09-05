import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export function sbServer(service = false) {
  return createClient(
    env.supabaseUrl,
    service ? (env.supabaseServiceKey as string) : env.supabaseAnonKey,
    {
      auth: {
        persistSession: false
      }
    }
  )
}