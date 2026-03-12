import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildWsUrl(type: string): string {
  if (type === "new-bags") {
    return "wss://io.dexscreener.com/dex/screener/pairs/h24/1?rankBy[key]=pairAge&rankBy[order]=asc&filters[chainIds][0]=solana&filters[dexIds][0]=bags";
  }
  // default: trending across all Solana
  return "wss://io.dexscreener.com/dex/screener/pairs/h1/1?rankBy[key]=trendingScoreH1&rankBy[order]=desc&filters[chainIds][0]=solana";
}

function fetchViaWebSocket(url: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      try {
        ws.close();
      } catch {}
      reject(new Error("timeout"));
    }, 8000);

    ws.onmessage = (event) => {
      try {
        const raw =
          typeof event.data === "string" ? event.data : String(event.data);
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          clearTimeout(timeout);
          try {
            ws.close();
          } catch {}
          resolve(data);
        }
      } catch {
        // ignore non-JSON messages, wait for next
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("ws_error"));
    };

    ws.onclose = (ev) => {
      clearTimeout(timeout);
      if (!ev.wasClean) {
        reject(new Error("ws_closed"));
      }
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "trending";

  try {
    const wsUrl = buildWsUrl(type);
    console.log(`Fetching ${type} from DexScreener WebSocket...`);
    const pairs = await fetchViaWebSocket(wsUrl);
    console.log(`Got ${pairs.length} pairs`);

    return new Response(JSON.stringify({ pairs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`WebSocket failed for ${type}:`, error);

    // Fallback: use search API
    try {
      console.log("Falling back to search API...");
      const res = await fetch(
        "https://api.dexscreener.com/latest/dex/search?q=bags"
      );
      const data = await res.json();
      return new Response(JSON.stringify({ pairs: data.pairs ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fallbackErr) {
      return new Response(
        JSON.stringify({ error: String(fallbackErr), pairs: [] }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
});
