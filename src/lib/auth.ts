import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { query } from '@/lib/db/postgres'
import bcrypt from 'bcryptjs'

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
          console.log('❌ AUTH: Missing credentials')
          return null
        }

        try {
          console.log('🔍 AUTH: Login attempt for:', credentials.email)
          
          // Find user by email in users table
          const result = await query(
            `SELECT * FROM autopostvn_users WHERE email = $1 LIMIT 1`,
            [credentials.email]
          )

          if (result.rows.length === 0) {
            console.log('❌ AUTH: User not found:', credentials.email)
            return null
          }

          const user = result.rows[0]
          console.log('✅ AUTH: User found - ID:', user.id, 'Email:', user.email)
          
          // Verify password
          if (!user.password_hash) {
            console.log('❌ AUTH: No password hash found for user:', user.id)
            return null
          }

          console.log('🔐 AUTH: Password hash exists, length:', user.password_hash.length)
          console.log('🔐 AUTH: Comparing password...')
          
          const passwordValid = await bcrypt.compare(credentials.password, user.password_hash)
          console.log('🔐 AUTH: Password comparison result:', passwordValid)
          
          if (!passwordValid) {
            console.log('❌ AUTH: Invalid password for user:', user.email)
            return null
          }
          
          console.log('✅ AUTH: Password verified successfully!')

          // Auto-create workspace if not exists (1:1 mapping with user)
          const workspaceResult = await query(
            `SELECT id FROM autopostvn_workspaces WHERE user_id = $1 LIMIT 1`,
            [user.id]
          )

          if (workspaceResult.rows.length === 0) {
            console.log(`Creating workspace for user ${user.id} (${user.email})`);
            await query(
              `INSERT INTO autopostvn_workspaces (user_id, name, slug, settings, created_at, updated_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())`,
              [
                user.id,  // ✅ Set user_id
                `${user.full_name || user.email}'s Workspace`,
                `user-${user.id.substring(0, 8)}`,
                JSON.stringify({})
              ]
            )
          }

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.full_name || user.email,
            image: user.avatar_url || ''
          }
          
          console.log('✅ AUTH: Returning user object:', JSON.stringify(userObject))
          return userObject
        } catch (error) {
          console.error('❌ AUTH ERROR:', error)
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
      console.log('🔄 REDIRECT callback - url:', url, 'baseUrl:', baseUrl)
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('🔄 REDIRECT: Relative URL ->', redirectUrl)
        return redirectUrl
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        console.log('🔄 REDIRECT: Same origin ->', url)
        return url
      }
      // Default redirect to app after successful auth
      const defaultUrl = `${baseUrl}/app`
      console.log('🔄 REDIRECT: Default ->', defaultUrl)
      return defaultUrl
    },
    async jwt({ token, user }) {
      try {
        console.log('🎫 JWT callback - user:', user ? 'present' : 'null', 'token.id:', token.id)
        if (user) {
          console.log('🎫 JWT: Setting token.id =', user.id)
          token.id = user.id
          // Get user's role from user record, not workspace
          try {
            const result = await query(
              'SELECT user_role FROM autopostvn_users WHERE id = $1 LIMIT 1',
              [user.id]
            )
            
            if (result.rows.length > 0) {
              token.user_role = result.rows[0].user_role || 'free'
              console.log('🎫 JWT: Set user_role =', token.user_role)
            } else {
              token.user_role = 'free'
              console.log('🎫 JWT: No role found, defaulting to free')
            }
          } catch (error) {
            console.error('❌ JWT: Error fetching user role:', error)
            token.user_role = 'free'
          }
        }
        console.log('🎫 JWT: Returning token with id:', token.id)
        return token
      } catch (error) {
        console.error('❌ JWT CALLBACK ERROR:', error)
        throw error
      }
    },
    async session({ session, token }) {
      console.log('📝 SESSION callback - token.id:', token.id, 'token.user_role:', token.user_role)
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).user_role = token.user_role as string;
        console.log('📝 SESSION: Set user.id =', token.id, 'user_role =', token.user_role)
      }
      return session
    }
  }
}
