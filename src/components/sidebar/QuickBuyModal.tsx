import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { useSwap } from "@/hooks/use-swap";

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
  const { address: walletAddress } = useWallet();
  const { toast } = useToast();

  const {
    quote: quoteData,
    isLoadingQuote,
    isLoadingTx,
    txSignature,
    error,
    fetchQuoteDebounced,
    executeSwap,
    reset,
    clearQuote,
  } = useSwap();

  // Auto-fetch quote when amount or token changes (debounced)
  useEffect(() => {
    if (!token) return;
    const amt = parseFloat(solAmount);
    if (isNaN(amt) || amt <= 0) {
      clearQuote();
      return;
    }
    fetchQuoteDebounced(token.tokenAddress, amt);
  }, [solAmount, token?.tokenAddress, fetchQuoteDebounced, clearQuote]);

  // Reset state when modal opens with new token
  useEffect(() => {
    if (token) {
      setSolAmount("0.1");
      reset();
    }
  }, [token?.tokenAddress]);

  // Handle successful swap
  useEffect(() => {
    if (txSignature && token) {
      toast({
        title: "Swap successful! 🎉",
        description: `Swapped SOL → ${token.symbol || token.name}`,
      });
      onClose();
    }
  }, [txSignature]);

  const handleSwap = useCallback(async () => {
    if (!token || !walletAddress) return;
    const amt = parseFloat(solAmount);
    if (isNaN(amt) || amt <= 0) return;

    const sig = await executeSwap(token.tokenAddress, amt);
    if (!sig) {
      // Error is already set in the hook state
    }
  }, [token, walletAddress, solAmount, executeSwap]);

  const getOutputDecimals = (): number => {
    if (!quoteData?.routePlan?.length) return 9;
    return quoteData.routePlan[quoteData.routePlan.length - 1]?.outputMintDecimals ?? 9;
  };

  const formatOutAmount = (amount: string) => {
    const decimals = getOutputDecimals();
    const num = parseInt(amount) / Math.pow(10, decimals);
    if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num > 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  const loading = isLoadingQuote || isLoadingTx;

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
                disabled={loading || !solAmount || parseFloat(solAmount) <= 0}
              >
                {isLoadingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Getting Quote...
                  </>
                ) : (
                  "Enter amount for quote"
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSwap}
                disabled={loading || !walletAddress}
              >
                {isLoadingTx ? (
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

          {/* Tx Success Link */}
          {txSignature && (
            <div className="text-center">
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View on Solscan →
              </a>
            </div>
          )}

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
