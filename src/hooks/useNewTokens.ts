import { useState, useEffect } from 'react';
import { BagsToken, parsePair, isBagsToken } from '../types/token';

export function useNewTokens(max = 20) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive] = useState(false);

  async function fetchNew() {
    try {
      const res = await window.fetch(
        'https://api.dexscreener.com/latest/dex/search?q=bags'
      );
      const data = await res.json();

      const newTokens = (data.pairs ?? [])
        .filter(isBagsToken)
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
