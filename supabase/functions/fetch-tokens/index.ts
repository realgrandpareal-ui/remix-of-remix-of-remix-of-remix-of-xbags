import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    if (type === 'trending') {
      // Trending tokens from DexScreener (top boosted on Solana)
      const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
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
          totalAmount: t.totalAmount || 0,
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
      // New tokens from bags.fm API
      const BAGS_API_KEY = Deno.env.get('BAGS_API_KEY');
      if (!BAGS_API_KEY) {
        console.error('BAGS_API_KEY not configured, falling back to DexScreener');
        return await fetchNewFromDexScreener();
      }

      try {
        const res = await fetch(`${BAGS_API_BASE}/coins?limit=5&sort=created_at&order=desc`, {
          headers: { 'x-api-key': BAGS_API_KEY },
        });

        const responseText = await res.text();
        console.log('bags.fm status:', res.status, 'response preview:', responseText.slice(0, 200));

        if (!res.ok || responseText.startsWith('<!') || responseText.startsWith('<')) {
          console.error('bags.fm returned non-JSON, falling back to DexScreener');
          return await fetchNewFromDexScreener();
        }

        const data = JSON.parse(responseText);
        const coins = data?.coins || data?.data || data?.tokens || (Array.isArray(data) ? data : []);
        const tokens = (Array.isArray(coins) ? coins : []).slice(0, 5).map((coin: any) => ({
          tokenAddress: coin.mint || coin.token_address || coin.address || '',
          icon: coin.image_url || coin.icon || coin.logo || null,
          name: coin.name || 'Unknown',
          symbol: coin.symbol || coin.ticker || null,
          priceUsd: coin.price_usd?.toString() || coin.price?.toString() || null,
          priceChange24h: coin.price_change_24h || coin.change_24h || null,
          marketCap: coin.market_cap || coin.mcap || null,
          url: coin.mint ? `https://bags.fm/token/${coin.mint}` : '#',
          createdAt: coin.created_at ? new Date(coin.created_at).getTime() : null,
        }));

        return new Response(JSON.stringify({ success: true, tokens, source: 'bags.fm' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('bags.fm fetch failed:', e);
        return await fetchNewFromDexScreener();
      }
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

// Fallback: fetch new tokens from DexScreener if bags.fm is unavailable
async function fetchNewFromDexScreener() {
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

  return new Response(JSON.stringify({ success: true, tokens: enriched, source: 'dexscreener_fallback' }), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
      'Content-Type': 'application/json',
    },
  });
}
