export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'AutoPost VN',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
  debugApiEnabled: process.env.DEBUG_API_ENABLED === 'true'
};