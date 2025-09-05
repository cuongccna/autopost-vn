import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(_req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to landing page
        if (pathname === '/') {
          return true
        }
        
        // Allow access to dashboard (for now)
        if (pathname === '/dashboard') {
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
          return true
        }
        
        // Allow access to legal pages
        if (pathname.startsWith('/legal/')) {
          return true
        }
        
        // Allow access to API routes (they handle their own auth)
        if (pathname.startsWith('/api/')) {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
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
