import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // A simple client-side simulation middleware won't easily read localStorage.
  // Next.js middleware runs on the edge and only sees cookies.
  // Since the user is storing 'token' and 'user' in localStorage (as seen in settings/page.tsx),
  // we must handle protection on the client side inside a layout or HOC, OR if they are using cookies, we check here.
  
  // Let's check if there's a token cookie (if the backend sets it).
  // If not, we will rely on client-side protection in the layout.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/analytics/:path*', '/projects/:path*'],
};
