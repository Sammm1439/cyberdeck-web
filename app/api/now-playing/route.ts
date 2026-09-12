import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("now_playing")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabase
    .from("now_playing")
    .update({
      title: body.title,
      artist: body.artist,
      video_id: body.video_id,
      artwork_url: body.artwork_url,
      playing: body.playing,
      position_ms: body.position_ms,
      duration_ms: body.duration_ms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}