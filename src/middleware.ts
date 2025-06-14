// Temporarily disabled auth for testing
// import { withAuth } from 'next-auth/middleware'
// import { NextResponse } from 'next/server'

// export default withAuth(
//   function middleware(req) {
//     return NextResponse.next()
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// )

// export const config = {
//   matcher: ['/dashboard/:path*'],
// }

// Temporary middleware that allows all routes
export function middleware() {
  return
}

export const config = {
  matcher: [],
} 