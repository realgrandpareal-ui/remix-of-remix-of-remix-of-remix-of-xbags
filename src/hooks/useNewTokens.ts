import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BagsToken, parsePair } from '../types/token';

async function fetchNewBagsPairs(): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('dexscreener-screener', {
    body: { type: 'new-bags' },
  });

  if (error) throw error;
  return Array.isArray(data?.pairs) ? data.pairs : [];
}

export function useNewTokens(max = 20) {
  const [tokens, setTokens] = useState<BagsToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchNew = useCallback(async () => {
    setIsLoading(true);

    try {
      const pairs = await fetchNewBagsPairs();
      setIsLive(true);

      const newTokens = (pairs ?? [])
        .filter((pair: any) => pair?.chainId === 'solana' && pair?.dexId === 'bags')
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
  }, [max]);

  useEffect(() => {
    fetchNew();
    const id = window.setInterval(fetchNew, 30_000);
    return () => window.clearInterval(id);
  }, [fetchNew]);

  return { tokens, isLive, isLoading };
}
