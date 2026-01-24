import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do not write any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make your app slow.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Define public routes that don't require authentication
    // Note: /admin routes are "public" to middleware but locked in the layout
    const publicRoutes = ['/login', '/signup', '/', '/admin', '/unauthorized', '/how-it-works', '/request-demo']
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith('/api/webhooks')
    )

    if (!user && !isPublicRoute) {
        // SMART REDIRECT: Redirect to the correct login page based on the requested route
        const url = request.nextUrl.clone()
        const path = request.nextUrl.pathname

        if (path.startsWith('/operator') || path.startsWith('/admin-console')) {
            url.pathname = '/admin'
        } else {
            url.pathname = '/login'
        }

        return NextResponse.redirect(url)
    }

    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
        // Redirect to portal if already authenticated
        const url = request.nextUrl.clone()
        url.pathname = '/portal'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
