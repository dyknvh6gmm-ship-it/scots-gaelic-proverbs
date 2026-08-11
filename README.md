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
- `GAELIC_TRANSLATIONS_REVIEW.md` — every interface string in English and Gaelic, side by side, for you (or a fluent speaker) to check before the Gaelic UI goes live

The first four are needed together for the installable-app features to work — see "Installing as an app" below. `manager.html`, `grammar.html`, `resources.html`, and `about.html` should all be deployed alongside `index.html` (they link to each other and share `manifest.json`/icons), but aren't required for the proverb search itself to run. The review doc is just for you; it doesn't need to be deployed.

## Site structure

The site is now several pages sharing one look and a navigation bar (Home / Grammar / Resources / About) in the header of each — click between them like any normal website. `manager.html` is reachable too (a small "+ Add a proverb" link at the bottom of the Home page), but deliberately left out of the main nav since it's a tool for you, not visitors.

There's no shared template system — each `.html` file is fully self-contained, so the navigation bar's HTML is duplicated across `index.html`, `grammar.html`, `resources.html`, and `about.html`. If you ever want to change the nav (add a page, rename one), it needs updating in each file's `<nav class="site-nav">` block.

## The Resources page

`resources.html` lists other Gaelic learning sites, grouped under Courses & Lessons, Dictionaries & Reference, Listening & Media, and Organisations — eight to start: LearnGaelic, SpeakGaelic, Duolingo's Scottish Gaelic course, Sabhal Mòr Ostaig, Am Faclair Beag, Omniglot's phrases page, BBC Radio nan Gàidheal's *Litir do Luchd-ionnsachaidh*, and Bòrd na Gàidhlig. All real, currently-live sites — I checked each one before adding it.

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
- **Favourites**, saved in your browser (localStorage).
- **Random proverb** button.
- **Suggest a proverb** form (Scots / Gàidhlig / English fields) — saved locally, exportable as JSON so you can fold new entries into the dataset.
- **Installable as an app** (PWA) — see below.
- **Newsletter signup** — see below.
- **Interface language toggle (EN / GD)** — the app chrome (buttons, labels, hints) switches between English and Gaelic — see below.
- **Map of proverb origins** — a starter map with one confirmed location — see below.

## Interface language (EN / GD)

Small "EN / GD" toggle, top-right of the header — now on **every page** (Home, Grammar, About). It switches all the surrounding interface text — buttons, filters, form labels, headings, and so on — between English and Gaelic, and remembers your choice as you move between pages (stored in the browser under the key `sf-ui-lang`, shared across all three files).

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

## Mobile layout: bottom bar

On phone-sized screens (roughly 640px wide or narrower — covers virtually all phones, whether the site is open in a browser tab or installed as an app), the language toggle and the Random/About buttons move from the top of the page down to a fixed bar at the bottom of the screen, closer to how native apps place their navigation. The rest of the page (search, filters, results) stays where it was; only that one row relocates.

I built this with a runtime check rather than fixed pixel guesses, since I couldn't test it on an actual phone: the app measures the real height of that bottom bar in the visitor's browser and pads the page content, and repositions the install banner, to match — so it should hold up even if the bar wraps to two lines on a very narrow phone or in Gaelic (where "About & sources" translates to a longer phrase). Still, this is the one part of this update I'd genuinely appreciate you checking on your own phone — if anything overlaps or looks cramped, tell me what you're seeing and I'll adjust it.

## Installing as an app (PWA)

The site now has a `manifest.json`, a service worker (`sw.js`), and icons in `icons/`, which together let people "install" it to their phone or desktop like a real app — it gets its own icon, opens full-screen, and works offline once visited.

**Deploying it:** upload the whole folder (not just `index.html`) — you need `manifest.json`, `sw.js`, and the `icons/` folder alongside it, all at the same level in your repo, for this to work. If any of those return a 404 on your live site, the install prompt won't appear.

**The install banner:** on a phone, first-time visitors see a banner at the bottom of the screen inviting them to install. On Android/Chrome it triggers the real "Install app" prompt; on iOS Safari (which doesn't support that), it shows instructions to tap Share → "Add to Home Screen," since Apple only allows that manual path. If someone dismisses the banner, it won't reappear for 14 days (tracked in their browser's local storage).

### Push notifications

The service worker is wired up to *receive and display* push notifications (see the `push` and `notificationclick` handlers in `sw.js`) — but nothing is currently sending them. A static site can't send a scheduled "here's today's proverb" push on its own; that needs a push provider account, which only you can create. The easiest free options:

- **OneSignal** — free tier, hosted dashboard, drop in their JS snippet, schedule sends (including recurring ones) from their web dashboard. No server code required.
- **Firebase Cloud Messaging** — free, more manual setup, good if you're already in the Google ecosystem.

Once you've picked one and have an account, tell me and I can wire the subscription logic into the app (asking permission, registering the device) — the receiving side in `sw.js` is already in place.

## Newsletter signup

There's a "Get the proverb of the day by email" box near the bottom of the page. Right now it only saves emails locally in each visitor's browser (not sent anywhere) — there's an "export" link that appears once someone's signed up, letting you download the saved addresses as JSON.

To actually collect and send emails for real, connect the form to a mailing list provider — this needs your own free account with one of these, since I can't create accounts on your behalf:

- **Formspree** (simplest) — create a form, get an endpoint URL, then change `#newsletter-form`'s behavior in `index.html` to POST to it instead of saving locally.
- **Buttondown** or **Mailchimp** — both have embeddable signup forms/snippets you can drop in as a replacement for the current form.

Tell me which one you set up and I'll wire the form to it.

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
