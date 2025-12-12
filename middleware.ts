import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/session';

const rolePathMap: Record<string, string[]> = {
	PARENT: ['/Parent'],
	TEACHER: ['/Teacher'],
	HEADTEACHER: ['/HeadTeacher'],
	ADMIN: ['/HeadTeacher', '/Teacher', '/Parent'],
};

const roleDefaultPath: Record<string, string> = {
	PARENT: '/Parent',
	TEACHER: '/Teacher',
	HEADTEACHER: '/HeadTeacher',
	ADMIN: '/HeadTeacher',
};

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const publicPaths = [
		'/Login',
		'/Register',
		'/reset-password',
		'/api/auth',
		'/api/uploadthing',
		'/_next',
		'/static',
		'/logo',
		'/favicon.ico',
		'/globe.svg',
		'/file.svg',
		'/next.svg',
		'/vercel.svg',
		'/window.svg',
		'/manifest.webmanifest',
		'/sw.js',
		'/global',
	];

	const isPublicPath = publicPaths.some(path => 
		pathname.toLowerCase().startsWith(path.toLowerCase())
	);
	
	const isStaticFile = pathname.match(/\.(ico|svg|png|jpg|jpeg|css|js|webmanifest|json)$/);

	if (isPublicPath || isStaticFile) {
		return NextResponse.next();
	}

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

	const protectedPaths = ['/Parent', '/Teacher', '/HeadTeacher'];
	const accessingProtectedPath = protectedPaths.find(path => 
		pathname.toLowerCase().startsWith(path.toLowerCase())
	);

	if (accessingProtectedPath) {
		const allowedPaths = rolePathMap[userRole] || [];
		
		const canAccess = allowedPaths.some(allowedPath => 
			pathname.toLowerCase().startsWith(allowedPath.toLowerCase())
		);

		if (!canAccess) {
			const defaultPath = roleDefaultPath[userRole] || '/Login';
			return NextResponse.redirect(new URL(defaultPath, request.url));
		}
	}

	if (pathname === '/') {
		const defaultPath = roleDefaultPath[userRole] || '/Login';
		return NextResponse.redirect(new URL(defaultPath, request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
