export interface BagsToken {
  mint:          string;
  name:          string;
  symbol:        string;
  image:         string;
  priceUsd:      number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h:number;
  volume6h:      number;
  volume24h:     number;
  marketCap:     number;
  liquidity:     number;
  buys6h:        number;
  sells6h:       number;
  pairAddress:   string;
  pairCreatedAt: number;
}

const normalizeText = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export function parsePair(pair: any): BagsToken {
  return {
    mint:          normalizeText(pair.baseToken?.address, ''),
    name:          normalizeText(pair.baseToken?.name, 'Unknown'),
    symbol:        normalizeText(pair.baseToken?.symbol, '???'),
    image:         normalizeText(pair.info?.imageUrl, ''),
    priceUsd:      parseFloat(pair.priceUsd        ?? '0'),
    priceChange1h: pair.priceChange?.h1            ?? 0,
    priceChange6h: pair.priceChange?.h6            ?? 0,
    priceChange24h:pair.priceChange?.h24           ?? 0,
    volume6h:      pair.volume?.h6                 ?? 0,
    volume24h:     pair.volume?.h24                ?? 0,
    marketCap:     pair.marketCap ?? pair.fdv      ?? 0,
    liquidity:     pair.liquidity?.usd             ?? 0,
    buys6h:        pair.txns?.h6?.buys             ?? 0,
    sells6h:       pair.txns?.h6?.sells            ?? 0,
    pairAddress:   normalizeText(pair.pairAddress, ''),
    pairCreatedAt: pair.pairCreatedAt              ?? 0,
  };
}

export function isBagsToken(pair: any): boolean {
  return (
    pair.chainId === 'solana' &&
    (pair.dexId === 'meteora' || pair.dexId === 'meteora_dlmm')
  );
}
