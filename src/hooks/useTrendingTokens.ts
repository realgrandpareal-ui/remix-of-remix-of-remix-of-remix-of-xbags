import { useState, useEffect } from 'react';
import { BagsToken, parsePair } from '../types/token';

const TRENDING_WS_URL =
  'wss://io.dexscreener.com/dex/screener/pairs/h24/1?rankBy[key]=trendingScoreH24&rankBy[order]=desc&filters[chainIds][0]=solana';
const TRENDING_FALLBACK_URL =
  'https://api.dexscreener.com/latest/dex/search?q=solana';

function fetchPairsFromWebSocket(url: string, timeoutMs = 7000): Promise<any[] | null> {
  return new Promise((resolve) => {
    let settled = false;
    const ws = new WebSocket(url);

    const finalize = (pairs: any[] | null) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore close error
      }
      resolve(pairs);
    };

    const timeout = window.setTimeout(() => finalize(null), timeoutMs);

    ws.onmessage = (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : String(event.data);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.clearTimeout(timeout);
          finalize(parsed);
        }
      } catch {
        // ignore non-json frames
      }
    };

    ws.onerror = () => {
      window.clearTimeout(timeout);
      finalize(null);
    };

    ws.onclose = () => {
      window.clearTimeout(timeout);
      finalize(null);
    };
  });
}

async function fetchTrendingPairs(): Promise<{ pairs: any[]; isLive: boolean }> {
  const wsPairs = await fetchPairsFromWebSocket(TRENDING_WS_URL);
  if (wsPairs && wsPairs.length > 0) {
    return { pairs: wsPairs, isLive: true };
  }

  const response = await window.fetch(TRENDING_FALLBACK_URL);
  const data = await response.json();
  return { pairs: data.pairs ?? [], isLive: false };
}

export function useTrendingTokens() {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdated, setLast] = useState<Date | null>(null);

  async function fetchTrending() {
    setLoading(true);

    try {
      const { pairs, isLive } = await fetchTrendingPairs();

      const parsed = (pairs ?? [])
        .filter((pair: any) => pair.chainId === 'solana')
        .map(parsePair);

      const trending = (isLive
        ? parsed
        : parsed.sort((a, b) => b.volume24h - a.volume24h)
      ).slice(0, 10);

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
