import { useState, useEffect } from 'react';
import { BagsToken, parsePair, isBagsToken } from '../types/token';

export function useTrendingTokens() {
  const [tokens, setTokens]     = useState<BagsToken[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdated, setLast]  = useState<Date | null>(null);

  async function fetchTrending() {
    setLoading(true);
    try {
      const res  = await window.fetch(
        'https://api.dexscreener.com/latest/dex/search?q=bags'
      );
      const data = await res.json();

      const trending = (data.pairs ?? [])
        .filter(isBagsToken)
        .map(parsePair)
        .filter((t: BagsToken) => t.volume6h > 0)
        .sort((a: BagsToken, b: BagsToken) => b.volume6h - a.volume6h)
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
