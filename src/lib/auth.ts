import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check user in Supabase auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError || !authData.user) {
            return null
          }

          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (profileError) {
            // Create profile if doesn't exist
            const { data: newProfile } = await supabase
              .from('user_profiles')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                full_name: authData.user.user_metadata?.full_name || '',
                avatar_url: authData.user.user_metadata?.avatar_url || ''
              })
              .select()
              .single()

            return {
              id: authData.user.id,
              email: authData.user.email!,
              name: newProfile?.full_name || '',
              image: newProfile?.avatar_url || ''
            }
          }

          return {
            id: authData.user.id,
            email: authData.user.email!,
            name: profile.full_name || '',
            image: profile.avatar_url || ''
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      // Default redirect to app after successful auth
      return `${baseUrl}/app`
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Get user's role from Supabase
        try {
          // First try to get from auth.users user_metadata
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
          if (authUser.user) {
            token.user_role = authUser.user.user_metadata?.user_role || 
                             authUser.user.app_metadata?.role || 
                             'free';
          } else {
            // Fallback: get from our custom users table
            const { data: userData } = await supabase
              .from('autopostvn_users')
              .select('user_role')
              .eq('id', user.id)
              .single();
            
            token.user_role = userData?.user_role || 'free';
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          token.user_role = 'free';
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).user_role = token.user_role as string;
      }
      return session
    }
  }
}
