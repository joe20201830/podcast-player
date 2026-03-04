# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

**Production:** https://joe-podcast-player.joe96207.workers.dev

**Locally:**
```bash
node server.js
# Open http://localhost:3000
```

No build step, no npm dependencies for the frontend — pure Node.js stdlib + vanilla JS.

## Deployment

**Frontend (`index.html`)** — push to GitHub, Cloudflare auto-redeploys:
```bash
git add index.html
git commit -m "your message"
git push
```

**Worker (`worker/src/index.js`)** — push to GitHub, then manually redeploy:
```bash
cd worker
wrangler deploy
```

**Cloudflare resources:**
- Pages (frontend): `joe-podcast-player.joe96207.workers.dev`
- Worker (API): `podcast-player.joe96207.workers.dev`
- D1 database: `podcast-player` (id: `4385692c-b85a-451c-97e4-9d9712c25e0e`)

## Architecture

Three main pieces, no framework:

- **`server.js`** — Local-only Node.js server for development. Serves `index.html` and proxies RSS feeds to bypass CORS. Not used in production.
- **`index.html`** — Self-contained single-page app with all CSS and JS inline. No bundler, no framework.
- **`worker/src/index.js`** — Cloudflare Worker. Handles `/proxy` (RSS fetch) and `/shows` CRUD API backed by D1. Deployed via `wrangler deploy`.

### Data flow

1. User searches → direct browser fetch to iTunes Search API (`itunes.apple.com/search`)
2. User selects a podcast → `loadFeed(feedUrl)` fetches via Worker proxy (`/proxy?url=...`) to bypass CORS
3. Raw XML response is parsed client-side with `DOMParser` and rendered into the DOM
4. User saves a show → `POST /shows` to Worker with `device_id` (UUID in localStorage) + feed metadata → stored in D1
5. On page load → `GET /shows?device_id=...` fetches saved shows for this device

### Key frontend functions

- `searchPodcasts()` — iTunes API search, renders dropdown results
- `loadFeed(feedUrl)` — Fetches RSS via proxy, triggers `renderFeed()`
- `renderFeed(xml)` — Parses XML, populates show header and episode list
- `xmlText(el, tag)` / `xmlAttr(el, tag, attr)` — Namespace-aware XML helpers
