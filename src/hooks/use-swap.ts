import { useState, useCallback, useRef, useEffect } from "react";
import { useConnection, useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { Buffer } from "buffer";

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
  data: string;
}

export interface PlatformFee {
  amount: string;
  feeBps: number;
  feeAccount: string;
  segmenterFeeAmount: string;
  segmenterFeePct: number;
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

export interface TransactionResponse {
  transaction: string; // base64
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { quote, isLoading, error, fetchQuote, fetchQuoteDebounced, isQuoteStale, clearQuote };
}

// ── useCreateTransaction ───────────────────────────────

export function useCreateTransaction() {
  const [transaction, setTransaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (quoteResponse: QuoteResponse, userPublicKey: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      setTransaction(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("bags-trade", {
          body: {
            action: "swap",
            quoteResponse: {
              requestId: quoteResponse.requestId,
              contextSlot: quoteResponse.contextSlot,
              inAmount: quoteResponse.inAmount,
              inputMint: quoteResponse.inputMint,
              outAmount: quoteResponse.outAmount,
              outputMint: quoteResponse.outputMint,
              minOutAmount: quoteResponse.minOutAmount,
              otherAmountThreshold: quoteResponse.otherAmountThreshold,
              priceImpactPct: quoteResponse.priceImpactPct,
              slippageBps: quoteResponse.slippageBps,
              routePlan: quoteResponse.routePlan,
              platformFee: quoteResponse.platformFee,
              outTransferFee: quoteResponse.outTransferFee,
              simulatedComputeUnits: quoteResponse.simulatedComputeUnits,
            },
            userPublicKey,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (!data?.success) throw new Error(data?.error || "Failed to create transaction");

        const txBase64 = data.transaction as string;
        if (!txBase64) throw new Error("No transaction returned from API");

        setTransaction(txBase64);
        return txBase64;
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

  return { transaction, isLoading, error, execute };
}

// ── useSwap (combines everything) ──────────────────────

export function useSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useSolanaWallet();

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
        // Step 1: Get fresh quote if stale
        let currentQuote = quote;
        if (!currentQuote || isQuoteStale()) {
          currentQuote = await fetchQuote(outputMint, amountSol);
        }
        if (!currentQuote) {
          setSwapError("Failed to get quote");
          return null;
        }

        // Step 2: Create transaction
        const txBase64 = await createTransaction(currentQuote, publicKey.toBase58());
        if (!txBase64) return null;

        // Step 3: Sign & send
        setIsSigning(true);

        const txBuffer = Buffer.from(txBase64, "base64");

        let tx: Transaction | VersionedTransaction;
        try {
          tx = VersionedTransaction.deserialize(new Uint8Array(txBuffer));
        } catch {
          tx = Transaction.from(txBuffer);
        }

        const signedTx = await signTransaction(tx);

        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        await connection.confirmTransaction(signature, "confirmed");

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
