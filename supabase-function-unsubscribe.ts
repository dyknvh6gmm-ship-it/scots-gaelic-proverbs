// Sean-fhaclan & Auld Sayins — one-click email unsubscribe
//
// This is a Supabase Edge Function. Deploy it via:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "unsubscribe" → paste this whole file in → Deploy.
//
// No new secret needed — it reuses RESEND_API_KEY (already set for
// send-daily-proverb / send-blog-email) as the signing key for unsubscribe
// tokens, purely so we don't have to add yet another secret for this.
//
// Why this function exists: Gmail and Yahoo's 2024 bulk-sender rules require
// a one-click List-Unsubscribe link (RFC 8058) on recurring mail like the
// daily proverb email, or it's much more likely to land in spam/junk. This
// endpoint is that link's target — no login required, works straight from
// the email. send-daily-proverb.ts and send-blog-email.ts both link to it
// via a per-subscriber signed token (so a stranger can't unsubscribe someone
// else just by guessing their email address).
//
// This function must NOT require Supabase's own JWT auth (unlike the
// send-blog-* functions) — mail clients hit it directly with no Authorization
// header at all. Make sure "Verify JWT" is left OFF for this function in
// Supabase (Edge Functions → unsubscribe → Settings), same as the two daily
// send functions.

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
      return secretKeys;
    }
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase service key found — checked SUPABASE_SECRET_KEYS and SUPABASE_SERVICE_ROLE_KEY.");
}

// Same token scheme used by send-daily-proverb.ts / send-blog-email.ts to
// build the unsubscribe link — keep these in sync if you ever change this.
async function hmacToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — Sean-fhaclan &amp; Auld Sayins</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #faf6ef; color: #2b2320; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
  .card { max-width: 420px; }
  h1 { color: #5b2a86; font-size: 1.3rem; margin-bottom: 12px; }
  p { line-height: 1.5; }
  a { color: #5b2a86; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p><a href="https://www.gaelicwithsteve.com/">Back to Sean-fhaclan &amp; Auld Sayins</a></p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const rawEmail = url.searchParams.get("email") || "";
  const token = url.searchParams.get("token") || "";
  const email = decodeURIComponent(rawEmail).trim().toLowerCase();

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(page("Something went wrong", "This link isn't working right now — please try again later."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const expected = await hmacToken(email, resendKey);

  if (!email || !token || token !== expected) {
    return new Response(page("Link not valid", "That unsubscribe link looks invalid or has expired. You can also turn off emails any time by logging in and visiting My Account."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getServiceKey()
  );

  const { error } = await supabase
    .from("subscribers")
    .update({ newsletter_opt_in: false })
    .eq("email", email);

  if (error) {
    return new Response(page("Something went wrong", "We couldn't process that just now — please try again, or log in and turn it off from My Account."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // Gmail/Yahoo's one-click unsubscribe (RFC 8058) sends a silent POST with
  // body "List-Unsubscribe=One-Click" — the mail client never shows the
  // response, so just confirm quickly with no HTML needed.
  if (req.method === "POST") {
    return new Response("OK", { status: 200 });
  }

  return new Response(
    page("You're unsubscribed", "You won't get the daily proverb email any more. Sorry to see you go — you can turn it back on any time from My Account."),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
});
