const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── RSS PROXY ──────────────────────────────────────────────
    if (url.pathname === "/proxy") {
      const target = url.searchParams.get("url");
      if (!target) return json({ error: "Missing url param" }, 400);
      return fetchRss(target);
    }

    // ── SHOWS API ──────────────────────────────────────────────
    if (url.pathname === "/shows") {
      if (request.method === "GET") {
        const deviceId = url.searchParams.get("device_id");
        if (!deviceId) return json({ error: "Missing device_id" }, 400);

        const { results } = await env.DB.prepare(
          "SELECT feed_url, name, author, artwork_url, saved_at FROM shows WHERE device_id = ? ORDER BY saved_at DESC"
        ).bind(deviceId).all();

        return json(results);
      }

      if (request.method === "POST") {
        const body = await request.json().catch(() => null);
        if (!body?.device_id || !body?.feed_url) return json({ error: "Missing fields" }, 400);

        await env.DB.prepare(
          "INSERT OR IGNORE INTO shows (device_id, feed_url, name, author, artwork_url) VALUES (?, ?, ?, ?, ?)"
        ).bind(body.device_id, body.feed_url, body.name ?? null, body.author ?? null, body.artwork_url ?? null).run();

        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        const body = await request.json().catch(() => null);
        if (!body?.device_id || !body?.feed_url) return json({ error: "Missing fields" }, 400);

        await env.DB.prepare(
          "DELETE FROM shows WHERE device_id = ? AND feed_url = ?"
        ).bind(body.device_id, body.feed_url).run();

        return json({ ok: true });
      }
    }

    return json({ error: "Not found" }, 404);
  },
};

// ── HELPERS ────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function fetchRss(targetUrl, depth = 0) {
  if (depth > 5) return new Response("Too many redirects", { status: 502, headers: CORS_HEADERS });

  let response;
  try {
    response = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (podcast-player)" },
      redirect: "manual",
    });
  } catch {
    return new Response("Upstream error", { status: 502, headers: CORS_HEADERS });
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) return fetchRss(location, depth + 1);
  }

  return new Response(response.body, {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "text/xml; charset=utf-8" },
  });
}
