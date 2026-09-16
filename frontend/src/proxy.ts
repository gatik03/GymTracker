import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sessionMarkerCookie =
  process.env.JWT_SESSION_MARKER_COOKIE ?? "gymtracker_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(sessionMarkerCookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const destination = request.nextUrl.pathname;
  if (["/", "/workouts", "/analytics", "/journal", "/profile"].includes(destination)) {
    loginUrl.searchParams.set("next", destination);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/workouts/:path*",
    "/analytics/:path*",
    "/journal/:path*",
    "/profile/:path*",
  ],
};
