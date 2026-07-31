function normalizePrefix(p: string): string {
  let s = p.trim();
  if (!s) return '';
  if (!s.startsWith('/')) s = '/' + s; // ensure leading slash if omitted
  s = s.replace(/\/+$/g, ''); // remove trailing slashes
  return s === '' ? '/' : s;
}

function getDisabledRoutePrefixes(): string[] {
  const raw = process.env.NEXT_PUBLIC_DISABLED_ROUTE_PREFIXES;
  if (!raw) return [];
  return raw
    .split(',')
    .map((p) => normalizePrefix(p))
    .filter((p) => p.length > 0);
}

export function isRouteDisabled(pathname: string): boolean {
  if (!pathname) return false;
  const normalizedPath = pathname.replace(/\/+$/g, '');
  const prefixes = getDisabledRoutePrefixes();
  if (prefixes.length === 0) return false;
  return prefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(prefix + '/')
  );
}
