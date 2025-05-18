import { NextResponse } from 'next/server';
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

const publicPaths = ['/', '/auth/error'];

const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
};

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const { pathname } = request.nextUrl;
    
    // Check for auth token
    const token = await getToken({ req: request });
    
    // If we're on the home page and user is authenticated,
    // redirect to the loading page
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/auth/loading', request.url));
    }
    
    // For public paths, allow access
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    // For protected routes, check auth
    if (!request.nextauth.token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};