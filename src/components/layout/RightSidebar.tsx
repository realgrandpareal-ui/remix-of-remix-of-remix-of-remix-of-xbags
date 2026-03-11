import { useState, useEffect } from "react";
import { TrendingUp, Zap, UserPlus, Sparkles, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

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
  if (!price) return "-";
  const num = parseFloat(price);
  if (num < 0.0001) return `$${num.toExponential(2)}`;
  if (num < 1) return `$${num.toFixed(4)}`;
  if (num < 1000) return `$${num.toFixed(2)}`;
  return `$${(num / 1000).toFixed(1)}K`;
};

const formatMarketCap = (mc: number | null) => {
  if (!mc) return "-";
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

const whoToFollow = [
  { name: "bags.fun", handle: "@bags", color: "bg-primary/20 text-primary" },
  { name: "Block Builder", handle: "@blockbuilder", color: "bg-info/20 text-info" },
  { name: "Melody Chain", handle: "@melodychain", color: "bg-warning/20 text-warning" },
];

const topServices = [
  { name: "/launch", creator: "@bags", price: "$0.01", runs: 18 },
  { name: "/mint-nft", creator: "@bags", price: "$0.05", runs: 43 },
  { name: "/ai-generate", creator: "@xona_agent", price: "$0.50", runs: 2 },
];

const TokenSkeleton = () => (
  <div className="flex items-center gap-3 py-1.5">
    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
    <div className="flex-1 min-w-0 space-y-1.5">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3 w-14" />
    </div>
    <div className="space-y-1.5 text-right">
      <Skeleton className="h-3.5 w-12 ml-auto" />
      <Skeleton className="h-3 w-10 ml-auto" />
    </div>
  </div>
);

const RightSidebar = () => {
  const [newTokens, setNewTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const fetchTokens = async (type: 'new' | 'trending') => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-tokens', {
          body: { type },
        });
        if (error) throw error;
        if (data?.success) {
          if (type === 'new') {
            setNewTokens(data.tokens);
            setLoadingNew(false);
          } else {
            setTrendingTokens(data.tokens);
            setLoadingTrending(false);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${type} tokens:`, err);
        if (type === 'new') setLoadingNew(false);
        else setLoadingTrending(false);
      }
    };

    fetchTokens('new');
    fetchTokens('trending');

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchTokens('new');
      fetchTokens('trending');
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-[340px] border-l border-border bg-background h-screen sticky top-0 shrink-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bags.fun"
            className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* New Tokens */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">New Tokens</h3>
          </div>
          <div className="space-y-1">
            {loadingNew ? (
              Array.from({ length: 5 }).map((_, i) => <TokenSkeleton key={i} />)
            ) : newTokens.length === 0 ? (
              <p className="text-xs text-muted-foreground">No new tokens found</p>
            ) : (
              newTokens.map((token) => (
                <a
                  key={token.tokenAddress}
                  href={token.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors group"
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {token.icon ? (
                      <img src={token.icon} alt={token.symbol || ''} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {token.symbol?.slice(0, 2) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-foreground truncate">{token.symbol || token.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {token.name}
                      {token.createdAt && <span className="ml-1">· {formatTimeAgo(token.createdAt)}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">{formatPrice(token.priceUsd)}</div>
                    {token.marketCap && (
                      <div className="text-xs text-muted-foreground">MC {formatMarketCap(token.marketCap)}</div>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Trending Tokens */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Trending Tokens</h3>
          </div>
          <div className="space-y-1">
            {loadingTrending ? (
              Array.from({ length: 5 }).map((_, i) => <TokenSkeleton key={i} />)
            ) : trendingTokens.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trending tokens found</p>
            ) : (
              trendingTokens.map((token) => (
                <a
                  key={token.tokenAddress}
                  href={token.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors group"
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {token.icon ? (
                      <img src={token.icon} alt={token.symbol || ''} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary">
                        {token.symbol?.slice(0, 2) || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-foreground truncate">{token.symbol || token.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">{formatPrice(token.priceUsd)}</div>
                    {token.priceChange24h !== null && (
                      <div className={`text-xs flex items-center justify-end gap-0.5 ${token.priceChange24h >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {token.priceChange24h >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(token.priceChange24h).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Top Services</h3>
          </div>
          <div className="space-y-2.5">
            {topServices.map((service) => (
              <div key={service.name} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.creator}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-primary">{service.price}</div>
                  <div className="text-xs text-muted-foreground">{service.runs} runs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who to Follow */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Who to follow</h3>
          </div>
          <div className="space-y-3">
            {whoToFollow.map((user) => (
              <div key={user.handle} className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.color}`}>
                  {user.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.handle}</div>
                </div>
                <Button size="sm" className="h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-secondary rounded-full">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
