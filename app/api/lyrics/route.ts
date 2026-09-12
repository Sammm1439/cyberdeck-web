const VOWELS: Record<string, string> = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "i",
  "उ": "u",
  "ऊ": "u",
  "ऋ": "ri",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
};

const MATRAS: Record<string, string> = {
  "ा": "aa",
  "ि": "i",
  "ी": "i",
  "ु": "u",
  "ू": "u",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
};

const CONSONANTS: Record<string, string> = {
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "n",

  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "n",

  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",

  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",

  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",

  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "v",

  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",

  "ळ": "l",

  // precomposed nukta characters
  "क़": "q",
  "ख़": "kh",
  "ग़": "g",
  "ज़": "z",
  "ड़": "r",
  "ढ़": "rh",
  "फ़": "f",
  "य़": "y",
};

const NUKTA_CONSONANTS: Record<string, string> = {
  "क": "q",
  "ख": "kh",
  "ग": "g",
  "ज": "z",
  "ड": "r",
  "ढ": "rh",
  "फ": "f",
  "य": "y",
};

/*
  Common Hindi words where purely phonetic conversion
  doesn't look like natural Hinglish.

  We correct them directly from the ORIGINAL Hindi word.
*/
const WORD_OVERRIDES: Record<string, string> = {
  "हाँ": "haan",
  "हा": "ha",
  "हां": "haan",

  "है": "hai",
  "हैं": "hain",
  "हूँ": "hoon",
  "हूं": "hoon",
  "हो": "ho",

  "मैं": "main",
  "में": "mein",
  "मेरे": "mere",
  "मेरी": "meri",
  "मेरा": "mera",

  "तू": "tu",
  "तुम": "tum",
  "तुझे": "tujhe",
  "तेरी": "teri",
  "तेरे": "tere",
  "तेरा": "tera",

  "मुझे": "mujhe",
  "हम": "hum",
  "हमने": "humne",

  "ये": "ye",
  "यह": "ye",
  "वो": "woh",
  "वह": "woh",

  "और": "aur",
  "या": "ya",
  "तो": "to",

  "का": "ka",
  "की": "ki",
  "के": "ke",
  "को": "ko",

  "से": "se",
  "पे": "pe",
  "पर": "par",

  "ना": "na",
  "नहीं": "nahi",
  "नही": "nahi",

  "क्या": "kya",
  "क्यों": "kyun",
  "कौन": "kaun",
  "कहाँ": "kahan",
  "कहा": "kaha",

  "अभी": "abhi",
  "कभी": "kabhi",
  "फिर": "phir",

  "जो": "jo",
  "भी": "bhi",
  "ही": "hi",

  "कुछ": "kuch",
  "सब": "sab",

  "कर": "kar",
  "करके": "karke",
  "करना": "karna",
  "करने": "karne",
  "करती": "karti",
  "करता": "karta",
  "करते": "karte",
  "करेगा": "karega",
  "करूँ": "karun",

  "चल": "chal",
  "चलते": "chalte",
  "चलेंगे": "chalenge",

  "मिल": "mil",
  "मिले": "mile",
  "मिलूँ": "milun",

  "बता": "bata",
  "बता": "bata",
  "बता दे": "bata de",

  "देख": "dekh",
  "देखे": "dekhe",

  "लगा": "laga",
  "लगी": "lagi",

  "लिख": "likh",
  "लिखने": "likhne",
  "लिखूँ": "likhun",

  "रात": "raat",
  "दिन": "din",

  "बात": "baat",
  "बातें": "baatein",

  "आँखों": "aankhon",
  "आंखों": "aankhon",

  "आती": "aati",
  "आता": "aata",

  "जाना": "jaana",
  "जाएँ": "jaayein",

  "जानाँ": "jaana",

  "प्यार": "pyar",
  "प्यार की": "pyar ki",

  "सपनों": "sapnon",
  "ख़्वाबों": "khwabon",
  "ख्वाबों": "khwabon",

  "दुनिया": "duniya",

  "काफ़ी": "kaafi",
  "काफी": "kaafi",

  "बाक़ी": "baaki",
  "बाकी": "baaki",

  "ख़बर": "khabar",
  "खबर": "khabar",

  "ज़रा": "zara",
  "जरा": "zara",

  "ज़ाहिर": "zahir",
  "जाहिर": "zahir",

  "लफ़्ज़": "lafz",
  "लफ्ज़": "lafz",

  "समाँ": "sama",
  "समा": "sama",

  "सहर": "sahar",

  "ठहर": "thehar",

  "दोहराना": "dohrana",

  "थोड़ी": "thodi",
  "थोड़े": "thode",

  "सुन": "sun",

  "धुन": "dhun",

  "गुम": "gum",

  "बेतुकी": "betuki",

  "लड़ना": "ladna",

  "पकड़ना": "pakadna",

  "बारिश": "baarish",

  "पहले": "pehle",

  "आँसू": "aansu",
  "आंसू": "aansu",

  "पोछे": "poche",

  "मुस्कुराए": "muskuraaye",

  "मन": "mann",

  "सोचती": "sochti",

  "डूबी": "doobi",

  "बख़ूबी": "bakhoobi",
  "बखूबी": "bakhoobi",

  "दिल": "dil",

  "बुलाती": "bulaati",

  "चाहिए": "chahiye",

  "सब्र": "sabr",

  "पागल": "paagal",

  "अकेले": "akele",

  "थोड़ा": "thoda",

  "तेज़": "tez",
  "तेज": "tez",

  "गाने": "gaane",

  "बालों": "baalon",

  "सवेरा": "savera",

  "शराब": "sharaab",

  "बड़ी": "badi",

  "शराफ़त": "sharafat",
  "शराफत": "sharafat",

  "बाहर": "baahar",

  "नशा": "nasha",

  "नाम": "naam",

  "चमक": "chamak",

  "बचता": "bachta",

  "लाया": "laaya",

  "भगाकर": "bhagaakar",
};

function hasDevanagari(text: string) {
  return /[\u0900-\u097F]/.test(text);
}

function transliterateHindiWord(originalWord: string) {
  if (!hasDevanagari(originalWord)) {
    return originalWord;
  }

  // Remove punctuation temporarily so dictionary matching works.
  const prefixMatch = originalWord.match(
    /^[^\u0900-\u097FA-Za-z0-9]*/
  );

  const suffixMatch = originalWord.match(
    /[^\u0900-\u097FA-Za-z0-9]*$/
  );

  const prefix = prefixMatch?.[0] ?? "";
  const suffix = suffixMatch?.[0] ?? "";

  let word = originalWord
    .slice(
      prefix.length,
      originalWord.length - suffix.length
    )
    .normalize("NFC");

  if (WORD_OVERRIDES[word]) {
    return prefix + WORD_OVERRIDES[word] + suffix;
  }

  let result = "";

  for (let i = 0; i < word.length; i++) {
    let char = word[i];

    /*
      Handle consonant + nukta separately because some
      lyrics sources return decomposed characters.
    */
    if (
      CONSONANTS[char] &&
      word[i + 1] === "़"
    ) {
      const consonant =
        NUKTA_CONSONANTS[char] ??
        CONSONANTS[char];

      i++;

      const next = word[i + 1];

      if (next === "्") {
        result += consonant;
        i++;
        continue;
      }

      if (next && MATRAS[next] !== undefined) {
        result += consonant + MATRAS[next];
        i++;
        continue;
      }

      result += consonant + "a";
      continue;
    }

    if (CONSONANTS[char]) {
      const consonant = CONSONANTS[char];
      const next = word[i + 1];

      // Halant / virama = no vowel
      if (next === "्") {
        result += consonant;
        i++;
        continue;
      }

      // Explicit vowel matra
      if (
        next &&
        MATRAS[next] !== undefined
      ) {
        result += consonant + MATRAS[next];
        i++;
        continue;
      }

      // Hindi consonants have an inherent "a"
      result += consonant + "a";
      continue;
    }

    if (VOWELS[char] !== undefined) {
      result += VOWELS[char];
      continue;
    }

    if (MATRAS[char] !== undefined) {
      result += MATRAS[char];
      continue;
    }

    switch (char) {
      case "ं":
        result += "n";
        break;

      case "ँ":
        result += "n";
        break;

      case "ः":
        result += "h";
        break;

      case "ऽ":
        result += "'";
        break;

      case "़":
        break;

      case "्":
        break;

      case "।":
        result += ".";
        break;

      case "॥":
        result += ".";
        break;

      default:
        result += char;
        break;
    }
  }

  /*
    Hindi normally drops the final inherent "a".

    Examples:
    सहर  -> sahara -> sahar
    खबर  -> khabara -> khabar
    मगर  -> magara -> magar
  */
  if (
    result.length > 2 &&
    result.endsWith("a")
  ) {
    result = result.slice(0, -1);
  }

  /*
    General Hinglish cleanups.
  */
  result = result
    .replace(/ph(?=[aiueo])/g, "ph")
    .replace(/aa+/g, "aa")
    .replace(/ii+/g, "i")
    .replace(/uu+/g, "u")
    .replace(/nn+/g, "n");

  return prefix + result + suffix;
}

function hinglish(text: string) {
  if (!text) return "";

  if (!hasDevanagari(text)) {
    return text;
  }

  /*
    Split while PRESERVING spaces.
    This keeps lyrics formatting intact.
  */
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) {
        return part;
      }

      return transliterateHindiWord(part);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function hinglishMultiline(text: string | null) {
  if (!text) return null;

  return text
    .split("\n")
    .map((line) => hinglish(line))
    .join("\n");
}

function parseSyncedLyrics(
  syncedLyrics: string | null
) {
  if (!syncedLyrics) {
    return [];
  }

  return syncedLyrics
    .split("\n")
    .map((line) => {
      const match = line.match(
        /^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/
      );

      if (!match) {
        return null;
      }

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);

      const original = match[3].trim();

      const timeMs = Math.round(
        (minutes * 60 + seconds) * 1000
      );

      return {
        time_ms: timeMs,
        original,
        hinglish: hinglish(original),
      };
    })
    .filter(
      (
        line
      ): line is {
        time_ms: number;
        original: string;
        hinglish: string;
      } => line !== null
    );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const track =
      url.searchParams.get("track");

    const artist =
      url.searchParams.get("artist");

    const album =
      url.searchParams.get("album");

    const durationMs =
      url.searchParams.get("duration_ms");

    if (!track || !artist) {
      return Response.json(
        {
          error:
            "track and artist are required",
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
      params.set(
        "album_name",
        album
      );
    }

    if (durationMs) {
      const durationSeconds = Math.round(
        Number(durationMs) / 1000
      );

      if (
        !Number.isNaN(durationSeconds)
      ) {
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

    const data =
      await response.json();

    if (!response.ok) {
      return Response.json(
        data,
        {
          status: response.status,
        }
      );
    }

    const syncedLines =
      parseSyncedLyrics(
        data.syncedLyrics
      );

    const plainHinglish =
      hinglishMultiline(
        data.plainLyrics
      );

    return Response.json(
      {
        found: true,

        synced:
          syncedLines.length > 0,

        track: data.trackName,
        artist: data.artistName,
        album: data.albumName,

        instrumental:
          data.instrumental,

        /*
          Keep original lyrics in case
          we ever want Hindi mode later.
        */
        plainLyricsOriginal:
          data.plainLyrics,

        /*
          Main fallback shown by Cyberdeck
          when synced lyrics aren't available.
        */
        plainLyrics:
          plainHinglish,

        /*
          Main synced lyric data.
        */
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
        error:
          error?.message ??
          "Unknown lyrics error",
      },
      {
        status: 500,
      }
    );
  }
}