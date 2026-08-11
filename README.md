# Sean-fhaclan & Auld Sayins

A searchable Scots ⇄ Scottish Gaelic proverb app. Single file, no build step.

## Run it

Just open `index.html` in a browser — double-click it, or drag it into a browser window. It works offline.

## Deploy it as a real website

Any static host works, since it's one self-contained HTML file:

- **Netlify Drop**: go to app.netlify.com/drop and drag `index.html` in — live in seconds.
- **GitHub Pages**: push this file to a repo, enable Pages in repo settings, pointing at the root.
- **Vercel**: `vercel deploy` from this folder (or drag-and-drop via the dashboard).

No npm install, no build — the app loads React, Babel, and Tailwind from CDNs at runtime.

## What's inside

- **Toggle search**: switch between "Scots → Gàidhlig" and "Gàidhlig → Scots".
- **Theme filter** and a **"has confirmed equivalent"** filter.
- **Favourites**, saved in your browser (localStorage).
- **Random proverb** button.
- **Suggest a proverb** form — saved locally, exportable as JSON so you can fold new entries into the dataset.

## The data

All 40 proverbs live in the `<script type="application/json" id="proverb-data">` block near the top of `index.html`. To add or edit entries, edit that JSON array directly — each entry looks like:

```json
{
  "id": 41,
  "theme": "Money & Value",
  "linked": false,
  "scots": { "text": "...", "gloss": "plain-English meaning" },
  "gaelic": { "text": "...", "gloss": "plain-English meaning" },
  "source": "where this came from"
}
```

Set `"scots"` or `"gaelic"` to `null` if you only have one side. Set `"linked": true` only when both sides are a genuine matched pair (not just two proverbs that happen to sit in the same entry).

### On accuracy

5 of the 40 entries are **matched pairs** — a Scots proverb and a Gaelic proverb judged, by meaning, to carry the same wisdom. They are not translations of each other; Scots and Gaelic are two distinct traditions, and most proverbs in one don't have a documented counterpart in the other. The remaining 35 entries are real, sourced proverbs in a single language, clearly marked as not (yet) having a confirmed equivalent — rather than forcing weak or invented matches.

Sources are cited per-card and summarised in the app's "About & sources" panel: scots-online.org (Andy Eagle); Wikiquote's Scottish Gaelic proverbs page (drawing on Alexander Nicolson 1882, Edward Dwelly 1911, Gyula Paczolay 1997, BBC Alba's *Litir do Luchd-ionnsachaidh*); and Lingalot's Scottish Gaelic proverbs guide.

This is a starter set, built to be extended — the suggestion form and the plain-JSON data format are meant to make that easy.
