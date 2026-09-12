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
    throw new Error(
      tokens.error_description || "Could not refresh Spotify token"
    );
  }

  return tokens.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;
    const accessToken = await getAccessToken();

    let url = "";
    let method = "POST";

    switch (action) {
      case "play":
        url = "https://api.spotify.com/v1/me/player/play";
        method = "PUT";
        break;

      case "pause":
        url = "https://api.spotify.com/v1/me/player/pause";
        method = "PUT";
        break;

      case "next":
        url = "https://api.spotify.com/v1/me/player/next";
        break;

      case "previous":
        url = "https://api.spotify.com/v1/me/player/previous";
        break;

      case "seek":
        if (typeof body.position_ms !== "number") {
          return Response.json(
            { error: "position_ms required" },
            { status: 400 }
          );
        }

        url =
          "https://api.spotify.com/v1/me/player/seek?position_ms=" +
          Math.max(0, Math.floor(body.position_ms));

        method = "PUT";
        break;

      case "volume":
        if (typeof body.volume_percent !== "number") {
          return Response.json(
            { error: "volume_percent required" },
            { status: 400 }
          );
        }

        const volume = Math.max(
          0,
          Math.min(100, Math.floor(body.volume_percent))
        );

        url =
          "https://api.spotify.com/v1/me/player/volume?volume_percent=" +
          volume;

        method = "PUT";
        break;

      default:
        return Response.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }

    const spotifyResponse = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!spotifyResponse.ok) {
      let error;

      try {
        error = await spotifyResponse.json();
      } catch {
        error = { error: `Spotify returned ${spotifyResponse.status}` };
      }

      return Response.json(error, {
        status: spotifyResponse.status,
      });
    }

    return Response.json({
      success: true,
      action,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}