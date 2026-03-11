import { useState, useEffect, useRef } from 'react';
import { BagsToken, parsePair, isBagsToken } from '../types/token';

export function useNewTokens(max = 20) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<any>(null);

  async function enrichMint(mint: string): Promise<BagsToken | null> {
    try {
      await new Promise(r => setTimeout(r, 5000));
      const res  = await window.fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`
      );
      const data = await res.json();
      const pair = (data.pairs ?? []).find(isBagsToken)
                ?? (data.pairs ?? [])[0];
      return pair ? parsePair(pair) : null;
    } catch {
      return null;
    }
  }

  function placeholderFromEvent(ev: any): BagsToken {
    return {
      mint:          ev.mint,
      name:          ev.name   ?? 'New Token',
      symbol:        ev.symbol ?? '???',
      image:         ev.image  ?? '',
      priceUsd:      0,
      priceChange1h: 0,
      priceChange6h: 0,
      priceChange24h:0,
      volume6h:      0,
      volume24h:     0,
      marketCap:     0,
      liquidity:     0,
      buys6h:        0,
      sells6h:       0,
      pairAddress:   '',
      pairCreatedAt: Date.now(),
    };
  }

  // Initial fetch via DexScreener search (sorted by newest)
  async function fetchInitial() {
    setIsLoading(true);
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

  // Try to connect to bags ReStream for real-time updates
  async function connectRestream(seen: Set<string>) {
    try {
      const { RestreamClient } = await import('@bagsfm/bags-sdk');
      const client = new RestreamClient();
      clientRef.current = client;

      client.on('open', () => setIsLive(true));
      client.on('close', () => setIsLive(false));
      client.on('reconnected', () => setIsLive(true));

      await client.connect();

      client.subscribeBagsLaunches(async (ev: any) => {
        if (seen.has(ev.mint)) return;
        seen.add(ev.mint);

        // Show placeholder immediately
        setTokens(p => [placeholderFromEvent(ev), ...p].slice(0, max));

        // Enrich with DexScreener data
        const enriched = await enrichMint(ev.mint);
        if (enriched) {
          setTokens(p =>
            p.map(t => t.mint === ev.mint ? enriched : t)
          );
        }
      });
    } catch (e) {
      console.warn('ReStream not available, using polling fallback:', e);
      // Fallback: poll every 30s
      const id = setInterval(fetchInitial, 30_000);
      return () => clearInterval(id);
    }
  }

  useEffect(() => {
    const seen = new Set<string>();
    
    fetchInitial();
    const cleanup = connectRestream(seen);

    return () => {
      if (clientRef.current) {
        try { clientRef.current.disconnect(); } catch {}
      }
      if (cleanup instanceof Promise) {
        cleanup.then(fn => fn?.());
      }
    };
  }, [max]);

  return { tokens, isLive, isLoading };
}
