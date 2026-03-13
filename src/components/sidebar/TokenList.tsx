import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Token {
  tokenAddress: string;
  icon: string | null;
  name: string;
  symbol: string | null;
  priceUsd: string | null;
  priceChange24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  url: string;
  createdAt?: number | null;
}

const formatPrice = (price: string | null) => {
  if (!price) return "$-";
  const n = Number.parseFloat(price);
  if (!Number.isFinite(n)) return "$-";
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatMarketCap = (mc: number | null) => {
  if (!mc || mc === 0) return "-";
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(1)}M`;
  if (mc >= 1_000) return `$${(mc / 1_000).toFixed(1)}K`;
  return `$${mc.toFixed(0)}`;
};

const formatTimeAgo = (timestamp: number | null) => {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TokenSkeleton = () => (
  <div className="flex items-start gap-3 py-2">
    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
    <div className="flex-1 min-w-0 space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="space-y-1.5 text-right">
      <Skeleton className="h-3.5 w-16 ml-auto" />
      <Skeleton className="h-3 w-12 ml-auto" />
    </div>
    <Skeleton className="h-7 w-14 rounded-md" />
  </div>
);

interface TokenListProps {
  tokens: Token[];
  loading: boolean;
  emptyMessage: string;
  showTimeAgo?: boolean;
  onBuy: (token: Token) => void;
}

const TokenList = ({ tokens, loading, emptyMessage, showTimeAgo, onBuy }: TokenListProps) => {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <TokenSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tokens.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-0.5">
      {tokens.map((token) => (
        <div
          key={token.tokenAddress}
          className="flex items-start gap-2 hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors group"
        >
          <a
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden"
            aria-label={`Open ${token.name} on DexScreener`}
          >
            <span className="text-xs font-bold text-primary">
              {token.symbol?.slice(0, 2).toUpperCase() || "?"}
            </span>
            {token.icon && (
              <img
                src={token.icon}
                alt={token.symbol || token.name}
                className="absolute inset-0 h-9 w-9 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </a>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-sm font-semibold text-foreground leading-tight break-all">
              {token.symbol || "-"}
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight break-words">
              {token.name}
              {showTimeAgo && token.createdAt && <span className="ml-1">· {formatTimeAgo(token.createdAt)}</span>}
            </div>
          </div>

          <div className="text-right shrink-0 min-w-[5.75rem]">
            <div className="text-xs font-semibold text-foreground whitespace-nowrap">
              {formatPrice(token.priceUsd)}
            </div>
            <div className="text-[10px] text-muted-foreground whitespace-nowrap">
              MC {formatMarketCap(token.marketCap)}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px] border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground rounded-md shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onBuy(token);
            }}
          >
            <ShoppingCart className="h-3 w-3 mr-0.5" />
            Buy
          </Button>
        </div>
      ))}
    </div>
  );
};

export default TokenList;
