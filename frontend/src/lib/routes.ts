/* Pages that require a session. This mirrors the matcher in src/proxy.ts,
   which Next requires to be a static literal, so the two must change together. */
const protectedRouteRoots = ["/workouts", "/analytics", "/journal", "/profile"];

export function isProtectedRoute(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (path === "/") return true;
  return protectedRouteRoots.some((root) => path === root || path.startsWith(`${root}/`));
}

/* Everything else is open to logged-out visitors: /login, /register,
   /forgot-password, /reset-password, /verify-email, /forbidden and error pages. */
export function isPublicRoute(pathname: string): boolean {
  return !isProtectedRoute(pathname);
}
