// Sean-fhaclan & Auld Sayins — daily push notification
//
// This is a Supabase Edge Function, a companion to send-daily-proverb.ts
// (which does the same job for email). Deploy it the same way:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "send-daily-push" → paste this whole file in → Deploy.
//
// Then add one secret (Edge Functions → send-daily-push → Secrets):
//   ONESIGNAL_REST_API_KEY — from your OneSignal dashboard: Settings → Keys & IDs
//   → "REST API Key". This is different from the App ID already in index.html —
//   the App ID is public/safe to embed in a browser, this REST key is NOT, which
//   is exactly why it lives here as a server-side secret instead.
//
// SUPABASE_URL and a service-level secret key are injected automatically by
// Supabase — see the comment in send-daily-proverb.ts for why getServiceKey()
// checks two possible env var names.
//
// Once deployed, put it on the same daily schedule as send-daily-proverb — see
// README "Push notifications and email".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Same App ID that's hardcoded into index.html's ONESIGNAL_APP_ID constant —
// it's public information (like a site's Google Analytics ID), not a secret,
// so it's fine to duplicate here rather than pull from an env var.
const ONESIGNAL_APP_ID = "2640bf1b-a55c-4819-ba51-3acde7c4b430";

function getServiceKey(): string {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed);
      const first = values.find((v) => typeof v === "string" && v.length > 0);
      if (first) return first as string;
    } catch (_e) {
      return secretKeys;
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase service key found — checked SUPABASE_SECRET_KEYS and SUPABASE_SERVICE_ROLE_KEY.");
}

// Mirrors the "Proverb of the Day" pool and pick-logic from index.html — keep
// this in sync with the same list in send-daily-proverb.ts and in index.html
// itself if you ever change FEATURED_IDS there.
const FEATURED = [
  { id: 1, scots: "Thay gang faur that disna meet ae day.", gaelic: "Coinnichidh na daoine far nach coinnich na cnuic.", english: "It's a small world." },
  { id: 2, scots: "It's a bare muir that ye gang throu and no find a heather cou.", gaelic: "Chan eil tuil air nach tig traoghadh.", english: "It's a long lane that has no turning." },
  { id: 3, scots: "The sowter's wife is aye the warst shod.", gaelic: "Is minig a bha droch bhròg air mnaoi griasaiche.", english: "The cobbler's wife is always the worst shod." },
  { id: 4, scots: "Better a moose in the pat nor nae flesh.", gaelic: "Is fheàrr an t-iasg na thig na làimh na dhà a' dol às.", english: "A bird in the hand is worth two in the bush." },
  { id: 5, scots: "A man o wirds but no o deeds is like a gairden fou wi weeds.", gaelic: "Is fheàrr obair na beul.", english: "Actions speak louder than words." }
];

function todaysProverb() {
  const now = new Date();
  const seed = now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate();
  return FEATURED[seed % FEATURED.length];
}

Deno.serve(async () => {
  const restKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!restKey) {
    return new Response(JSON.stringify({ error: "ONESIGNAL_REST_API_KEY is not set — add it under Edge Functions → send-daily-push → Secrets." }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getServiceKey()
  );

  // push_opt_in visitors are tagged in OneSignal with an "external user id"
  // equal to their Supabase user_id (see OneSignal.login() in index.html) —
  // that's what lets us target exactly this list in one call below.
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("user_id")
    .eq("push_opt_in", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subscribers || subscribers.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });
  }

  const externalIds = subscribers.map((s) => String(s.user_id));
  const proverb = todaysProverb();

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${restKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: externalIds,
      headings: { en: "Sean-fhaclan & Auld Sayins" },
      contents: { en: proverb.scots + "  ·  " + proverb.gaelic + "  ·  " + proverb.english },
      url: "https://dyknvh6gmm-ship-it.github.io/scots-gaelic-proverbs/"
    })
  });

  const oneSignalResponse = await res.json();

  return new Response(JSON.stringify({ ok: res.ok, total: externalIds.length, oneSignalResponse }), {
    status: res.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
});
