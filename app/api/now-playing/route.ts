export async function GET() {
  return Response.json({
    ok: true,
    message: "Spotify callback route is working"
  });
}