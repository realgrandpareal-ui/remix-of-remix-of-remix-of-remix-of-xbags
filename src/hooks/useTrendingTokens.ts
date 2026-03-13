import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BagsToken, parsePair } from '../types/token';

async function fetchTrendingPairs(): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('dexscreener-screener', {
    body: { type: 'trending' },
  });

  if (error) throw error;
  return Array.isArray(data?.pairs) ? data.pairs : [];
}

export function useTrendingTokens(limit = 25) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [lastUpdated, setLast] = useState<Date | null>(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);

    try {
      const pairs = await fetchTrendingPairs();

      const trending = (pairs ?? [])
        .filter((pair: any) => pair?.chainId === 'solana')
        .map(parsePair)
        .slice(0, limit);

      setTokens(trending);
      setLast(new Date());
    } catch (e) {
      console.error('Trending error:', e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrending();
    const id = window.setInterval(fetchTrending, 30_000);
    return () => window.clearInterval(id);
  }, [fetchTrending]);

  return { tokens, isLoading, lastUpdated };
}
