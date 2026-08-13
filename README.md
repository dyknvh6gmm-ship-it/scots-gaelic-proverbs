# Sean-fhaclan & Auld Sayins

A searchable Scots ⇄ Scottish Gaelic ⇄ English proverb app, installable as a mobile/desktop app. Plain HTML/CSS/JS — no build step, no external scripts, no internet connection required to run it.

## Files in this folder

- `index.html` — the whole app (styling, logic, and all 41 proverbs)
- `manifest.json` — makes it installable as an app
- `sw.js` — service worker, handles offline caching and (once connected) push notifications
- `icons/` — app icons used for the home-screen icon and install prompts
- `manager.html` — a form for adding new proverbs without editing code, see "Adding proverbs without editing code" below
- `grammar.html` — a second page: Gaelic phrases chosen for their grammar, see "The Grammar page" below
- `resources.html` — a third page: links to other Gaelic learning sites, see "The Resources page" below
- `about.html` — an editable About page with a bio and links section, see "The About page" below
- `gaelic-collection.html` — a curated set of Gaelic proverbs with English translations from a historical published collection, see "The Gaelic Collection page" below
- `scots-collection.html` — the same idea for Scots proverbs, from a different historical published collection, see "The Scots Collection page" below
- `my-account.html` — the members page: shows a logged-in visitor's saved favourites and a form to suggest a proverb, see "The My Account page" below
- `suggested-abairtean.html` — a public page listing community-suggested proverbs you've approved, see "The Suggested Abairtean page" below
- `geama.html` — "Am Facal," a daily Gaelic word-guessing game, login required — see "The Am Facal word game" below
- `supabase-schema.sql` — run once in your Supabase project to enable login, synced favourites, direct suggestions, the newsletter/push opt-ins, and the word game's stats, see "Accounts" below
- `supabase-function-send-daily-proverb.ts` — a Supabase Edge Function that emails the day's proverb to opted-in subscribers, see "Push notifications and email" below
- `supabase-function-send-daily-push.ts` — the same idea, but sends a push notification via OneSignal instead of an email, see "Push notifications and email" below
- `GAELIC_TRANSLATIONS_REVIEW.md` — every interface string in English and Gaelic, side by side, for you (or a fluent speaker) to check before the Gaelic UI goes live

The first four are needed together for the installable-app features to work — see "Installing as an app" below. `manager.html`, `grammar.html`, `resources.html`, `about.html`, `gaelic-collection.html`, `scots-collection.html`, `my-account.html`, `suggested-abairtean.html`, and `geama.html` should all be deployed alongside `index.html` (they link to each other and share `manifest.json`/icons), but aren't required for the proverb search itself to run. The review doc is just for you; it doesn't need to be deployed.

## Site structure

The site is now several pages sharing one look and a navigation bar (Home / My Account / Grammar / Gaelic Collection / Scots Collection / Suggested Abairtean / Am Facal / Resources / About) in the header of each — click between them like any normal website. `manager.html` is reachable too (a small "+ Add a proverb" link at the bottom of the Home page), but deliberately left out of the main nav since it's a tool for you, not visitors.

There's no shared template system — each `.html` file is fully self-contained, so the navigation bar's HTML is duplicated across `index.html`, `grammar.html`, `resources.html`, `about.html`, `gaelic-collection.html`, `scots-collection.html`, `my-account.html`, `suggested-abairtean.html`, and `geama.html`. If you ever want to change the nav (add a page, rename one), it needs updating in each file's `<nav class="site-nav">` block.

On phones, the nav bar scrolls horizontally left/right rather than wrapping, so it never overlaps the EN/GD toggle in the top-right corner — see "Mobile layout" below.

## The Resources page

`resources.html` lists other Gaelic learning sites, grouped under Courses & Lessons, Dictionaries & Reference, Listening & Media, and Organisations — nine to start: LearnGaelic, SpeakGaelic, Glossika's Scottish Gaelic course, blas. (a Celtic-languages app), Sabhal Mòr Ostaig, Am Faclair Beag, Omniglot's phrases page, BBC Radio nan Gàidheal's *Litir do Luchd-ionnsachaidh*, and Bòrd na Gàidhlig. All real, currently-live sites — I checked each one before adding it. (Duolingo's course was swapped out for Glossika and blas. at your request.)

To add more, open `resources.html`, copy one of the `<div class="res-card">` blocks under the relevant heading (or start a new `<div class="section-block">` for a new category), and edit the link, title, and description — there's also a note to this effect at the bottom of the page itself. Like Grammar and About, it has its own EN/GD toggle sharing the same saved preference as the rest of the site; the resource names and descriptions themselves stay in English in both modes, since most of the sites listed are English-medium learning resources.

## The Grammar page

`grammar.html` is a second collection, distinct from the Home page's proverbs: short Gaelic phrases chosen specifically for what they demonstrate about Gaelic grammar, particularly how pronouns fuse into prepositions (*air* + *mi* → *orm*, and similar). Each entry shows the phrase, a literal breakdown of what's fused together, the English meaning, and — only where a genuine equivalent exists — the Scots. Most don't have one, since this fused-pronoun structure is specifically Gaelic; that's expected, not a gap.

21 entries, grouped into five grammar patterns: air/on, aig/possession, "Ann, mu, le, ri" (other prepositional pronouns), Thoirt (verbal-noun idioms with *thoirt*), and the *Is fheàrr...na...* comparative. Two of these — "Ann, mu, le, ri" and Thoirt — mix more than one preposition, so they're split further into labelled subsections: Thoirt is *thoirt air* (to overcome / place upon), *thoirt le* (to take along), and *thoirt do* (to give to); "Ann, mu, le, ri" is split the same way, one subsection per preposition. That subsection pattern is the template for extending either category later — add a `"subcategory"` value to a new entry and it'll slot into (or start) its own labelled group automatically. Sourced mainly from LearnGaelic's Grammar Bites (the official Bòrd na Gàidhlig learning resource) and Omniglot's prepositional pronoun tables — cited per entry. One entry, *cudrom a thoirt air*, is your own contributed example; I noted that the more commonly documented form is *cudrom a chur air*, using the same structure with a different verb.

To add more entries, the data lives in the same kind of `<script type="application/json" id="grammar-data">` block as the Home page, near the top of `grammar.html` — same idea as editing `index.html`'s data, just a different file. (The proverb `manager.html` tool only knows about `index.html` for now — it won't help you add grammar entries. Tell me any new ones and I'll add them, or ask if you'd like a manager built for this page too.)

## The About page

`about.html` is a template — the bio text, name, and all four link entries are placeholders and won't mean anything until you personalise them. Open the file and look for:

- The "Your Name Here" heading and the tagline beneath it
- The bio paragraph under it
- The `links-list` block near the bottom — each `<a href="#">` is a placeholder link (website, email, Instagram, GitHub); replace the `#` with your real URL and edit the label, delete rows you don't want, or copy a row to add more

Tell me what you'd like it to say and I can fill it in for you instead, if you'd rather not edit HTML directly.

## The Gaelic Collection page

`gaelic-collection.html` is a curated set of 35 Gaelic proverbs with English translations, listed alphabetically (as the source book arranges them) rather than by theme. It's separate from the Home page's proverb database — a simpler, searchable list with its own EN/GD toggle sharing the site's saved language preference.

Sourced from *A Collection of Gaelic Proverbs and Familiar Phrases*, edited by Alexander Nicolson (1881), based on Donald Macintosh's original 1785 collection — one of the largest published Gaelic proverb collections, at nearly 4,000 entries. This page draws about three dozen from it, not the whole book, for the same reason the Home page's MacDonald-sourced entries are a selection: transcribing an entire published work wouldn't be drawing from a public-domain source, it'd be reproducing it. Each entry is cited to the book; a few carry extra notes where the original mentions a parallel Scots or English saying, or a bit of historical context.

To add more entries, the data lives in a `<script type="application/json" id="collection-data">` block near the top of the file — same format as the other pages' data blocks.

## The Scots Collection page

`scots-collection.html` is the same idea for Scots: 40 curated proverbs with plain-English glosses, alphabetically listed, EN/GD toggle included.

Sourced from *Scots Proverbs, Ancient and Modern, Selected from Allan Ramsay and Others* (Brechin: Alexander Black, 1834), built on the 18th-century collection assembled by the poet Allan Ramsay — over 700 sayings in the original, public domain in the US and digitised by Project Gutenberg. Again, this page is a generous selection (about forty entries), not the whole book. A number of these are recognisable as the earliest recorded Scots form of proverbs now used throughout the English-speaking world (e.g. "Rome was nae bigget in ae day," "Speak o' the deil and he'll appear") — that lineage is noted on the relevant cards.

Same data format as the Gaelic Collection page, in its own `<script type="application/json" id="collection-data">` block.

## The My Account page

`my-account.html` is the members hub — it only shows real content once someone's logged in (see "Accounts" below); logged-out visitors just see the login box. Once signed in, there are three cards:

- **Favourites** — every proverb they've favourited, pulled live from `index.html`'s proverb data (fetched and matched against their saved favourite IDs from Supabase) and shown the same way the Home page shows a proverb card.
- **Stay updated** — the email and push notification opt-ins, moved here from the bottom of the Home page (see "Push notifications and email" below) so all of a visitor's account settings live in one place instead of being split across pages.
- **Suggest a proverb** — a form for Scots / Gaelic / English text plus a meaning note, which writes straight to the `suggestions` table in your Supabase project (see "Reviewing suggestions" below) — the same underlying table the Home page's suggestion form already used, just a dedicated place for it now.

Nothing on this page needs editing by you — it reads everything live from Supabase and `index.html`.

## The Suggested Abairtean page

`suggested-abairtean.html` is a public page, no login required, listing community-submitted suggestions you've approved — searchable cards showing the Scots/Gaelic/English text, the meaning note, and who submitted it. It only ever shows suggestions with `status = 'approved'` in the `suggestions` table; anything still `pending` (or that you've left as-is) stays invisible to everyone but you.

This is deliberately a separate, moderated space from the main proverb database on the Home page — approving a suggestion here makes it publicly visible as a *suggested* Abairt (phrase), but does **not** add it to `index.html`'s proverb data. If you want a suggestion promoted to a full proverb card on the Home page, that's still a manual step: copy its details into `index.html`'s data the normal way (see "The data" below).

**To approve or remove a suggestion:** open your Supabase project → Table Editor → `suggestions`, find the row, and change its `status` column from `pending` to `approved` to publish it here, or back to `pending` (or delete the row) to pull it down. No admin login or extra page needed — the Table Editor is your moderation queue.

## The Am Facal word game

`geama.html` is a Wordle-style Gaelic word game: guess a five-letter Gaelic word in six tries, with tiles that turn green (right letter, right spot), amber (right letter, wrong spot), or grey (not in the word) after each guess — same mechanic as the game it's inspired by. Everyone gets the same word on the same calendar day, cycling through a 40-word list, so it works the same way as the site's own Proverb of the Day.

**Login is required to play** — the page shows only the login box until someone signs in (same magic-link flow as everywhere else on the site), then the game appears. That's by design, since the point is to grow your subscriber list: someone who logs in to play has an email address in your `subscribers` table, and once they're logged in they'll also see the "Stay updated" opt-ins on their My Account page if they haven't already turned those on.

**On-screen keyboard:** only the 18 letters of the traditional Gaelic alphabet are shown (no k, j, q, v, w, x, y, z), so there's no guesswork about which letters are even possible.

**One important limitation, stated on the page itself:** the game doesn't check whether a guess is a real Gaelic word — there's no full Gaelic dictionary wired in to validate against. You can type any five letters from the keyboard and get colour feedback against today's answer. This is a deliberate simplification for now; if you'd like proper word validation later (so nonsense guesses are rejected), that would need a much larger Gaelic word list than the answer pool alone.

**Streak and stats** (games played, games won, current streak, win %) are saved to a new `game_stats` table in your Supabase project — one row per visitor per game, so a future second game (a Spelling Bee has been discussed) can share the same table. Included in the current `supabase-schema.sql` — re-run the whole file if you already ran an earlier version.

**The word list** lives in a `<script type="application/json" id="wordle-words">` block near the top of `geama.html`, same editable-JSON pattern as the rest of the site's content — each entry is `{"word":"UISGE","en":"water"}`. All 40 words are common, everyday Gaelic vocabulary I'm fairly confident in, but — same caveat as everywhere else on this site — I'm not a fluent speaker, so it's worth a native check before you fully trust it; a wrong answer would make a puzzle unsolvable. There's more than a month of unique daily words before the list repeats; tell me if you'd like more added, or want to swap any of them out.

**Linked from the daily email:** the daily proverb email (see below) now includes a "Cluich Am Facal" button linking to this page, so subscribers have a reason to come back to the site beyond just reading the email.

## Run it

Just open `index.html` in a browser — double-click it, or drag it into a browser window. The core proverb search works fully offline. (The install/PWA features need it to be served over `https://`, so they only kick in once it's deployed — see below.)

## Deploy it as a real website

Any static host works:

- **Netlify Drop**: go to app.netlify.com/drop and drag the whole folder in — live in seconds.
- **GitHub Pages**: push all four items (`index.html`, `manifest.json`, `sw.js`, `icons/`) to a repo at the same folder level, enable Pages in repo settings, pointing at the root.
- **Vercel**: `vercel deploy` from this folder (or drag-and-drop via the dashboard).

No npm install, no build, no CDN — everything the app needs is in this folder.

## What's inside

- **Three-way language toggle**: search in Scots, Gàidhlig, or English, and see what the other two have to say on the same proverb.
- **Proverb of the Day carousel**: one featured proverb, the same for everyone on a given day, that rotates automatically and can be browsed manually.
- **Theme filter** and a **"recorded in all three languages"** filter.
- **Optional login** (magic-link email, via Supabase) — see "Accounts" below.
- **Favourites**, saved in your browser (localStorage), or synced to your account if you're logged in — with a dedicated **My Account** page listing them, see "The My Account page" above.
- **Random proverb** button.
- **Suggest a proverb** form (Scots / Gàidhlig / English fields) — saved locally and exportable as JSON always; sent straight to your Supabase project too if the visitor is logged in. Approved suggestions appear publicly on the **Suggested Abairtean** page, see above.
- **Installable as an app** (PWA) — see below.
- **Stay updated**: email + push notification opt-ins, tied to your account, on the My Account page — see "Push notifications and email" below.
- **Am Facal**: a daily Gaelic word-guessing game, login required to play — see "The Am Facal word game" above.
- **Interface language toggle (EN / GD)** — the app chrome (buttons, labels, hints) switches between English and Gaelic — see below.
- **Map of proverb origins** — a starter map with one confirmed location — see below.

## Interface language (EN / GD)

Small "EN / GD" toggle, top-right of the header — now on **every page** (Home, My Account, Grammar, Gaelic Collection, Scots Collection, Suggested Abairtean, Am Facal, Resources, About). It switches all the surrounding interface text — buttons, filters, form labels, headings, the site-nav link labels (Home ↔ Dachaigh, Grammar ↔ Gràmar, and so on), and the browser tab title — between English and Gaelic, and remembers your choice as you move between pages (stored in the browser under the key `sf-ui-lang`, shared across all files).

This is separate from the three proverb-language tabs (Scots / Gàidhlig / English), which are unaffected by this toggle. As you asked, those three tabs — and every place in the app that names one of the three proverb languages — always read **Beurla Ghallda** (Scots), **Gàidhlig**, and **Beurla** (English), regardless of which interface language is active.

On the Grammar page, switching to GD does one extra thing: each card gets small Gaelic labels — "Mìneachadh:" (explanation) in front of the breakdown, and "Beurla:" (English) in front of the meaning — so the card reads as Gaelic-led rather than English-led. The grammar explanations themselves stay in English in both modes, since translating the teaching content would work against the point of a page for English-speaking learners; only the framing swaps.

**Please review the Gaelic before relying on it.** I'm not a fluent Gaelic speaker — the translations are a careful best effort, not a checked one. `GAELIC_TRANSLATIONS_REVIEW.md` lists every interface string (across all three pages now) in English next to my Gaelic, with a blank column for corrections. Send me any fixes (in chat is easiest) and I'll update the relevant file to match exactly.

To add a translated string yourself: on `index.html`, find the relevant `data-i18n="key"` attribute, then find that same key in the `I18N` object further down the file (search for `var I18N = {`) and edit the `"gd"` value. `grammar.html` and `about.html` use the same `I18N` pattern but without `data-i18n` attributes — the JS sets `textContent`/`innerHTML` on a few named elements directly, so search for `var I18N = {` in each file and edit the `gd` values there.

## Map: where the proverbs are from

Near the bottom of the page there's a small section with an embedded OpenStreetMap view. It currently shows exactly one pin — the one you gave me:

- **Duine an dòras bhon taobh eile** — Steòrnabhagh (Stornoway), Eilean Leòdhais (Isle of Lewis), contributed by you.

This is a genuine test case, not a placeholder: it's stored as an `"origin"` field on that proverb's entry in the data (`lat`, `lng`, `place`, `contributedBy`, and `status: "approved"`). Only entries with `"status": "approved"` are shown on the map, which is what keeps this honest — nothing appears until it's been reviewed.

**Current limitation:** the map is built with a simple embedded OpenStreetMap iframe rather than a full JS mapping library, so it can only display one pin cleanly for now. This was a deliberate choice — a proper multi-pin interactive map (using something like Leaflet) needs a JS library bundled in a way I couldn't fully verify in this environment, and I didn't want to ship something untested. If you'd like several pins with individual popups once you have more confirmed locations, tell me and I'll build that properly (either by sourcing Leaflet correctly or another tested approach).

### Suggesting new locations

There's a "Suggest where a proverb is from" form below the map. Right now, like the other forms, it only saves submissions in the visitor's own browser (with an export-to-JSON button) — it is **not yet a real moderation queue** you can see and approve from anywhere. That needs a place for submissions to land that only you control. Two realistic options, both free:

- **Google Sheets** — simplest to set up. A Google Form (or a small Apps Script web endpoint) writes each submission as a new row in a spreadsheet you own. You add an "Approved?" column and tick things off yourself. To publish approved pins, you'd copy the confirmed rows' details to me (or directly into the `origin` fields in `index.html`) and I redeploy the change. Manual, but dead simple and needs no technical maintenance.
- **Supabase** — a proper free-tier hosted database with a built-in table editor, closer to a real admin dashboard (you could literally flip a status dropdown from "pending" to "approved" in their UI). More powerful, but needs a bit more setup (an account, a table, and careful configuration of what the public form is allowed to do).

Tell me which you'd like and I'll wire the form to submit there instead of just localStorage — that's the last piece needed to make this a real, growing, moderated map.

## Mobile layout

**Nav bar overlap fix:** on Grammar, the two Collection pages, My Account, Suggested Abairtean, Am Facal, Resources, and About, the site nav (Home / My Account / Grammar / Gaelic Collection / Scots Collection / Suggested Abairtean / Am Facal / Resources / About) sits in the same header row as the EN/GD toggle, which is pinned to the top-right corner. On a narrow phone screen there wasn't room for both, and the nav used to wrap onto a second line, colliding with the toggle. It's now a horizontally-scrollable strip instead (swipe left/right to see all the links), with space reserved on the right so it never renders underneath the toggle.

### Bottom bar (Home page)

On phone-sized screens (roughly 640px wide or narrower — covers virtually all phones, whether the site is open in a browser tab or installed as an app), the language toggle and the Random/About buttons move from the top of the page down to a fixed bar at the bottom of the screen, closer to how native apps place their navigation. The rest of the page (search, filters, results) stays where it was; only that one row relocates.

I built this with a runtime check rather than fixed pixel guesses, since I couldn't test it on an actual phone: the app measures the real height of that bottom bar in the visitor's browser and pads the page content, and repositions the install banner, to match — so it should hold up even if the bar wraps to two lines on a very narrow phone or in Gaelic (where "About & sources" translates to a longer phrase). Still, this is the one part of this update I'd genuinely appreciate you checking on your own phone — if anything overlaps or looks cramped, tell me what you're seeing and I'll adjust it.

## Installing as an app (PWA)

The site now has a `manifest.json`, a service worker (`sw.js`), and icons in `icons/`, which together let people "install" it to their phone or desktop like a real app — it gets its own icon, opens full-screen, and works offline once visited.

**Deploying it:** upload the whole folder (not just `index.html`) — you need `manifest.json`, `sw.js`, and the `icons/` folder alongside it, all at the same level in your repo, for this to work. If any of those return a 404 on your live site, the install prompt won't appear.

**The install banner:** on a phone, first-time visitors see a banner at the bottom of the screen inviting them to install. On Android/Chrome it triggers the real "Install app" prompt; on iOS Safari (which doesn't support that), it shows instructions to tap Share → "Add to Home Screen," since Apple only allows that manual path. If someone dismisses the banner, it won't reappear for 14 days (tracked in their browser's local storage).

### Push notifications and email — now tied to accounts

The old separate "leave your email" box and browser-only push scaffolding have been replaced by a **"Stay updated"** card on the **My Account** page, with two toggles — "Email me the proverb of the day" and "Send push notifications." It only shows up once someone's logged in (see Accounts, below) — the whole card is hidden for signed-out visitors, same as the Favourites and Suggest cards on that page. Both write straight to your Supabase project instead of sitting in the visitor's browser.

**Email**, via **Resend** (free tier, 3,000 emails/month) and a scheduled Supabase Edge Function:

1. Create a free account at resend.com and grab an API key (Dashboard → API Keys).
2. Deploy `supabase-function-send-daily-proverb.ts` as an Edge Function: Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor" → name it `send-daily-proverb` → paste in the whole file → Deploy. (Already deployed it before? The file now also includes a button linking to the Am Facal game — paste the updated version in over your existing function's code and re-deploy to pick that up.)
3. Add your Resend key as a secret on that function: Edge Functions → `send-daily-proverb` → Secrets → add `RESEND_API_KEY`.
4. Schedule it to run once a day: Database → Cron Jobs (or Integrations → Cron) → new job → target it at the `send-daily-proverb` Edge Function → pick a time (e.g. 8am). If your dashboard doesn't show a Cron Jobs option in that exact spot, tell me what you do see and I'll give you the equivalent `pg_cron` SQL instead.

The function emails everyone with `newsletter_opt_in = true` in the new `subscribers` table (created by the updated `supabase-schema.sql` — re-run that whole file if you already ran an earlier version, it's safe to repeat) using the same day-of-year rotation as the site's own Proverb of the Day. It sends from `onboarding@resend.dev`, which works immediately with no domain setup; once you've verified your own domain in Resend you can swap that for a nicer from-address.

**Push**, via **OneSignal** (free) — already fully wired up, App ID included, nothing left to do here. The remaining piece is scheduling the actual daily send, done the same way as email:

1. Deploy `supabase-function-send-daily-push.ts` as a second Edge Function: Supabase dashboard → Edge Functions → Deploy a new function → "Via Editor" → name it `send-daily-push` → paste in the whole file → Deploy.
2. Grab your **REST API Key** from OneSignal: Settings → Keys & IDs → "REST API Key." (Different from the App ID — the App ID is public and already in `index.html`; this REST key is a real secret and must never go in client-side code, which is why it only lives in this function.)
3. Add it as a secret on that function: Edge Functions → `send-daily-push` → Secrets → add `ONESIGNAL_REST_API_KEY`.
4. Schedule it the same way as `send-daily-proverb` (see below) — same cron setup, just pointed at `send-daily-push` instead. You can run both on the same schedule.

This function targets everyone with `push_opt_in = true` in one call, using the "external user ID" tag OneSignal already applies when someone logs in and flips the push toggle (that's what `OneSignal.login()` in `index.html` is doing).

Once all of this is wired up, logging in and switching the toggles on is all a visitor needs to do — no separate signup forms, no exporting JSON files by hand, and both channels send automatically once a day.

## Accounts: login, synced favourites, and direct suggestions

There's now a small login box at the top of the Home page, above the Proverb of the Day carousel. It's backed by **Supabase** (a free-tier hosted database + auth service) — your project URL and public "anon" key are already wired into `index.html`. This key is meant to be public (same idea as a Stripe "publishable" key); it doesn't grant access to anything by itself. Actual access is controlled by row-level security rules in the database, set up in `supabase-schema.sql`, so a visitor can only ever read or write their own rows — never anyone else's.

**What it does:**

- **Login** is passwordless — a visitor enters their email, gets a "magic link," clicks it, and they're signed in. No passwords for you or them to manage.
- **Favourites**, once logged in, are saved to their account instead of just their browser — so the same favourites show up if they come back on a different device. Anything they'd favourited locally before logging in gets carried over automatically the first time they sign in.
- **Suggestions**, once logged in, still show up locally (same "Save suggestion" / export flow as before) but are *also* sent straight to your Supabase project — visible to you immediately in the Table Editor, no waiting for someone to export and send you a JSON file. Logged-in visitors can also submit from a dedicated form on the **My Account** page.
- Visitors who don't log in still get the exact same local-only behaviour the site always had (favourites in their browser only, suggestions exportable as JSON) — logging in is optional, not required to use the site.

**Two things you need to do once, in your Supabase dashboard, for this to work live:**

1. **Run the schema.** Open `supabase-schema.sql` in this folder, copy the whole thing, and paste it into Supabase → SQL Editor → New query → Run. This creates the `favourites`, `suggestions`, and `subscribers` tables with the row-level security rules described above. Safe to re-run even if you ran an earlier version already.
2. **Set your Site URL.** Supabase needs to know it's allowed to redirect a magic-link click back to your actual site. Go to Authentication → URL Configuration, and set the Site URL (and add to Redirect URLs) to your deployed site's address, e.g. `https://dyknvh6gmm-ship-it.github.io/scots-gaelic-proverbs/index.html`. Without this step, magic links will send but the redirect back to the site will fail.

Note: login only works on the *deployed* site (served over `https://`), not when you open `index.html` straight from a folder on your computer — magic-link redirects need a real URL to send people back to.

**Reviewing suggestions:** open your Supabase project → Table Editor → `suggestions`. Every submission from a logged-in visitor lands there with a `status` of `pending`; change it to `approved` and it immediately becomes publicly visible on the **Suggested Abairtean** page (`suggested-abairtean.html`) — the schema includes a row-level security policy that only exposes `approved` rows to the public, everything else stays visible to you alone. Approving a suggestion this way does *not* add it to the main proverb database — if you want it to become a full proverb card on the Home page too, that's still a separate manual step: copy it into `index.html`'s proverb data by hand (see "The data" below). Set the `status` back to `pending`, or delete the row, to remove it from the public page.

If you'd rather this arrived as an email each time instead of (or as well as) sitting in a table, that's a further step — Supabase can call a webhook on every new row, which a free service like Zapier or a small Supabase Edge Function can turn into an email. Tell me if you want that wired up too.

## Adding proverbs without editing code

Open `manager.html` (there's also a small "+ Add a proverb" link at the bottom of the site itself). It's a self-contained form:

1. Upload your current `index.html` (drag it in, or click to choose it) — this happens entirely in your browser, nothing is sent anywhere.
2. Fill in the proverb — theme, whichever of Scots/Gaelic/English you have, source, and optionally a map location.
3. Click "Add proverb & download updated index.html" — you get back a new `index.html` with your proverb added, correctly formatted, ID assigned automatically.
4. Deploy it the normal way (drag into Netlify's Deploys tab, or upload to GitHub).

You can add several proverbs in one sitting — after each download, the page keeps going with the updated list as its new baseline, so you don't need to re-upload between entries. It also gives a gentle warning if what you're adding looks like a near-duplicate of something already in the list, though it won't stop you.

This page is unlisted (not linked from anywhere except the site's own footer) but not password-protected, since the site has no backend to check a password against. In practice that's low-risk: anyone who found the URL could only generate a downloadable file for themselves — they can't push changes to your actual live site without your Netlify/GitHub access.

## The data

All 106 proverbs live in the `<script type="application/json" id="proverb-data">` block near the top of `index.html`. To add or edit entries, edit that JSON array directly — each entry looks like:

```json
{
  "id": 107,
  "theme": "Money & Value",
  "scots": { "text": "...", "gloss": "plain-English meaning" },
  "gaelic": { "text": "...", "gloss": "plain-English meaning" },
  "english": { "text": "...", "gloss": "plain-English meaning" },
  "source": "where this came from",
  "origin": { "place": "Town, Region", "lat": 0.0, "lng": 0.0, "contributedBy": "Name", "status": "pending" }
}
```

Set any of `"scots"`, `"gaelic"`, or `"english"` to `null` if you don't have that language for an entry — the app will show "no equivalent recorded yet" for that slot rather than hiding the whole card. The `"origin"` field is optional and only used for the map — leave it off entirely for proverbs without a known place of origin, and only set `"status": "approved"` once you're confident it should be public.

### On accuracy

5 of the first 41 entries are recorded in **all three languages** — proverbs judged, by meaning, to carry the same wisdom across Scots, Gaelic, and English. They are not word-for-word translations of one another; each is a genuinely separate, traditional saying. Most other entries include an English proverb too (many Scots and Gaelic proverbs turn out to have a well-known English equivalent — that's noted per-card as "standard English proverb" vs. a plain-English rendering when no fixed English saying matches). Where a language genuinely has no documented equivalent, that's shown honestly rather than invented.

One entry (Duine an dòras bhon taobh eile) is different from the rest: it's a community-contributed local saying from you, not from a published collection, and is labelled as such in its source line.

Entries 42–106 come from T. D. MacDonald's *Gaelic Proverbs and Proverbial Sayings* (1926) — a public-domain collection digitised by the National Library of Scotland on archive.org. Several pair the Gaelic with an English (and in one case, Scots) equivalent straight from the book itself; the rest use a plain English rendering where no fixed proverb matched closely enough. One (id 48) is flagged in `GAELIC_TRANSLATIONS_REVIEW.md` as an OCR-uncertain reconstruction worth double-checking.

This is a selection from the book, not the whole thing. The book runs to roughly 172 pages and several hundred proverbs across seven parts; adding literally all of them would mean transcribing an entire published work into this dataset rather than drawing from it, which isn't something this project does even for a public-domain source. If you want more from it later, I'm happy to keep pulling further batches — just say so.

Sources are cited per-card and summarised in the app's "About & sources" panel: scots-online.org (Andy Eagle); Wikiquote's Scottish Gaelic proverbs page (drawing on Alexander Nicolson 1882, Edward Dwelly 1911, Gyula Paczolay 1997, BBC Alba's *Litir do Luchd-ionnsachaidh*); Lingalot's Scottish Gaelic proverbs guide; and T. D. MacDonald's *Gaelic Proverbs and Proverbial Sayings* (1926, archive.org).

This is a starter set, built to be extended — the suggestion form and the plain-JSON data format are meant to make that easy.
