export async function GET(req: Request) {
  const url = new URL(req.url);

  const deviceId = url.searchParams.get("device_id");

  if (!deviceId) {
    return Response.json(
      { error: "device_id required" },
      { status: 400 }
    );
  }

  const clientId = process.env.NOTION_CLIENT_ID!;

  const redirectUri =
    "https://cyberdeck.theneighbourhoodlabs.com/api/notion/callback";

  const state = Buffer.from(
    JSON.stringify({
      device_id: deviceId,
      created_at: Date.now(),
    })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });

  return Response.redirect(
    `https://api.notion.com/v1/oauth/authorize?${params.toString()}`
  );
}