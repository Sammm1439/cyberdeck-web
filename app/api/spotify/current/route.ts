import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccessToken() {
  const { data, error } = await supabase
    .from("spotify_auth")
    .select("refresh_token")
    .eq("id", 1)
    .single();

  if (error || !data?.refresh_token) {
    throw new Error("Spotify is not connected");
  }

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: data.refresh_token,
    }),
    cache: "no-store",
  });

  const tokens = await response.json();

  if (!response.ok) {
    throw new Error(tokens.error_description || "Could not refresh Spotify token");
  }

  return tokens.access_token;
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://api.spotify.com/v1/me/player",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (response.status === 204) {
      return Response.json({
        playing: false,
        message: "No active Spotify playback"
      });
    }

    const playback = await response.json();

    if (!response.ok) {
      return Response.json(playback, { status: response.status });
    }

    const track = playback.item;

    return Response.json({
      playing: playback.is_playing,
      progress_ms: playback.progress_ms,
      device: {
        id: playback.device?.id,
        name: playback.device?.name,
        type: playback.device?.type,
        volume_percent: playback.device?.volume_percent,
      },
      track: track
        ? {
            id: track.id,
            name: track.name,
            artists: track.artists?.map((artist: any) => artist.name),
            album: track.album?.name,
            artwork: track.album?.images?.[0]?.url,
            duration_ms: track.duration_ms,
          }
        : null,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}