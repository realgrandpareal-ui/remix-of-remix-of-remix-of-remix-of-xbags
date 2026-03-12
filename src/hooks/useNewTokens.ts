import { useState, useEffect } from 'react';
import { BagsToken, parsePair } from '../types/token';

export function useNewTokens(max = 20) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive] = useState(false);

  async function fetchNew() {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dexscreener-screener?type=new-bags`;
      const res = await window.fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();

      const newTokens = (json.pairs ?? [])
        .filter((p: any) => p.chainId === 'solana')
        .map(parsePair)
        .sort((a: BagsToken, b: BagsToken) => b.pairCreatedAt - a.pairCreatedAt)
        .slice(0, max);

      setTokens(newTokens);
    } catch (e) {
      console.error('New tokens fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNew();
    const id = setInterval(fetchNew, 30_000);
    return () => clearInterval(id);
  }, [max]);

  return { tokens, isLive, isLoading };
}
