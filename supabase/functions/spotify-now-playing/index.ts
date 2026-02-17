const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET") ?? "";
  const refreshToken = Deno.env.get("SPOTIFY_REFRESH_TOKEN") ?? "";

  if (!clientId || !clientSecret || !refreshToken) {
    return jsonResponse(500, { error: "spotify_secrets_missing" });
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken
      })
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return jsonResponse(500, {
        error: "spotify_token_refresh_failed",
        details: errorText
      });
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      return jsonResponse(500, { error: "spotify_access_token_missing" });
    }

    const spotifyHeaders = {
      Authorization: `Bearer ${accessToken}`
    };

    const currentRes = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: spotifyHeaders
    });

    // Spotify returns 204 when nothing is currently playing.
    if (currentRes.status === 200) {
      const current = await currentRes.json();
      if (current?.item) {
        return jsonResponse(200, current);
      }
    }

    const recentRes = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
      headers: spotifyHeaders
    });

    if (!recentRes.ok) {
      const errorText = await recentRes.text();
      return jsonResponse(500, {
        error: "spotify_recent_fetch_failed",
        details: errorText
      });
    }

    const recent = await recentRes.json();
    if (!recent?.items?.length) {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store"
        }
      });
    }

    return jsonResponse(200, recent);
  } catch (error) {
    return jsonResponse(500, {
      error: "spotify_now_playing_unexpected",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
