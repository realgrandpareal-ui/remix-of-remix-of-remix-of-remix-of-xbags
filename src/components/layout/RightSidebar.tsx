import { useState } from "react";
import { TrendingUp, Sparkles, ExternalLink, ArrowUpRight, ArrowDownRight, Zap, UserPlus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import QuickBuyModal from "@/components/sidebar/QuickBuyModal";
import TokenList from "@/components/sidebar/TokenList";
import { useTrendingTokens } from "@/hooks/useTrendingTokens";
import { useNewTokens } from "@/hooks/useNewTokens";
import type { BagsToken } from "@/types/token";

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

function toToken(bt: BagsToken): Token {
  return {
    tokenAddress: bt.mint,
    icon: bt.image || null,
    name: bt.name,
    symbol: bt.symbol,
    priceUsd: bt.priceUsd ? bt.priceUsd.toString() : null,
    priceChange24h: bt.priceChange24h,
    volume24h: bt.volume24h,
    marketCap: bt.marketCap,
    url: `https://dexscreener.com/solana/${bt.pairAddress || bt.mint}`,
    createdAt: bt.pairCreatedAt || null,
  };
}

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

const RightSidebar = () => {
  const [buyToken, setBuyToken] = useState<Token | null>(null);
  const { tokens: rawNewTokens, isLoading: loadingNew } = useNewTokens(10);
  const { tokens: rawTrendingTokens, isLoading: loadingTrending } = useTrendingTokens();

  const newTokens = rawNewTokens.map(toToken);
  const trendingTokens = rawTrendingTokens.map(toToken);

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
          <TokenList
            tokens={newTokens}
            loading={loadingNew}
            emptyMessage="No new tokens found"
            showTimeAgo
            onBuy={setBuyToken}
          />
        </div>

        {/* Trending Tokens */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Trending Tokens</h3>
          </div>
          <TokenList
            tokens={trendingTokens}
            loading={loadingTrending}
            emptyMessage="No trending tokens found"
            onBuy={setBuyToken}
          />
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

      {/* Quick Buy Modal */}
      <QuickBuyModal token={buyToken} onClose={() => setBuyToken(null)} />
    </aside>
  );
};

export default RightSidebar;
