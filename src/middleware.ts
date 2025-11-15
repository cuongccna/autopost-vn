import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(_req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        console.log('🛡️ MIDDLEWARE:', pathname, 'has token:', !!token, 'token.id:', token?.id)
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          console.log('🛡️ MIDDLEWARE: Allowing auth page')
          return true
        }
        
        // Allow access to landing page
        if (pathname === '/') {
          console.log('🛡️ MIDDLEWARE: Allowing landing page')
          return true
        }
        
        // Allow access to dashboard (for now)
        if (pathname === '/dashboard') {
          console.log('🛡️ MIDDLEWARE: Allowing dashboard')
          return true
        }
        
        // Allow access to all marketing/legal pages (no auth required)
        const publicPages = [
          '/features',
          '/pricing', 
          '/support',
          '/help',    // Redirects to /support
          '/terms',
          '/privacy',
          '/cookies'
        ]
        if (publicPages.includes(pathname)) {
          console.log('🛡️ MIDDLEWARE: Allowing public page')
          return true
        }
        
        // Allow access to legal pages
        if (pathname.startsWith('/legal/')) {
          console.log('🛡️ MIDDLEWARE: Allowing legal page')
          return true
        }
        
        // Strictly protect debug APIs: require feature flag + admin role
        if (pathname.startsWith('/api/debug')) {
          const debugEnabled = process.env.DEBUG_API_ENABLED === 'true'
          if (!debugEnabled || !token) {
            console.log('🛡️ MIDDLEWARE: Blocking debug API')
            return false
          }
          const role = (token as any).user_role || (token as any).role
          const allowed = role === 'admin'
          console.log('🛡️ MIDDLEWARE: Debug API, role:', role, 'allowed:', allowed)
          return allowed
        }

        // Allow access to other API routes (they handle their own auth)
        if (pathname.startsWith('/api/')) {
          console.log('🛡️ MIDDLEWARE: Allowing API route')
          return true
        }
        
        // Require authentication for all other routes
        const hasAuth = !!token && !!token.id
        console.log('🛡️ MIDDLEWARE: Protected route, has auth:', hasAuth)
        return hasAuth
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - icons folder
     * - manifest and service worker
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|icons/|manifest.webmanifest|sw.js).*)",
  ],
}
