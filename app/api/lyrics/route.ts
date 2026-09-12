import Sanscript from "@indic-transliteration/sanscript";

function cleanRomanHindi(text: string) {
  return text
    .normalize("NFKD")

    // common Hindi transliteration cleanup
    .replace(/ā/g, "aa")
    .replace(/ī/g, "ee")
    .replace(/ū/g, "oo")
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

    // remove combining marks / leftover nukta characters
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/़/g, "")

    // fix awkward anusvara/chandrabindu style output
    .replace(/~/g, "n")

    // common natural Hindi spellings
    .replace(/\bhaan\b/gi, "haan")
    .replace(/\bhaa\b/gi, "haan")
    .replace(/\bkaaphii\b/gi, "kaafi")
    .replace(/\bkaafi\b/gi, "kaafi")
    .replace(/\bsamaan\b/gi, "sama")
    .replace(/\bkhabara\b/gi, "khabar")
    .replace(/\blafaza\b/gi, "lafz")
    .replace(/\bpyaara\b/gi, "pyar")
    .replace(/\bpyaar\b/gi, "pyar")
    .replace(/\bdiivaanii\b/gi, "deewani")
    .replace(/\bdeevaanii\b/gi, "deewani")
    .replace(/\bhairaanii\b/gi, "hairani")

    // general cleanup
    .replace(/aa+/g, "aa")
    .replace(/ee+/g, "ee")
    .replace(/oo+/g, "oo")
    .replace(/\s+/g, " ")
    .replace(/’/g, "'")
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