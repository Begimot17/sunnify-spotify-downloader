import assert from "node:assert/strict"
import { test } from "node:test"

import { backendErrorMessage, normalizeSpotifyUrl } from "./spotify-url.ts"

test("accepts canonical, locale and embed links, trimmed", () => {
  assert.equal(
    normalizeSpotifyUrl("  https://open.spotify.com/playlist/abc123?si=x \n"),
    "https://open.spotify.com/playlist/abc123?si=x"
  )
  assert.ok(normalizeSpotifyUrl("https://open.spotify.com/intl-de/album/abc"))
  assert.ok(normalizeSpotifyUrl("https://open.spotify.com/embed/track/abc"))
})

test("adds a missing scheme", () => {
  assert.equal(
    normalizeSpotifyUrl("open.spotify.com/track/abc"),
    "https://open.spotify.com/track/abc"
  )
})

test("accepts spotify: uris", () => {
  assert.equal(normalizeSpotifyUrl("spotify:playlist:abc123"), "spotify:playlist:abc123")
  assert.equal(normalizeSpotifyUrl("spotify:user:me:playlist:abc"), "spotify:user:me:playlist:abc")
})

test("rejects lookalike hosts, other schemes and junk", () => {
  for (const bad of [
    "",
    "   ",
    "not a url",
    "https://evil.com/open.spotify.com/track/abc",
    "https://open.spotify.com.evil.com/track/abc",
    "https://evilopen.spotify.com/track/abc",
    "ftp://open.spotify.com/track/abc",
    "javascript:alert(1)",
    "spotify:artist:abc",
  ]) {
    assert.equal(normalizeSpotifyUrl(bad), null, bad)
  }
})

test("backendErrorMessage prefers the backend JSON message", async () => {
  const body = JSON.stringify({ event: "error", data: { message: "Invalid Spotify URL" } })
  const res = new Response(body, { status: 400 })
  assert.equal(await backendErrorMessage(res, "fallback"), "Invalid Spotify URL")
})

test("backendErrorMessage falls back on a non-JSON body", async () => {
  const html = new Response("<html>502</html>", { status: 502 })
  assert.equal(await backendErrorMessage(html, "fb"), "fb")
  assert.equal(await backendErrorMessage(new Response("{}", { status: 500 }), "fb"), "fb")
})
