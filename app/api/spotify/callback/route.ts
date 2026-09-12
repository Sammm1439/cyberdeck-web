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

  return Response.json(tokens);
}