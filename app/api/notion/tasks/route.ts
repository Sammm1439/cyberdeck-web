import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TODO_BLOCK_ID =
  "f1d146e3-7614-825a-90e2-01ef42122781";

async function getAccessToken(deviceId: string) {
  const { data, error } = await supabase
    .from("notion_auth")
    .select("access_token")
    .eq("device_id", deviceId)
    .single();

  if (error || !data?.access_token) {
    throw new Error("Notion not connected");
  }

  return data.access_token;
}


// =========================
// GET TASKS
// =========================

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const deviceId = url.searchParams.get("device_id");

    if (!deviceId) {
      return Response.json(
        { error: "device_id required" },
        { status: 400 }
      );
    }

    const accessToken =
      await getAccessToken(deviceId);

    const response = await fetch(
      `https://api.notion.com/v1/blocks/${TODO_BLOCK_ID}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": "2022-06-28",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, {
        status: response.status,
      });
    }

    const tasks = data.results
      .filter((block: any) => block.type === "to_do")
      .map((block: any) => ({
        id: block.id,

        text:
          block.to_do.rich_text
            ?.map((t: any) => t.plain_text)
            .join("") ?? "",

        checked: block.to_do.checked,
      }));

    return Response.json({
      device_id: deviceId,
      count: tasks.length,
      tasks,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


// =========================
// TOGGLE TASK
// =========================

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const deviceId = body.device_id;
    const blockId = body.block_id;
    const checked = body.checked;

    if (
      !deviceId ||
      !blockId ||
      typeof checked !== "boolean"
    ) {
      return Response.json(
        {
          error:
            "device_id, block_id and checked required",
        },
        { status: 400 }
      );
    }

    const accessToken =
      await getAccessToken(deviceId);

    const response = await fetch(
      `https://api.notion.com/v1/blocks/${blockId}`,
      {
        method: "PATCH",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },

        body: JSON.stringify({
          to_do: {
            checked,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, {
        status: response.status,
      });
    }

    return Response.json({
      success: true,
      block_id: blockId,
      checked: data.to_do.checked,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}