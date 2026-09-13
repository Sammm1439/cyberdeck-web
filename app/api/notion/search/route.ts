import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      "https://api.notion.com/v1/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          page_size: 50,
        }),
        cache: "no-store",
      }
    );

    const notionData = await notionResponse.json();

    if (!notionResponse.ok) {
      return Response.json(notionData, {
        status: notionResponse.status,
      });
    }

    const results = notionData.results.map((item: any) => {
      let title = "Untitled";

      if (item.object === "page") {
        const props = item.properties ?? {};

        for (const key of Object.keys(props)) {
          if (props[key]?.type === "title") {
            const titleArray = props[key].title;

            if (titleArray?.length) {
              title = titleArray
                .map((t: any) => t.plain_text)
                .join("");
            }

            break;
          }
        }
      }

      if (item.object === "database") {
        if (item.title?.length) {
          title = item.title
            .map((t: any) => t.plain_text)
            .join("");
        }
      }

      return {
        id: item.id,
        type: item.object,
        title,
        url: item.url,
      };
    });

    return Response.json({
      device_id: deviceId,
      count: results.length,
      results,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}