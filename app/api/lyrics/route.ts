import Sanscript from "@indic-transliteration/sanscript";

function cleanRomanHindi(text: string) {
  return text
    .replace(/ā/g, "a")
    .replace(/ī/g, "i")
    .replace(/ū/g, "u")
    .replace(/ṛ/g, "r")
    .replace(/ṝ/g, "r")
    .replace(/ṅ/g, "n")
    .replace(/ñ/g, "n")
    .replace(/ṇ/g, "n")
    .replace(/ṭ/g, "t")
    .replace(/ḍ/g, "d")
    .replace(/ś/g, "sh")
    .replace(/ṣ/g, "sh")
    .replace(/ḥ/g, "h")
    .replace(/ṃ/g, "n")
    .replace(/ṁ/g, "n")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function romanize(text: string) {
  try {
    const roman = Sanscript.t(
      text,
      "devanagari",
      "iast"
    );

    return cleanRomanHindi(roman);
  } catch {
    return text;
  }
}

function parseSyncedLyrics(syncedLyrics: string | null) {
  if (!syncedLyrics) return [];

  return syncedLyrics
    .split("\n")
    .map((line) => {
      const match = line.match(
        /^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/
      );

      if (!match) return null;

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const text = match[3].trim();

      const timeMs = Math.round(
        (minutes * 60 + seconds) * 1000
      );

      return {
        time_ms: timeMs,
        original: text,
        romanized: romanize(text),
      };
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const track = url.searchParams.get("track");
    const artist = url.searchParams.get("artist");
    const album = url.searchParams.get("album");
    const durationMs = url.searchParams.get("duration_ms");

    if (!track || !artist) {
      return Response.json(
        {
          error: "track and artist are required",
        },
        {
          status: 400,
        }
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

    const syncedLines = parseSyncedLyrics(
      data.syncedLyrics
    );

    return Response.json(
      {
        found: true,
        synced: syncedLines.length > 0,

        track: data.trackName,
        artist: data.artistName,
        album: data.albumName,

        instrumental: data.instrumental,

        plainLyrics: data.plainLyrics,

        lines: syncedLines,
      },
      {
        headers: {
          "Content-Type":
            "application/json; charset=utf-8",
        },
      }
    );
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