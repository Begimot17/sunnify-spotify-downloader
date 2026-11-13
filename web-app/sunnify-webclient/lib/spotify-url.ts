const SPOTIFY_HOST = "open.spotify.com"
const SPOTIFY_URI = /^spotify:(?:user:[^:/?#\s]+:)?(?:playlist|track|album):[A-Za-z0-9]+$/

/**
 * Turn what the user pasted into a link the backend accepts, or null.
 *
 * Trims whitespace, tolerates a missing scheme ("open.spotify.com/..."),
 * accepts spotify: URIs, and checks the hostname exactly so that
 * "https://evil.com/open.spotify.com" or "open.spotify.com.evil.com" fail.
 */
export function normalizeSpotifyUrl(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  if (SPOTIFY_URI.test(text)) return text

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.hostname !== SPOTIFY_HOST) return null
  return candidate
}

/** Best human message from a failed backend response (its JSON error wins). */
export async function backendErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    const message = body?.data?.message
    if (typeof message === "string" && message) return message
  } catch {
    // non-JSON error page (proxy, cold-start gateway): use the fallback
  }
  return fallback
}
