# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
node server.js
# Open http://localhost:3000
```

No build step, no dependencies to install — pure Node.js stdlib + vanilla JS frontend.

## Architecture

Two files, no framework:

- **`server.js`** — Minimal Node.js HTTP server (no npm deps). Serves `index.html` on all routes and exposes one endpoint: `GET /proxy?url=<encoded-url>` which fetches the RSS feed server-side (following redirects) to bypass CORS restrictions.
- **`index.html`** — Self-contained single-page app with all CSS and JS inline. No bundler, no framework.

### Data flow

1. User searches → direct browser fetch to iTunes Search API (`itunes.apple.com/search`)
2. User selects a podcast → `loadFeed(feedUrl)` fetches via local proxy (`/proxy?url=...`) to bypass CORS
3. Raw XML response is parsed client-side with `DOMParser` and rendered into the DOM

### Key frontend functions

- `searchPodcasts()` — iTunes API search, renders dropdown results
- `loadFeed(feedUrl)` — Fetches RSS via proxy, triggers `renderFeed()`
- `renderFeed(xml)` — Parses XML, populates show header and episode list
- `xmlText(el, tag)` / `xmlAttr(el, tag, attr)` — Namespace-aware XML helpers
