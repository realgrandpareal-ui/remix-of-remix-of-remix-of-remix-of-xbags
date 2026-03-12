import { useState, useEffect } from 'react';
import { BagsToken, parsePair } from '../types/token';

export function useTrendingTokens() {
  const [tokens, setTokens]     = useState<BagsToken[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdated, setLast]  = useState<Date | null>(null);

  async function fetchTrending() {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dexscreener-screener?type=trending`;
      const res = await window.fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();

      const trending = (json.pairs ?? [])
        .filter((p: any) => p.chainId === 'solana')
        .map(parsePair)
        .slice(0, 10);

      setTokens(trending);
      setLast(new Date());
    } catch (e) {
      console.error('Trending error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrending();
    const id = setInterval(fetchTrending, 30_000);
    return () => clearInterval(id);
  }, []);

  return { tokens, isLoading, lastUpdated };
}
