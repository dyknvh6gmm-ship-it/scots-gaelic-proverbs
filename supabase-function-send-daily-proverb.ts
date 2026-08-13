// Sean-fhaclan & Auld Sayins — daily newsletter email
//
// This is a Supabase Edge Function. Deploy it via:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "send-daily-proverb" → paste this whole file in → Deploy.
//
// Then add one secret (Edge Functions → send-daily-proverb → Secrets):
//   RESEND_API_KEY — get this free from resend.com (see README "Push notifications
//   and email" section for the full walkthrough).
//
// SUPABASE_URL and a service-level secret key are injected automatically by
// Supabase into every Edge Function — you don't need to set those yourself.
// Supabase has two generations of this: newer projects expose
// SUPABASE_SECRET_KEYS (a JSON dictionary), older ones expose
// SUPABASE_SERVICE_ROLE_KEY (a single JWT string). getServiceKey() below checks
// both, so this works either way.
//
// Once deployed, schedule it to run once a day — see README for how, using
// Supabase's built-in Cron Jobs feature.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getServiceKey(): string {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed);
      const first = values.find((v) => typeof v === "string" && v.length > 0);
      if (first) return first as string;
    } catch (_e) {
      // Not JSON — treat the raw env value as the key itself.
      return secretKeys;
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase service key found — checked SUPABASE_SECRET_KEYS and SUPABASE_SERVICE_ROLE_KEY.");
}

// Mirrors the "Proverb of the Day" pool and pick-logic from index.html (the five
// proverbs recorded in all three languages, ids 1–5, rotating by date). If you
// change FEATURED_IDS or the wording of these five in index.html, update this
// list to match so the email and the website agree on "today's" proverb.
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
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY is not set — add it under Edge Functions → send-daily-proverb → Secrets." }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getServiceKey()
  );

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email")
    .eq("newsletter_opt_in", true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!subscribers || subscribers.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });
  }

  const proverb = todaysProverb();
  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2b2320;">
      <h2 style="color:#5b2a86; margin-bottom: 4px;">Sean-fhaclan &amp; Auld Sayins</h2>
      <p style="font-size:0.8rem; color:#a3691f; text-transform:uppercase; letter-spacing:0.04em; margin: 16px 0 2px;">Beurla Ghallda</p>
      <p style="font-size:1.15rem; margin: 0;">${proverb.scots}</p>
      <p style="font-size:0.8rem; color:#5b2a86; text-transform:uppercase; letter-spacing:0.04em; margin: 16px 0 2px;">Gàidhlig</p>
      <p style="font-size:1.15rem; margin: 0;">${proverb.gaelic}</p>
      <p style="font-size:0.8rem; color:#0065bd; text-transform:uppercase; letter-spacing:0.04em; margin: 16px 0 2px;">Beurla</p>
      <p style="font-size:1.15rem; margin: 0;">${proverb.english}</p>
      <p style="font-size:0.75rem; color:#888; margin-top: 28px;">You're getting this because you opted in on Sean-fhaclan & Auld Sayins. Log in and turn off "Email me the proverb of the day" any time to stop.</p>
    </div>
  `;

  let sent = 0;
  for (const sub of subscribers) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // "onboarding@resend.dev" works immediately with no setup, on Resend's
        // free tier — good to start with. Once you've verified your own domain
        // in Resend, swap this for something like "proverbs@yourdomain.com".
        from: "Sean-fhaclan <onboarding@resend.dev>",
        to: sub.email,
        subject: "Today's proverb — Sean-fhaclan & Auld Sayins",
        html
      })
    });
    if (res.ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: subscribers.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
});
