export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri =
    "https://cyberdeck.theneighbourhoodlabs.com/api/spotify/callback";

  const scope = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri
  });

  return Response.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  );
}