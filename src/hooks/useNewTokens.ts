import { useState, useEffect } from 'react';
import { BagsToken, parsePair } from '../types/token';

const NEW_BAGS_WS_URL =
  'wss://io.dexscreener.com/dex/screener/pairs/h24/1?rankBy[key]=pairAge&rankBy[order]=asc&filters[chainIds][0]=solana&filters[dexIds][0]=bags&filters[maxLaunchpadProgress][max]=99.99&filters[launchpads][0]=1';
const NEW_BAGS_FALLBACK_URL =
  'https://api.dexscreener.com/latest/dex/search?q=bags';

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

async function fetchNewBagsPairs(): Promise<{ pairs: any[]; isLive: boolean }> {
  const wsPairs = await fetchPairsFromWebSocket(NEW_BAGS_WS_URL);
  if (wsPairs && wsPairs.length > 0) {
    return { pairs: wsPairs, isLive: true };
  }

  const response = await window.fetch(NEW_BAGS_FALLBACK_URL);
  const data = await response.json();
  return { pairs: data.pairs ?? [], isLive: false };
}

export function useNewTokens(max = 20) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  async function fetchNew() {
    setIsLoading(true);

    try {
      const { pairs, isLive: liveSource } = await fetchNewBagsPairs();
      setIsLive(liveSource);

      const newTokens = (pairs ?? [])
        .filter((pair: any) => pair.chainId === 'solana' && pair.dexId === 'bags')
        .map(parsePair)
        .sort((a: BagsToken, b: BagsToken) => b.pairCreatedAt - a.pairCreatedAt)
        .slice(0, max);

      setTokens(newTokens);
    } catch (e) {
      console.error('New tokens fetch error:', e);
      setIsLive(false);
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
