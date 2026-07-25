/**
 * ClientProfile has no color/logo field in the backend. This derives a stable,
 * per-client accent color from the client id so the Client Switcher can show a
 * swatch — a frontend-only placeholder, not real brand data.
 */
export function hashToHsl(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 75%, 60%)`;
}
