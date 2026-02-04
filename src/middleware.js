import { NextResponse } from 'next/server';
import { verifyTokenEdge } from './lib/auth-edge';

const protectedPaths = ['/dashboard', '/api/appointments', '/api/slots', '/api/notifications', '/api/users', '/api/blocked-slots'];
const adminPaths = ['/dashboard/admin', '/api/blocked-slots'];
const authPaths = ['/login', '/register'];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value;

    if (authPaths.some((path) => pathname.startsWith(path))) {
        if (token) {
            const payload = await verifyTokenEdge(token);
            if (payload) {
                const redirectUrl = payload.role === 'user' ? '/dashboard/user' : '/dashboard/admin';
                return NextResponse.redirect(new URL(redirectUrl, request.url));
            }
        }
        return NextResponse.next();
    }

    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtected) {
        if (!token) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyTokenEdge(token);
        if (!payload) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

        if (isAdminPath && payload.role === 'user') {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            return NextResponse.redirect(new URL('/dashboard/user', request.url));
        }

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId);
        requestHeaders.set('x-user-email', payload.email);
        requestHeaders.set('x-user-role', payload.role);

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/register',
        '/api/appointments/:path*',
        '/api/slots/:path*',
        '/api/blocked-slots/:path*',
        '/api/notifications/:path*',
        '/api/users/:path*',
    ],
};
