// Cloudflare Pages Function
// Erreichbar unter: https://fuyuv.me/api/precursor?ign=SPIELERNAME
//
// Der Hypixel API Key wird NIEMALS an den Browser geschickt. Er lebt nur
// hier auf dem Server (als Environment Variable HYPIXEL_API_KEY, siehe
// Anleitung) und wird nur für den Request an Hypixel benutzt.

const PART_NAME_MAP = {
  SyntheticHeart: ["SYNTHETIC_HEART"],
  SuperliteMotor: ["SUPERLITE_MOTOR"],
  RobotronReflector: ["ROBOTRON_REFLECTOR"],
  FTX3070: ["FTX_3070", "FTX3070"],
  ElectronTransmitter: ["ELECTRON_TRANSMITTER"],
  ControlSwitch: ["CONTROL_SWITCH"],
};

function findSackCount(sacks, candidates) {
  if (!sacks) return 0;
  for (const key of Object.keys(sacks)) {
    // tolerant: ignoriert Unterschiede bei Unterstrichen/Groß-Kleinschreibung
    const normalized = key.toUpperCase().replace(/_/g, "");
    if (candidates.some((c) => c.replace(/_/g, "") === normalized)) {
      return sacks[key] || 0;
    }
  }
  return 0;
}

// Die Hypixel-API wurde 2024 grundlegend umstrukturiert - der genaue Pfad
// von sacks_counts im Profil kann sich seitdem verändert haben oder in
// Zukunft nochmal ändern. Statt einen festen Pfad zu raten, durchsuchen
// wir das komplette Member-Objekt rekursiv nach dem Feld, egal wie tief
// es verschachtelt ist. Das macht die Function robust gegen künftige
// Umstrukturierungen der API.
function deepFindSacksCounts(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  for (const [key, value] of Object.entries(obj)) {
    if (key.toLowerCase() === "sacks_counts" && value && typeof value === "object") {
      return value;
    }
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = deepFindSacksCounts(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      // nur deine eigene Seite darf das Ergebnis per fetch() lesen
      "access-control-allow-origin": "https://fuyuv.me",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ign = (url.searchParams.get("ign") || "").trim();

  // Minecraft-Namen: 1-16 Zeichen, nur Buchstaben/Zahlen/Unterstrich
  if (!/^[A-Za-z0-9_]{1,16}$/.test(ign)) {
    return json({ success: false, error: "Ungültiger Spielername." }, 400);
  }

  if (!env.HYPIXEL_API_KEY) {
    return json(
      { success: false, error: "Server ist nicht korrekt konfiguriert (HYPIXEL_API_KEY fehlt)." },
      500
    );
  }

  // 1. Name -> UUID (offizielle Mojang-Schnittstelle, kein Key nötig)
  let uuid;
  try {
    const mojangRes = await fetch(
      `https://api.minecraftservices.com/minecraft/profile/lookup/name/${encodeURIComponent(ign)}`
    );
    if (!mojangRes.ok) {
      const bodyText = await mojangRes.text().catch(() => "");
      return json(
        {
          success: false,
          error: `Spieler "${ign}" wurde nicht gefunden.`,
          debugMojangStatus: mojangRes.status,
          debugMojangBody: bodyText.slice(0, 300),
        },
        404
      );
    }
    const mojangData = await mojangRes.json();
    uuid = mojangData.id;
  } catch (e) {
    return json({ success: false, error: "Mojang-API war nicht erreichbar." }, 502);
  }

  // 2. SkyBlock-Profile von Hypixel holen
  let profiles;
  try {
    const hyRes = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${uuid}`, {
      headers: { "API-Key": env.HYPIXEL_API_KEY },
    });
    const hyData = await hyRes.json();
    if (!hyData.success) {
      return json({ success: false, error: hyData.cause || "Hypixel-API-Fehler." }, 502);
    }
    profiles = hyData.profiles;
  } catch (e) {
    return json({ success: false, error: "Hypixel-API war nicht erreichbar." }, 502);
  }

  if (!profiles || profiles.length === 0) {
    return json({ success: false, error: "Keine SkyBlock-Profile für diesen Spieler gefunden." }, 404);
  }

  // aktuell ausgewähltes Profil nehmen, sonst das erste
  const profile = profiles.find((p) => p.selected) || profiles[0];
  const member = profile.members ? profile.members[uuid] : null;

  if (!member) {
    return json(
      { success: false, error: "Kein Zugriff auf die Profildaten. API-Einstellungen im Spiel aktiv? (/api)" },
      403
    );
  }

  const sacks = deepFindSacksCounts(member);

  if (!sacks) {
    return json(
      {
        success: false,
        error:
          "Sack-Inhalte sind nicht sichtbar. Im Spiel unter SkyBlock-Menü -> API-Einstellungen bitte 'Inventar' aktivieren.",
      },
      403
    );
  }

  const counts = {};
  for (const [key, candidates] of Object.entries(PART_NAME_MAP)) {
    counts[key] = findSackCount(sacks, candidates);
  }

  const totalFound = Object.values(counts).reduce((a, b) => a + b, 0);
  const result = {
    success: true,
    ign,
    profileName: profile.cute_name || profile.profile_id,
    counts,
  };

  // Diagnosehilfe: wenn wir Sack-Daten haben, aber keiner unserer 6 Teile
  // gematcht hat, zeigen wir ein paar echte Schlüssel zum Abgleich - so
  // sieht man sofort, falls Hypixel die Item-IDs mal wieder geändert hat,
  // statt nur stillschweigend überall 0 zu bekommen.
  if (totalFound === 0) {
    result.debugSampleKeys = Object.keys(sacks).slice(0, 15);
  }

  return json(result);
}
