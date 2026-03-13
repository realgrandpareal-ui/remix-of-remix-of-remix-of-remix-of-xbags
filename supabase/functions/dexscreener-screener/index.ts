import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const normalizeType = (value: string | null | undefined) =>
  value === "new-bags" ? "new-bags" : "trending";

function buildUrls(type: string): { http: string; ws: string } {
  const base = "io.dexscreener.com/dex/screener/pairs";

  if (type === "new-bags") {
    const params =
      "rankBy[key]=pairAge&rankBy[order]=asc&filters[chainIds][0]=solana&filters[dexIds][0]=bags&filters[maxLaunchpadProgress][max]=99.99&filters[launchpads][0]=1";
    return {
      http: `https://${base}/h24/1?${params}`,
      ws: `wss://${base}/h24/1?${params}`,
    };
  }

  const params =
    "rankBy[key]=trendingScoreH24&rankBy[order]=desc&filters[chainIds][0]=solana";
  return {
    http: `https://${base}/h24/1?${params}`,
    ws: `wss://${base}/h24/1?${params}`,
  };
}

async function fetchViaHttp(url: string): Promise<unknown[] | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Origin: "https://dexscreener.com",
        "User-Agent": UA,
      },
    });
    console.log(`HTTP ${url} → ${res.status}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    if (data?.pairs && Array.isArray(data.pairs)) return data.pairs;
    return null;
  } catch (e) {
    console.error("HTTP fetch failed:", e);
    return null;
  }
}

function fetchViaWebSocket(url: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {
        // noop
      }
      reject(new Error("timeout"));
    }, 8000);

    ws.onmessage = (event) => {
      try {
        const raw = typeof event.data === "string" ? event.data : String(event.data);
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          clearTimeout(timeout);
          try {
            ws.close();
          } catch {
            // noop
          }
          resolve(data);
        }
      } catch {
        // ignore, wait for next message
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("ws_error"));
    };

    ws.onclose = (ev) => {
      clearTimeout(timeout);
      if (!ev.wasClean) reject(new Error("ws_closed"));
    };
  });
}

async function fallbackSearch(type: string): Promise<unknown[]> {
  const query = type === "new-bags" ? "bags" : "solana";
  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${query}`);
  const data = await res.json();
  return data.pairs ?? [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let type = normalizeType(url.searchParams.get("type"));

  if (!url.searchParams.get("type") && req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.json();
      type = normalizeType(body?.type);
    } catch {
      // ignore invalid body
    }
  }

  const { http, ws } = buildUrls(type);

  let pairs: unknown[] | null = null;

  pairs = await fetchViaHttp(http);

  if (!pairs) {
    try {
      console.log(`Trying WebSocket for ${type}...`);
      pairs = await fetchViaWebSocket(ws);
    } catch (e) {
      console.error("WebSocket failed:", e);
    }
  }

  if (!pairs || pairs.length === 0) {
    console.log("Falling back to search API...");
    pairs = await fallbackSearch(type);
  }

  return new Response(JSON.stringify({ pairs }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
