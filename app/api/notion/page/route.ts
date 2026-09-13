import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const deviceId = url.searchParams.get("device_id");
    const pageId = url.searchParams.get("page_id");

    if (!deviceId || !pageId) {
      return Response.json(
        { error: "device_id and page_id required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notion_auth")
      .select("access_token")
      .eq("device_id", deviceId)
      .single();

    if (error || !data?.access_token) {
      return Response.json(
        { error: "Notion not connected for this device" },
        { status: 404 }
      );
    }

    const notionResponse = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Notion-Version": "2022-06-28",
        },
        cache: "no-store",
      }
    );

    const notionData = await notionResponse.json();

    if (!notionResponse.ok) {
      return Response.json(notionData, {
        status: notionResponse.status,
      });
    }

    const blocks = notionData.results.map((block: any) => {
      const type = block.type;
      const value = block[type];

      let text = "";

      if (value?.rich_text?.length) {
        text = value.rich_text
          .map((t: any) => t.plain_text)
          .join("");
      }

      return {
        id: block.id,
        type,
        has_children: block.has_children,
        text,

        checked:
          type === "to_do"
            ? value.checked
            : undefined,

        child_page_title:
          type === "child_page"
            ? value.title
            : undefined,

        child_database_title:
          type === "child_database"
            ? value.title
            : undefined,
      };
    });

    return Response.json({
      page_id: pageId,
      count: blocks.length,
      blocks,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}