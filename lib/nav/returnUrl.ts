/**
 * Where to go after signing in: `returnUrl` when it is a path under the current locale,
 * otherwise the locale's home page. Anything else (another origin, `//host`, `/\host`, a
 * scheme) is refused, so the login page cannot be used as an open redirect.
 */
export function loginDestination(returnUrl: string | null, locale: string): string {
  return returnUrl && returnUrl.startsWith(`/${locale}`) ? returnUrl : `/${locale}`;
}
