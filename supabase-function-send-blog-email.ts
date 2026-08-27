// Sean-fhaclan & Auld Sayins — send a specific blog post out as email
//
// This is a Supabase Edge Function, a companion to send-daily-proverb.ts but
// triggered on demand from blog-admin.html (right after you publish a post
// and confirm "send as email?") instead of running on a daily schedule.
// Deploy it the same way:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "send-blog-email" → paste this whole file in → Deploy.
//
// Reuses the RESEND_API_KEY secret already set for send-daily-proverb — no
// extra secret needed if that's already configured.
//
// Unlike send-daily-proverb.ts (no auth needed — anyone/anything can trigger
// it on a schedule), this one is only meant to be called from blog-admin.html
// by you. It checks the caller's Supabase auth token and refuses to run for
// anyone but the admin account.
//
// Because this is called directly from the browser (blog-admin.html), it
// needs to handle CORS itself — the browser sends a pre-flight OPTIONS
// request before the real POST, and without a proper response to that,
// the whole call silently fails client-side with "Failed to fetch".
//
// Deliverability note: this also sends a List-Unsubscribe header (RFC 8058
// one-click unsubscribe) pointing at the "unsubscribe" Edge Function, plus a
// plain-text body alongside the HTML one — same reasoning as
// send-daily-proverb.ts. Deploy supabase-function-unsubscribe.ts as
// "unsubscribe" for the link to actually work.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "contact@gaelicwithsteve.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

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

// Same token scheme used by supabase-function-unsubscribe.ts to verify the
// link — keep these in sync if you ever change this.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return json({ error: "RESEND_API_KEY is not set — add it under Edge Functions → send-blog-email → Secrets (or copy it from send-daily-proverb if already set there)." }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return json({ error: "Missing Authorization header." }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    getServiceKey()
  );

  // Verify the caller is actually the site admin before sending anything.
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user || userData.user.email !== ADMIN_EMAIL) {
    return json({ error: "Not authorised." }, 403);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {
    return json({ error: "Expected a JSON body with slug, title, excerpt." }, 400);
  }

  const slug = String(body.slug || "").trim();
  const title = String(body.title || "").trim();
  const excerpt = String(body.excerpt || "").trim();
  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : "";
  if (!slug || !title) {
    return json({ error: "slug and title are required." }, 400);
  }

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email")
    .eq("newsletter_opt_in", true);

  if (error) {
    return json({ error: error.message }, 500);
  }
  if (!subscribers || subscribers.length === 0) {
    return json({ sent: 0, total: 0 });
  }

  const postUrl = `https://www.gaelicwithsteve.com/blog.html#post=${encodeURIComponent(slug)}`;
  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="" style="width:100%;max-width:480px;border-radius:12px;margin:0 0 20px;display:block;" />`
    : "";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2b2320;">
      <h2 style="color:#5b2a86; margin-bottom: 4px;">Sean-fhaclan &amp; Auld Sayins</h2>
      <p style="font-size:0.75rem; color:#a3691f; text-transform:uppercase; letter-spacing:0.06em; margin: 4px 0 18px;">New on the blog</p>
      ${imageHtml}
      <h3 style="font-size:1.25rem; margin: 0 0 10px;">${title}</h3>
      <p style="line-height:1.6; color:#444; margin: 0 0 22px;">${excerpt}</p>
      <p>
        <a href="${postUrl}" style="display:inline-block; background:#5b2a86; color:#fff; text-decoration:none; padding:10px 20px; border-radius:999px; font-family:-apple-system,sans-serif; font-size:0.85rem; font-weight:600;">Read the full post</a>
      </p>
      <p style="font-size:0.75rem; color:#888; margin-top: 24px;">You're getting this because you opted in on Sean-fhaclan &amp; Auld Sayins. Log in and turn off "Email me the proverb of the day" any time to stop, or use the unsubscribe link below.</p>
    </div>
  `;

  let sent = 0;
  for (const sub of subscribers) {
    const unsubToken = await hmacToken(sub.email, resendKey);
    const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${unsubToken}`;
    const text = `Sean-fhaclan & Auld Sayins — New on the blog\n\n${title}\n\n${excerpt}\n\nRead the full post: ${postUrl}\n\nUnsubscribe: ${unsubUrl}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Sean-fhaclan <contact@gaelicwithsteve.com>",
        to: sub.email,
        subject: `New post: ${title}`,
        html,
        text,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        }
      })
    });
    if (res.ok) sent++;
  }

  return json({ sent, total: subscribers.length });
});
