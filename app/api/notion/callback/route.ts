import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return Response.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    // Decode the device ID we stored in state
    let deviceId = "";

    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );

      deviceId = decoded.device_id;
    } catch {
      return Response.json(
        { error: "Invalid OAuth state" },
        { status: 400 }
      );
    }

    if (!deviceId) {
      return Response.json(
        { error: "Missing device ID" },
        { status: 400 }
      );
    }

    const clientId = process.env.NOTION_CLIENT_ID!;
    const clientSecret = process.env.NOTION_CLIENT_SECRET!;

    const redirectUri =
      "https://cyberdeck.theneighbourhoodlabs.com/api/notion/callback";

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://api.notion.com/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return Response.json(tokens, {
        status: tokenResponse.status,
      });
    }

    const { error } = await supabase
      .from("notion_auth")
      .upsert({
        device_id: deviceId,

        access_token: tokens.access_token,

        refresh_token:
          tokens.refresh_token ?? null,

        workspace_id:
          tokens.workspace_id ?? null,

        workspace_name:
          tokens.workspace_name ?? null,

        bot_id:
          tokens.bot_id ?? null,

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
      message: "Notion connected successfully",
      device_id: deviceId,
      workspace_name:
        tokens.workspace_name ?? null,
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