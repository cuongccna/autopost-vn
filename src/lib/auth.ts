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
          return null
        }

        try {
          // Find user by email in users table
          const result = await query(
            `SELECT * FROM autopostvn_users WHERE email = $1 LIMIT 1`,
            [credentials.email]
          )

          if (result.rows.length === 0) {
            console.log('User not found:', credentials.email)
            return null
          }

          const user = result.rows[0]
          
          // Verify password
          if (!user.password_hash) {
            console.log('No password hash found')
            return null
          }

          const passwordValid = await bcrypt.compare(credentials.password, user.password_hash)
          if (!passwordValid) {
            console.log('Invalid password')
            return null
          }

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

          return {
            id: user.id,
            email: user.email,
            name: user.full_name || user.email,
            image: user.avatar_url || ''
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
        // Get user's role from user record, not workspace
        try {
          const result = await query(
            'SELECT user_role FROM autopostvn_users WHERE id = $1 LIMIT 1',
            [user.id]
          )
          
          if (result.rows.length > 0) {
            token.user_role = result.rows[0].user_role || 'free'
          } else {
            token.user_role = 'free'
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          token.user_role = 'free'
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
