// Sean-fhaclan & Auld Sayins — send a specific blog post out as a push notification
//
// Companion to send-daily-push.ts, but triggered on demand from blog-admin.html
// (right after you publish a post and confirm "send as push?") instead of
// running on a daily schedule. Deploy it the same way:
//   Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor"
//   → name it "send-blog-push" → paste this whole file in → Deploy.
//
// Reuses the ONESIGNAL_REST_API_KEY secret already set for send-daily-push —
// no extra secret needed if that's already configured.
//
// Unlike send-daily-push.ts (no auth needed), this one is only meant to be
// called from blog-admin.html by you. It checks the caller's Supabase auth
// token and refuses to run for anyone but the admin account.
//
// Because this is called directly from the browser (blog-admin.html), it
// needs to handle CORS itself — the browser sends a pre-flight OPTIONS
// request before the real POST, and without a proper response to that,
// the whole call silently fails client-side with "Failed to fetch".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "contact@gaelicwithsteve.com";

// Same App ID that's hardcoded into index.html's ONESIGNAL_APP_ID constant —
// it's public information (like a site's Google Analytics ID), not a secret.
const ONESIGNAL_APP_ID = "2640bf1b-a55c-4819-ba51-3acde7c4b430";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  const restKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!restKey) {
    return json({ error: "ONESIGNAL_REST_API_KEY is not set — add it under Edge Functions → send-blog-push → Secrets (or copy it from send-daily-push if already set there)." }, 500);
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
  if (!slug || !title) {
    return json({ error: "slug and title are required." }, 400);
  }

  const postUrl = `https://www.gaelicwithsteve.com/blog.html#post=${encodeURIComponent(slug)}`;

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${restKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Subscribed Users"],
      headings: { en: `New post: ${title}` },
      contents: { en: excerpt || "Have a read on the blog." },
      url: postUrl
    })
  });

  const oneSignalResponse = await res.json();

  return json({ ok: res.ok, oneSignalResponse }, res.ok ? 200 : 500);
});
