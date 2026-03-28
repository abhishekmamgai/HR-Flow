import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes - skip
  if (pathname === '/' ||
      pathname.startsWith('/login') || 
      pathname.startsWith('/change-password') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/models') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in → login page
  if (!session) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  // Check first_login from user metadata
  const firstLogin = session.user.user_metadata?.first_login
  if (firstLogin === true && pathname !== '/change-password') {
    return NextResponse.redirect(
      new URL('/change-password', request.url)
    )
  }

  // Get role from user metadata
  const role = session.user.user_metadata?.role

  // If role is missing, don't force a redirect yet. 
  // Let the page render and getCompanyContext will sync the metadata.
  if (!role) {
    return response
  }

  // Admin/HR trying to access employee routes
  if ((role === 'admin' || role === 'hr' || role === 'company_admin' || role === 'hr_manager') && 
      (pathname === '/employee' || pathname.startsWith('/employee/'))) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  // Employee trying to access admin routes
  const adminRoutes = [
    '/dashboard', '/employees', '/attendance',
    '/leave/manage', '/payroll', '/settings', '/analytics'
  ]
  
  if (role === 'employee' && 
      adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.redirect(
      new URL('/employee/dashboard', request.url)
    )
  }

  // If already at dashboard, redirect to role-specific dashboard
  if (pathname === '/dashboard') {
     if (role === 'employee') {
        return NextResponse.redirect(new URL('/employee/dashboard', request.url))
     }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - models (face-api models)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|models).*)',
  ],
}
