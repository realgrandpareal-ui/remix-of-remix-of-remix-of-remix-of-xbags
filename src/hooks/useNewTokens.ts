import { useState, useEffect } from 'react';

export interface TokenCard {
  mint:           string;
  name:           string;
  symbol:         string;
  image:          string;
  priceUsd:       string;
  priceChangePct: number;
  priceChangeStr: string;
  marketCap:      string;
  ageMs:          number;
  ageStr:         string;
  isNew:          boolean;
}

export function fmtPrice(n: number): string {
  if (!n)           return '$0.00';
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.0001)   return `$${n.toFixed(6)}`;
  if (n < 0.01)     return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function fmtMC(n: number): string {
  if (!n)             return '$-';
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n/1_000).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

export function isBags(p: any): boolean {
  return (
    p.chainId === 'solana' &&
    (p.dexId === 'meteora' || p.dexId === 'meteora_dlmm')
  );
}

function toPairCard(p: any): TokenCard {
  const pct = p.priceChange?.h24 ?? p.priceChange?.h6 ?? 0;
  const age = Date.now() - (p.pairCreatedAt ?? 0);
  return {
    mint:           p.baseToken?.address  ?? '',
    name:           p.baseToken?.name     ?? 'Unknown',
    symbol:         p.baseToken?.symbol   ?? '???',
    image:          p.info?.imageUrl      ?? '',
    priceUsd:       fmtPrice(parseFloat(p.priceUsd ?? '0')),
    priceChangePct: pct,
    priceChangeStr: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`,
    marketCap:      fmtMC(p.marketCap ?? p.fdv ?? 0),
    ageMs:          age,
    ageStr:         fmtAge(age),
    isNew:          age < 60 * 60 * 1000,
  };
}

export function useNewTokens(max = 20) {
  const [tokens, setTokens]     = useState<TokenCard[]>([]);
  const [isLoading, setLoading] = useState(false);

  async function fetchNew() {
    setLoading(true);
    try {
      const res  = await window.fetch(
        'https://api.dexscreener.com/latest/dex/search?q=bags'
      );
      const data = await res.json();

      const newTokens: TokenCard[] = (data.pairs ?? [])
        .filter(isBags)
        .filter((p: any) => {
          const age = Date.now() - (p.pairCreatedAt ?? 0);
          return age < 24 * 60 * 60 * 1000;
        })
        .map(toPairCard)
        .sort((a: TokenCard, b: TokenCard) => a.ageMs - b.ageMs)
        .slice(0, max);

      setTokens(newTokens);
    } catch (e) {
      console.error('[useNewTokens]', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNew();
    const id = setInterval(fetchNew, 15_000);
    return () => clearInterval(id);
  }, [max]);

  useEffect(() => {
    const id = setInterval(() => {
      setTokens(prev => prev.map(t => {
        const nextAgeMs = t.ageMs + 60_000;
        return {
          ...t,
          ageMs: nextAgeMs,
          ageStr: fmtAge(nextAgeMs),
          isNew: nextAgeMs < 60 * 60 * 1000,
        };
      }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return { tokens, isLoading };
}
