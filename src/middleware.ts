import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  console.log('🛡️ MIDDLEWARE: Checking path:', pathname)
  
  // Allow access to static files (SEO, icons, etc.)
  const staticFiles = [
    '/sitemap.xml',
    '/robots.txt',
    '/favicon.ico',
    '/manifest.webmanifest',
    '/browserconfig.xml',
    '/apple-touch-icon.png',
    '/og-image.png',
    '/icon-192.png',
    '/icon-512.png'
  ]
  if (staticFiles.includes(pathname) || pathname.startsWith('/icons/')) {
    console.log('🛡️ MIDDLEWARE: Allowing static file')
    return NextResponse.next()
  }
  
  // Allow access to auth pages without token
  if (pathname.startsWith('/auth/')) {
    console.log('🛡️ MIDDLEWARE: Allowing auth page')
    return NextResponse.next()
  }
  
  // Allow access to landing page
  if (pathname === '/') {
    console.log('🛡️ MIDDLEWARE: Allowing landing page')
    return NextResponse.next()
  }
  
  // Allow access to dashboard (for now)
  if (pathname === '/dashboard') {
    console.log('🛡️ MIDDLEWARE: Allowing dashboard')
    return NextResponse.next()
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
    return NextResponse.next()
  }
  
  // Allow access to legal pages
  if (pathname.startsWith('/legal/')) {
    console.log('🛡️ MIDDLEWARE: Allowing legal page')
    return NextResponse.next()
  }
  
  // Allow access to other API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    console.log('🛡️ MIDDLEWARE: Allowing API route')
    return NextResponse.next()
  }
  
  // For protected routes, check authentication
  console.log('🛡️ MIDDLEWARE: Protected route, checking token...')
  
  // Debug: Check cookies
  const cookies = req.cookies.getAll()
  console.log('🍪 MIDDLEWARE: All cookies:', cookies.map(c => c.name))
  const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token')
  console.log('🍪 MIDDLEWARE: Session cookie exists:', !!sessionCookie, 'name:', sessionCookie?.name, 'value length:', sessionCookie?.value?.length)
  
  // Try both secure and non-secure cookie names
  let token = await getToken({ 
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,  // Try non-secure first since cookie name is 'next-auth.session-token'
    cookieName: 'next-auth.session-token'
  })
  
  console.log('🛡️ MIDDLEWARE: Token (non-secure):', !!token, 'token.id:', token?.id)
  
  if (!token) {
    // Try secure version
    token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true,
      cookieName: '__Secure-next-auth.session-token'
    })
    console.log('🛡️ MIDDLEWARE: Token (secure):', !!token, 'token.id:', token?.id)
  }
  
  console.log('🔑 MIDDLEWARE: NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET, 'length:', process.env.NEXTAUTH_SECRET?.length)
  
  if (!token || !token.id) {
    console.log('🛡️ MIDDLEWARE: No valid token, redirecting to signin')
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  console.log('🛡️ MIDDLEWARE: Access granted for user:', token.id)
  return NextResponse.next()
}

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
