import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    if (type === 'trending') {
      // Get top boosted tokens on Solana
      const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
      const data = await res.json();
      
      // Filter for Solana tokens and take top 5
      const solanaTokens = (data || [])
        .filter((t: any) => t.chainId === 'solana')
        .slice(0, 5)
        .map((t: any) => ({
          tokenAddress: t.tokenAddress,
          icon: t.icon || null,
          name: t.description || t.tokenAddress?.slice(0, 6),
          symbol: t.header || null,
          url: t.url || `https://dexscreener.com/solana/${t.tokenAddress}`,
          totalAmount: t.totalAmount || 0,
        }));

      // Fetch price data for each token
      const enriched = await Promise.all(
        solanaTokens.map(async (token: any) => {
          try {
            const priceRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${token.tokenAddress}`);
            const priceData = await priceRes.json();
            const pair = priceData?.[0];
            return {
              ...token,
              name: pair?.baseToken?.name || token.name,
              symbol: pair?.baseToken?.symbol || token.symbol,
              priceUsd: pair?.priceUsd || null,
              priceChange24h: pair?.priceChange?.h24 || null,
              volume24h: pair?.volume?.h24 || null,
              marketCap: pair?.marketCap || pair?.fdv || null,
              icon: pair?.info?.imageUrl || token.icon,
            };
          } catch {
            return token;
          }
        })
      );

      return new Response(JSON.stringify({ success: true, tokens: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'new') {
      // Get latest token profiles
      const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
      const data = await res.json();
      
      const solanaTokens = (data || [])
        .filter((t: any) => t.chainId === 'solana')
        .slice(0, 5)
        .map((t: any) => ({
          tokenAddress: t.tokenAddress,
          icon: t.icon || null,
          name: t.description || t.tokenAddress?.slice(0, 6),
          symbol: t.header || null,
          url: t.url || `https://dexscreener.com/solana/${t.tokenAddress}`,
        }));

      const enriched = await Promise.all(
        solanaTokens.map(async (token: any) => {
          try {
            const priceRes = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${token.tokenAddress}`);
            const priceData = await priceRes.json();
            const pair = priceData?.[0];
            return {
              ...token,
              name: pair?.baseToken?.name || token.name,
              symbol: pair?.baseToken?.symbol || token.symbol,
              priceUsd: pair?.priceUsd || null,
              priceChange24h: pair?.priceChange?.h24 || null,
              marketCap: pair?.marketCap || pair?.fdv || null,
              icon: pair?.info?.imageUrl || token.icon,
              createdAt: pair?.pairCreatedAt || null,
            };
          } catch {
            return token;
          }
        })
      );

      return new Response(JSON.stringify({ success: true, tokens: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
