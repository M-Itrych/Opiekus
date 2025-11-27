import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = [
    '/Login',
    '/Register',
    '/api/auth',
    '/api/uploadthing',  // Required for UploadThing callbacks
    '/_next',
    '/static',
    '/logo',
    '/favicon.ico',
    '/globe.svg',
    '/file.svg',
    '/next.svg',
    '/vercel.svg',
    '/window.svg',
  ];

  // Case insensitive check for paths starting with public paths
  const isPublicPath = publicPaths.some(path => 
    pathname.toLowerCase().startsWith(path.toLowerCase())
  );
  
  const isStaticFile = pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js)$/);

  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/Login', request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL('/Login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
