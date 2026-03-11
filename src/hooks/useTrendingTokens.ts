import { useState, useEffect } from 'react';
import { type TokenCard, fmtPrice, fmtMC, fmtAge, isBags } from './useNewTokens';

export function useTrendingTokens() {
  const [tokens, setTokens]     = useState<TokenCard[]>([]);
  const [isLoading, setLoading] = useState(true);

  async function fetchTrending() {
    setLoading(true);
    try {
      const res  = await window.fetch(
        'https://api.dexscreener.com/latest/dex/search?q=bags'
      );
      const data = await res.json();

      const trending: TokenCard[] = (data.pairs ?? [])
        .filter(isBags)
        .filter((p: any) => (p.priceChange?.h24 ?? 0) > 0)
        .map((p: any) => {
          const pct = p.priceChange?.h24 ?? 0;
          const age = Date.now() - (p.pairCreatedAt ?? 0);
          return {
            mint:           p.baseToken?.address  ?? '',
            name:           p.baseToken?.name     ?? 'Unknown',
            symbol:         p.baseToken?.symbol   ?? '???',
            image:          p.info?.imageUrl      ?? '',
            priceUsd:       fmtPrice(parseFloat(p.priceUsd ?? '0')),
            priceChangePct: pct,
            priceChangeStr: `↑ ${pct.toFixed(2)}%`,
            marketCap:      fmtMC(p.marketCap ?? p.fdv ?? 0),
            ageMs:          age,
            ageStr:         fmtAge(age),
            isNew:          false,
          } as TokenCard;
        })
        .sort((a: TokenCard, b: TokenCard) => b.priceChangePct - a.priceChangePct)
        .slice(0, 10);

      setTokens(trending);
    } catch (e) {
      console.error('[useTrendingTokens]', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrending();
    const id = setInterval(fetchTrending, 30_000);
    return () => clearInterval(id);
  }, []);

  return { tokens, isLoading };
}
