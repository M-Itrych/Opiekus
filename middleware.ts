import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/session';

// Define which roles can access which paths
const rolePathMap: Record<string, string[]> = {
	PARENT: ['/Parent'],
	TEACHER: ['/Teacher'],
	HEADTEACHER: ['/HeadTeacher'],
	ADMIN: ['/HeadTeacher', '/Teacher', '/Parent'], // Admin can access everything
};

// Define the default redirect path for each role
const roleDefaultPath: Record<string, string> = {
	PARENT: '/Parent',
	TEACHER: '/Teacher',
	HEADTEACHER: '/HeadTeacher',
	ADMIN: '/HeadTeacher',
};

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

	// API routes (except auth) require authentication but role check is done in the route itself
	if (pathname.startsWith('/api/')) {
		const token = request.cookies.get('session')?.value;
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
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

	const userRole = payload.role as string;

	// Check if user is trying to access a role-specific path
	const protectedPaths = ['/Parent', '/Teacher', '/HeadTeacher'];
	const accessingProtectedPath = protectedPaths.find(path => 
		pathname.toLowerCase().startsWith(path.toLowerCase())
	);

	if (accessingProtectedPath) {
		// Get allowed paths for this user's role
		const allowedPaths = rolePathMap[userRole] || [];
		
		// Check if user can access this path (case insensitive)
		const canAccess = allowedPaths.some(allowedPath => 
			pathname.toLowerCase().startsWith(allowedPath.toLowerCase())
		);

		if (!canAccess) {
			// Redirect to the user's default panel
			const defaultPath = roleDefaultPath[userRole] || '/Login';
			return NextResponse.redirect(new URL(defaultPath, request.url));
		}
	}

	// Root path - redirect to appropriate panel based on role
	if (pathname === '/') {
		const defaultPath = roleDefaultPath[userRole] || '/Login';
		return NextResponse.redirect(new URL(defaultPath, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
