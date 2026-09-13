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

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
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
    }
  );

  const tokens = await response.json();

  if (!response.ok) {
    throw new Error(
      tokens.error_description || "Could not refresh Spotify token"
    );
  }

  return tokens.access_token;
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();

    const spotifyResponse = await fetch(
      "https://api.spotify.com/v1/me/player/queue",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!spotifyResponse.ok) {
      let error;

      try {
        error = await spotifyResponse.json();
      } catch {
        error = {
          error: `Spotify returned ${spotifyResponse.status}`,
        };
      }

      return Response.json(error, {
        status: spotifyResponse.status,
      });
    }

    const data = await spotifyResponse.json();

    const current = data.currently_playing
      ? {
          id: data.currently_playing.id,
          uri: data.currently_playing.uri,
          name: data.currently_playing.name,

          artists:
            data.currently_playing.artists?.map(
              (artist: any) => artist.name
            ) ?? [],

          album:
            data.currently_playing.album?.name ?? "",

          artwork:
            data.currently_playing.album?.images?.[0]?.url ?? "",

          duration_ms:
            data.currently_playing.duration_ms ?? 0,
        }
      : null;

    const queue =
      data.queue?.map((track: any) => ({
        id: track.id,

        // IMPORTANT — ESP32 needs this
        uri: track.uri,

        name: track.name,

        artists:
          track.artists?.map(
            (artist: any) => artist.name
          ) ?? [],

        album:
          track.album?.name ?? "",

        artwork:
          track.album?.images?.[0]?.url ?? "",

        duration_ms:
          track.duration_ms ?? 0,
      })) ?? [];

    return Response.json({
      currently_playing: current,
      queue,
    });
  } catch (error: any) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}