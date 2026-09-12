import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.json(
      { error: "Missing Spotify authorization code" },
      { status: 400 }
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const redirectUri =
    "https://cyberdeck.theneighbourhoodlabs.com/api/spotify/callback";

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const tokenResponse = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const tokens = await tokenResponse.json();

  if (!tokenResponse.ok) {
    return Response.json(tokens, { status: tokenResponse.status });
  }

  if (!tokens.refresh_token) {
    return Response.json(
      { error: "Spotify did not return a refresh token" },
      { status: 500 }
    );
  }

  const { error } = await supabase
    .from("spotify_auth")
    .upsert({
      id: 1,
      refresh_token: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    message: "Spotify connected successfully"
  });
}