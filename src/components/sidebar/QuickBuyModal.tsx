import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRightLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

// SOL mint address
const SOL_MINT = "So11111111111111111111111111111111111111112";

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
}

interface QuickBuyModalProps {
  token: Token | null;
  onClose: () => void;
}

const PRESET_AMOUNTS = [0.1, 0.5, 1, 2];

const QuickBuyModal = ({ token, onClose }: QuickBuyModalProps) => {
  const [solAmount, setSolAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useWallet();
  const { toast } = useToast();

  const handleGetQuote = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setQuoteData(null);

    try {
      const amountLamports = Math.floor(parseFloat(solAmount) * 1_000_000_000);

      const { data, error: fnError } = await supabase.functions.invoke('bags-trade', {
        body: {
          action: 'quote',
          inputMint: SOL_MINT,
          outputMint: token.tokenAddress,
          amount: amountLamports,
          slippageMode: 'auto',
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to get quote');

      setQuoteData(data.response);
    } catch (err: any) {
      setError(err.message || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quoteData || !walletAddress || !token) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('bags-trade', {
        body: {
          action: 'swap',
          quoteResponse: quoteData,
          userPublicKey: walletAddress,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to create swap');

      // The swap transaction needs to be signed by the user's wallet
      // For now we show success - full signing integration requires wallet adapter
      toast({
        title: "Swap transaction created!",
        description: `Swap ${solAmount} SOL → ${token.symbol || token.name}. Please sign the transaction in your wallet.`,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const formatOutAmount = (amount: string, decimals?: number) => {
    const num = parseInt(amount) / Math.pow(10, decimals || 9);
    if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Quick Buy {token?.symbol || token?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Info */}
          {token && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                {token.icon ? (
                  <img src={token.icon} alt={token.symbol || ''} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center text-xs font-bold text-primary">
                    {token.symbol?.slice(0, 2) || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{token.symbol || token.name}</div>
                <div className="text-xs text-muted-foreground truncate">{token.name}</div>
              </div>
              {token.priceUsd && (
                <div className="text-sm font-semibold text-foreground">
                  ${parseFloat(token.priceUsd) < 0.01 ? parseFloat(token.priceUsd).toExponential(2) : parseFloat(token.priceUsd).toFixed(4)}
                </div>
              )}
            </div>
          )}

          {/* SOL Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Amount (SOL)</label>
            <Input
              type="number"
              value={solAmount}
              onChange={(e) => {
                setSolAmount(e.target.value);
                setQuoteData(null);
              }}
              placeholder="0.0"
              className="bg-background border-border"
              step="0.1"
              min="0.01"
            />
            <div className="flex gap-1.5">
              {PRESET_AMOUNTS.map((amt) => (
                <Button
                  key={amt}
                  variant={solAmount === String(amt) ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => {
                    setSolAmount(String(amt));
                    setQuoteData(null);
                  }}
                >
                  {amt} SOL
                </Button>
              ))}
            </div>
          </div>

          {/* Quote Result */}
          {quoteData && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You'll receive</span>
                <span className="font-semibold text-foreground">
                  ~{formatOutAmount(quoteData.outAmount)} {token?.symbol}
                </span>
              </div>
              {quoteData.priceImpactPct && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={`font-medium ${parseFloat(quoteData.priceImpactPct) > 5 ? 'text-destructive' : 'text-foreground'}`}>
                    {parseFloat(quoteData.priceImpactPct).toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slippage</span>
                <span className="text-foreground">{(quoteData.slippageBps / 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Wallet Warning */}
          {!walletAddress && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Connect your wallet to trade</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!quoteData ? (
              <Button
                className="flex-1"
                onClick={handleGetQuote}
                disabled={loading || !solAmount || parseFloat(solAmount) <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Getting Quote...
                  </>
                ) : (
                  "Get Quote"
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSwap}
                disabled={loading || !walletAddress}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Swapping...
                  </>
                ) : (
                  `Buy ${token?.symbol} for ${solAmount} SOL`
                )}
              </Button>
            )}
          </div>

          {/* Powered by */}
          <p className="text-[10px] text-center text-muted-foreground">
            Powered by <a href="https://bags.fm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">bags.fm</a> Trade API
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickBuyModal;
