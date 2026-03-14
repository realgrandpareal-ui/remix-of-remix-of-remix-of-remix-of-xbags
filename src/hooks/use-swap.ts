import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { VersionedTransaction } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import bs58 from "bs58";

// ── Types ──────────────────────────────────────────────

export interface RoutePlanStep {
  venue: string;
  inAmount: string;
  outAmount: string;
  inputMint: string;
  outputMint: string;
  inputMintDecimals: number;
  outputMintDecimals: number;
  marketKey: string;
  data?: string;
}

export interface PlatformFee {
  amount: string;
  feeBps: number;
  mode?: string;
  feeAccount?: string;
  segmenterFeeAmount?: string;
  segmenterFeePct?: number;
}

export interface QuoteResponse {
  requestId: string;
  contextSlot: number;
  inAmount: string;
  inputMint: string;
  outAmount: string;
  outputMint: string;
  minOutAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: RoutePlanStep[];
  platformFee: PlatformFee;
  outTransferFee: string | null;
  simulatedComputeUnits: number;
}

// ── SOL constants ──────────────────────────────────────

const SOL_MINT = "So11111111111111111111111111111111111111112";
const QUOTE_STALE_MS = 30_000;

// ── useGetQuote ────────────────────────────────────────

export function useGetQuote() {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quoteTimestampRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchQuote = useCallback(
    async (outputMint: string, amountSol: number) => {
      if (!outputMint || amountSol <= 0) {
        setQuote(null);
        setError(null);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const amountLamports = Math.floor(amountSol * 1_000_000_000);

        const { data, error: fnError } = await supabase.functions.invoke("bags-trade", {
          body: {
            action: "quote",
            inputMint: SOL_MINT,
            outputMint,
            amount: amountLamports,
            slippageMode: "auto",
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || "Failed to get quote");

        const quoteData = data.response as QuoteResponse;
        setQuote(quoteData);
        quoteTimestampRef.current = Date.now();
        return quoteData;
      } catch (err: any) {
        const msg = err.message || "Failed to get quote";
        setError(msg);
        setQuote(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchQuoteDebounced = useCallback(
    (outputMint: string, amountSol: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchQuote(outputMint, amountSol);
      }, 500);
    },
    [fetchQuote]
  );

  const isQuoteStale = useCallback(() => {
    return Date.now() - quoteTimestampRef.current > QUOTE_STALE_MS;
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
    quoteTimestampRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { quote, isLoading, error, fetchQuote, fetchQuoteDebounced, isQuoteStale, clearQuote };
}

// ── useCreateTransaction ───────────────────────────────

export function useCreateTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (quoteResponse: QuoteResponse, userPublicKey: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("bags-trade", {
          body: {
            action: "swap",
            quoteResponse,
            userPublicKey,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || "Failed to create transaction");

        const swapTx = data.swapTransaction as string;
        if (!swapTx) throw new Error("No swapTransaction returned from API");

        return {
          swapTransaction: swapTx,
          lastValidBlockHeight: data.lastValidBlockHeight as number | undefined,
        };
      } catch (err: any) {
        const msg = err.message || "Failed to create transaction";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, execute };
}

// ── useSwap (combines everything) ──────────────────────

export function useSwap() {
  const { publicKey, signTransaction, connection } = useWallet();

  const {
    quote,
    isLoading: isLoadingQuote,
    error: quoteError,
    fetchQuote,
    fetchQuoteDebounced,
    isQuoteStale,
    clearQuote,
  } = useGetQuote();

  const {
    isLoading: isLoadingTx,
    error: txError,
    execute: createTransaction,
  } = useCreateTransaction();

  const [isSigning, setIsSigning] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const error = swapError || quoteError || txError;

  const executeSwap = useCallback(
    async (outputMint: string, amountSol: number): Promise<string | null> => {
      setSwapError(null);
      setTxSignature(null);

      if (!publicKey) {
        setSwapError("Please connect your wallet first");
        return null;
      }
      if (!signTransaction) {
        setSwapError("Wallet does not support transaction signing");
        return null;
      }
      if (amountSol <= 0) {
        setSwapError("Enter a valid amount");
        return null;
      }

      try {
        // Step 1: Fresh quote if stale
        let currentQuote = quote;
        if (!currentQuote || isQuoteStale()) {
          currentQuote = await fetchQuote(outputMint, amountSol);
        }
        if (!currentQuote) {
          setSwapError("Failed to get quote");
          return null;
        }

        // Step 2: Create swap transaction
        const result = await createTransaction(currentQuote, publicKey.toBase58());
        if (!result) return null;

        // Step 3: Decode Base58, sign & send
        setIsSigning(true);

        const txBytes = bs58.decode(result.swapTransaction);
        const tx = VersionedTransaction.deserialize(txBytes);
        const signedTx = await signTransaction(tx);

        const signature = await connection.sendRawTransaction(
          (signedTx as VersionedTransaction).serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );

        // Confirm with lastValidBlockHeight if available
        if (result.lastValidBlockHeight) {
          await connection.confirmTransaction(
            {
              signature,
              lastValidBlockHeight: result.lastValidBlockHeight,
              blockhash: tx.message.recentBlockhash,
            },
            "confirmed"
          );
        } else {
          await connection.confirmTransaction(signature, "confirmed");
        }

        setTxSignature(signature);
        clearQuote();
        return signature;
      } catch (err: any) {
        const msg = err?.message || "Transaction failed";
        if (msg.includes("User rejected") || msg.includes("rejected the request")) {
          setSwapError("Transaction cancelled by user");
        } else {
          setSwapError(msg);
        }
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [publicKey, signTransaction, quote, isQuoteStale, fetchQuote, createTransaction, connection, clearQuote]
  );

  const reset = useCallback(() => {
    clearQuote();
    setTxSignature(null);
    setSwapError(null);
  }, [clearQuote]);

  return {
    quote,
    isLoadingQuote,
    isLoadingTx: isLoadingTx || isSigning,
    txSignature,
    error,
    fetchQuote,
    fetchQuoteDebounced,
    executeSwap,
    reset,
    clearQuote,
  };
}
