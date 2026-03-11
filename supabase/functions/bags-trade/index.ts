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
      const quoteResponse = params.quoteResponse;
      const userPublicKey = params.userPublicKey;

      if (!quoteResponse || !userPublicKey) {
        throw new Error('Missing quoteResponse or userPublicKey');
      }

      const txParams = new URLSearchParams({
        userPublicKey: String(userPublicKey),
        requestId: String(quoteResponse.requestId),
        contextSlot: String(quoteResponse.contextSlot),
        inAmount: String(quoteResponse.inAmount),
        inputMint: String(quoteResponse.inputMint),
        outAmount: String(quoteResponse.outAmount),
        outputMint: String(quoteResponse.outputMint),
        minOutAmount: String(quoteResponse.minOutAmount),
        otherAmountThreshold: String(quoteResponse.otherAmountThreshold),
        priceImpactPct: String(quoteResponse.priceImpactPct),
        slippageBps: String(quoteResponse.slippageBps),
        simulatedComputeUnits: String(quoteResponse.simulatedComputeUnits),
      });

      const txResponse = await fetch(`${BAGS_API_BASE}/trade/swap?${txParams.toString()}`, {
        method: 'GET',
        headers: {
          'x-api-key': BAGS_API_KEY,
        },
      });

      const txText = await txResponse.text();
      let txData: any;
      try {
        txData = JSON.parse(txText);
      } catch {
        throw new Error(`bags.fm API non-JSON response (status ${txResponse.status}): ${txText.slice(0, 500)}`);
      }

      // Log actual API response for debugging
      console.log('Bags API status:', txResponse.status);
      console.log('Bags API response:', JSON.stringify(txData));

      if (!txResponse.ok) {
        throw new Error(`bags.fm API error (status ${txResponse.status}): ${JSON.stringify(txData)}`);
      }

      if (!txData?.success) {
        throw new Error(txData?.response || txData?.error || 'Transaction failed');
      }

      return new Response(
        JSON.stringify({
          success: true,
          response: { transaction: txData?.response?.transaction },
          transaction: txData?.response?.transaction,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
