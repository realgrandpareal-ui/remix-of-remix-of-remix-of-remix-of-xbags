import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();

  console.log(`[bags-trade] ${options?.method || 'GET'} ${url}`);
  console.log(`[bags-trade] status: ${res.status}`);
  console.log(`[bags-trade] FULL response: ${text}`);

  if (text.startsWith('<!') || text.startsWith('<html')) {
    throw new Error(`bags.fm returned HTML (status ${res.status}) — wrong endpoint or method`);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`bags.fm non-JSON (status ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    throw new Error(`bags.fm error (status ${res.status}): ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BAGS_API_KEY = Deno.env.get('BAGS_API_KEY');
    if (!BAGS_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'BAGS_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    console.log(`[bags-trade] action: ${action}`);

    // ─── QUOTE → GET ──────────────────────────────────────
    if (action === 'quote') {
      const queryParams = new URLSearchParams({
        inputMint:    params.inputMint,
        outputMint:   params.outputMint,
        amount:       params.amount.toString(),
        slippageMode: params.slippageMode || 'auto',
      });
      if (params.slippageBps) queryParams.set('slippageBps', params.slippageBps.toString());

      const data = await safeFetch(`${BAGS_API_BASE}/trade/quote?${queryParams}`, {
        method: 'GET',
        headers: { 'x-api-key': BAGS_API_KEY },
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── SWAP → GET with query params ─────────────────────
    if (action === 'swap') {
      const q = params.quoteResponse;

      const swapParams = new URLSearchParams({
        userPublicKey:         params.userPublicKey,
        requestId:             q.requestId,
        contextSlot:           String(q.contextSlot),
        inAmount:              q.inAmount,
        inputMint:             q.inputMint,
        outAmount:             q.outAmount,
        outputMint:            q.outputMint,
        minOutAmount:          q.minOutAmount,
        otherAmountThreshold:  q.otherAmountThreshold,
        priceImpactPct:        q.priceImpactPct,
        slippageBps:           String(q.slippageBps),
        simulatedComputeUnits: String(q.simulatedComputeUnits),
      });

      if (q.routePlan)   swapParams.set('routePlan',   JSON.stringify(q.routePlan));
      if (q.platformFee) swapParams.set('platformFee', JSON.stringify(q.platformFee));

      const data = await safeFetch(`${BAGS_API_BASE}/trade/swap?${swapParams}`, {
        method: 'GET',
        headers: { 'x-api-key': BAGS_API_KEY },
      });

      console.log(`[bags-trade] swap response keys: ${JSON.stringify(Object.keys(data?.response || {}))}`);

      // Check all possible transaction field names
      const txData = data?.response;
      const txString =
        txData?.transaction        ??
        txData?.swapTransaction    ??
        txData?.tx                 ??
        txData?.serializedTx       ??
        txData?.encodedTransaction ??
        null;

      if (!txString) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No transaction field found in response',
          debug_response: data,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, transaction: txString }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "quote" or "swap"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bags-trade] Error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
