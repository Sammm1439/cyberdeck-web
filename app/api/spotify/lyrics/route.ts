export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const track = url.searchParams.get("track");
    const artist = url.searchParams.get("artist");
    const album = url.searchParams.get("album");
    const durationMs = url.searchParams.get("duration_ms");

    if (!track || !artist) {
      return Response.json(
        { error: "track and artist are required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      track_name: track,
      artist_name: artist,
    });

    if (album) {
      params.set("album_name", album);
    }

    if (durationMs) {
      const durationSeconds = Math.round(
        Number(durationMs) / 1000
      );

      if (!Number.isNaN(durationSeconds)) {
        params.set(
          "duration",
          durationSeconds.toString()
        );
      }
    }

    const response = await fetch(
      `https://lrclib.net/api/get?${params.toString()}`,
      {
        headers: {
          "Lrclib-Client":
            "Cyberdeck/1.0 (https://cyberdeck.theneighbourhoodlabs.com)",
        },
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return Response.json({
        found: false,
        synced: false,
        message: "Lyrics not found",
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return Response.json(data, {
        status: response.status,
      });
    }

    return Response.json({
      found: true,
      synced: !!data.syncedLyrics,

      track: data.trackName,
      artist: data.artistName,
      album: data.albumName,

      instrumental: data.instrumental,

      plainLyrics: data.plainLyrics,
      syncedLyrics: data.syncedLyrics,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}