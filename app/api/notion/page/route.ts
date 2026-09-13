import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAccessToken(deviceId: string) {
  const { data, error } = await supabase
    .from("notion_auth")
    .select("access_token")
    .eq("device_id", deviceId)
    .single();

  if (error || !data?.access_token) {
    throw new Error("Notion not connected for this device");
  }

  return data.access_token;
}

async function fetchChildren(
  blockId: string,
  accessToken: string,
  depth = 0
): Promise<any[]> {
  if (depth > 5) {
    return [];
  }

  const response = await fetch(
    `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`,
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
    throw new Error(
      data?.message || `Notion returned ${response.status}`
    );
  }

  const blocks = [];

  for (const block of data.results) {
    const type = block.type;
    const value = block[type];

    let text = "";

    if (value?.rich_text?.length) {
      text = value.rich_text
        .map((t: any) => t.plain_text)
        .join("");
    }

    const parsed: any = {
      id: block.id,
      type,
      has_children: block.has_children,
      text,
    };

    if (type === "to_do") {
      parsed.checked = value.checked;
    }

    if (type === "child_page") {
      parsed.title = value.title;
    }

    if (type === "child_database") {
      parsed.title = value.title;
    }

    if (type === "heading_1") {
      parsed.heading = 1;
    }

    if (type === "heading_2") {
      parsed.heading = 2;
    }

    if (type === "heading_3") {
      parsed.heading = 3;
    }

    if (block.has_children) {
      parsed.children = await fetchChildren(
        block.id,
        accessToken,
        depth + 1
      );
    }

    blocks.push(parsed);
  }

  return blocks;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const deviceId = url.searchParams.get("device_id");
    const pageId = url.searchParams.get("page_id");

    if (!deviceId || !pageId) {
      return Response.json(
        {
          error: "device_id and page_id required",
        },
        {
          status: 400,
        }
      );
    }

    const accessToken = await getAccessToken(deviceId);

    const blocks = await fetchChildren(
      pageId,
      accessToken
    );

    return Response.json({
      device_id: deviceId,
      page_id: pageId,
      blocks,
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