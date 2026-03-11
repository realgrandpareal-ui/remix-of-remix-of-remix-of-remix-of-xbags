import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  
  console.log(`[bags-trade] ${options?.method || 'GET'} ${url} → status ${res.status}, preview: ${text.slice(0, 200)}`);
  
  if (!res.ok || text.startsWith('<!') || text.startsWith('<')) {
    throw new Error(`bags.fm API error (status ${res.status}): ${text.slice(0, 200)}`);
  }
  
  return JSON.parse(text);
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

    const { action, ...params } = await req.json();

    if (action === 'quote') {
      const queryParams = new URLSearchParams({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount.toString(),
        slippageMode: params.slippageMode || 'auto',
      });
      if (params.slippageBps) {
        queryParams.set('slippageBps', params.slippageBps.toString());
      }

      const data = await safeFetch(`${BAGS_API_BASE}/trade/quote?${queryParams}`, {
        method: 'GET',
        headers: { 'x-api-key': BAGS_API_KEY },
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'transaction') {
      const data = await safeFetch(`${BAGS_API_BASE}/trade/transaction`, {
        method: 'POST',
        headers: {
          'x-api-key': BAGS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: params.quoteResponse,
          userPublicKey: params.userPublicKey,
        }),
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Keep legacy swap action for backwards compatibility
    if (action === 'swap') {
      const data = await safeFetch(`${BAGS_API_BASE}/trade/transaction`, {
        method: 'POST',
        headers: {
          'x-api-key': BAGS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: params.quoteResponse,
          userPublicKey: params.userPublicKey,
        }),
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use "quote" or "transaction"' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[bags-trade] Error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
