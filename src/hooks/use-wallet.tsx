import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignTransaction } from "@privy-io/react-auth/solana";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  VersionedTransaction,
} from "@solana/web3.js";
import { toast } from "sonner";
import { getRpcUrl } from "@/lib/solana-utils";

export type NetworkType = "mainnet-beta" | "devnet";
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletInfo {
  name: string;
  label: string;
  icon: string;
  installed: boolean;
  readyState: string;
}

interface WalletContextType {
  status: WalletStatus;
  address: string | null;
  publicKey: PublicKey | null;
  balance: number | null;
  balanceUsd: number | null;
  solPrice: number | null;
  network: NetworkType;
  showBalance: boolean;
  wallets: WalletInfo[];
  selectedWalletName: string | null;
  connect: (walletName?: string) => Promise<void>;
  disconnect: () => void;
  copyAddress: () => void;
  toggleBalance: () => void;
  setNetwork: (network: NetworkType) => void;
  explorerUrl: string | null;
  solscanUrl: string | null;
  errorMessage: string | null;
  retryConnect: () => void;
  refreshBalance: () => Promise<void>;
  isRefreshing: boolean;
  sendTransaction: (to: string, amount: number) => Promise<string | null>;
  isSending: boolean;
  signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<string>;
  signTransactionFn: (tx: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  connection: Connection;
}

const BALANCE_KEY = "xbags_show_balance";
const NETWORK_KEY = "xbags_network";
const SOL_PRICE_CACHE_KEY = "xbags_sol_price";

export function addressToColor(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export function truncateAddress(address: string, start = 4, end = 4): string {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

const WalletContext = createContext<WalletContextType | null>(null);

export function BagsFunWalletProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const { signTransaction: privySignTransaction } = useSignTransaction();

  const [balance, setBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(SOL_PRICE_CACHE_KEY);
      if (cached) {
        const { price, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) return price;
      }
    } catch {}
    return null;
  });
  const [network, setNetworkState] = useState<NetworkType>(
    () => (localStorage.getItem(NETWORK_KEY) as NetworkType) || "mainnet-beta"
  );
  const [showBalance, setShowBalance] = useState(
    () => localStorage.getItem(BALANCE_KEY) !== "false"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const balanceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick active wallet: prefer external over embedded (privy)
  const activeWallet = useMemo(() => {
    if (!privyWallets || privyWallets.length === 0) return null;
    const external = privyWallets.find((w: any) => w.walletClientType !== "privy");
    return external ?? privyWallets[0];
  }, [privyWallets]);

  const address = activeWallet?.address ?? null;

  const publicKey = useMemo(() => {
    if (!address) return null;
    try {
      return new PublicKey(address);
    } catch {
      return null;
    }
  }, [address]);

  const connection = useMemo(
    () => new Connection(getRpcUrl(network), "confirmed"),
    [network]
  );

  const isConnected = ready && authenticated && !!address;

  const status: WalletStatus = !ready
    ? "connecting"
    : isConnected
    ? "connected"
    : errorMessage
    ? "error"
    : "disconnected";

  // Fetch SOL price
  const fetchSolPrice = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      if (!res.ok) return;
      const data = await res.json();
      const price = data.solana?.usd;
      if (price) {
        setSolPrice(price);
        localStorage.setItem(
          SOL_PRICE_CACHE_KEY,
          JSON.stringify({ price, timestamp: Date.now() })
        );
      }
    } catch {}
  }, []);

  // Fetch balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    setIsRefreshing(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [publicKey, connection]);

  // Auto-fetch when connected
  useEffect(() => {
    if (isConnected && publicKey) {
      refreshBalance();
      fetchSolPrice();
      balanceIntervalRef.current = setInterval(refreshBalance, 30_000);
      const priceInterval = setInterval(fetchSolPrice, 5 * 60 * 1000);
      return () => {
        if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
        clearInterval(priceInterval);
      };
    } else {
      setBalance(null);
      if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
    }
  }, [isConnected, publicKey, refreshBalance, fetchSolPrice]);

  // Wallet list for UI
  const wallets: WalletInfo[] = useMemo(() => {
    if (privyWallets && privyWallets.length > 0) {
      return privyWallets.map((w: any) => ({
        name: w.walletClientType || "Wallet",
        label: w.walletClientType || "Wallet",
        icon: "",
        installed: true,
        readyState: "Installed",
      }));
    }
    return [
      {
        name: "Phantom",
        label: "Phantom",
        icon: "https://raw.githubusercontent.com/nicka/phantom-deeplink/refs/heads/master/public/phantom-icon.png",
        installed: false,
        readyState: "NotDetected",
      },
      {
        name: "Solflare",
        label: "Solflare",
        icon: "https://solflare.com/favicon.ico",
        installed: false,
        readyState: "NotDetected",
      },
    ];
  }, [privyWallets]);

  const connect = useCallback(
    async (_walletName?: string) => {
      setErrorMessage(null);
      try {
        login();
      } catch (err: any) {
        setErrorMessage(err?.message || "Connection failed");
      }
    },
    [login]
  );

  // Toast on connect
  const prevConnectedRef = useRef(false);
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current) {
      toast.success("Wallet connected!", {
        description: `Connected on ${network === "mainnet-beta" ? "Mainnet" : "Devnet"}`,
      });
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, network]);

  const disconnect = useCallback(() => {
    logout();
    setBalance(null);
    setErrorMessage(null);
    toast.info("Wallet disconnected");
  }, [logout]);

  const copyAddress = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    }
  }, [address]);

  const toggleBalance = useCallback(() => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem(BALANCE_KEY, String(next));
      return next;
    });
  }, []);

  const setNetwork = useCallback((net: NetworkType) => {
    setNetworkState(net);
    localStorage.setItem(NETWORK_KEY, net);
    toast.info(`Switched to ${net === "mainnet-beta" ? "Mainnet" : "Devnet"}`);
  }, []);

  const retryConnect = useCallback(() => {
    setErrorMessage(null);
    login();
  }, [login]);

  // Sign transaction via Privy
  const signTransactionFn = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> => {
      if (!activeWallet) throw new Error("No wallet connected");
      const result = await privySignTransaction({
        transaction: tx as any,
        wallet: activeWallet as any,
      });
      return result.signedTransaction as unknown as Transaction | VersionedTransaction;
    },
    [activeWallet, privySignTransaction]
  );

  // Sign and send via Privy wallet
  const signAndSendTransaction = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<string> => {
      const signed = await signTransactionFn(tx);
      const raw = (signed as Transaction).serialize
        ? (signed as Transaction).serialize()
        : (signed as VersionedTransaction).serialize();
      return await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    },
    [signTransactionFn, connection]
  );

  // Legacy sendTransaction (SOL transfer by address + amount)
  const sendTransaction = useCallback(
    async (to: string, amount: number): Promise<string | null> => {
      if (!publicKey || !isConnected) {
        toast.error("Wallet not connected");
        return null;
      }
      if (!isValidSolanaAddress(to)) {
        toast.error("Invalid destination address");
        return null;
      }
      if (amount <= 0) {
        toast.error("Amount must be greater than 0");
        return null;
      }
      if (balance !== null && amount > balance) {
        toast.error("Insufficient balance");
        return null;
      }

      setIsSending(true);
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(to),
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        );

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signature = await signAndSendTransaction(transaction);
        await connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success("Transaction sent!", {
          description: `Signature: ${signature.slice(0, 8)}...`,
          action: {
            label: "View",
            onClick: () =>
              window.open(
                `https://solscan.io/tx/${signature}${network === "devnet" ? "?cluster=devnet" : ""}`,
                "_blank"
              ),
          },
        });

        setTimeout(refreshBalance, 2000);
        return signature;
      } catch (err: any) {
        const msg = err?.message || "Transaction failed";
        if (msg.includes("User rejected") || msg.includes("rejected the request")) {
          toast.error("Transaction cancelled", {
            description: "You rejected the transaction in your wallet.",
          });
        } else {
          toast.error("Transaction failed", { description: msg });
        }
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [publicKey, isConnected, balance, connection, network, refreshBalance, signAndSendTransaction]
  );

  const explorerUrl = address
    ? `https://explorer.solana.com/address/${address}${network === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  const solscanUrl = address
    ? `https://solscan.io/account/${address}${network === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  const balanceUsd = balance !== null && solPrice !== null ? balance * solPrice : null;

  const selectedWalletName = (activeWallet as any)?.walletClientType || null;

  return (
    <WalletContext.Provider
      value={{
        status,
        address,
        publicKey,
        balance,
        balanceUsd,
        solPrice,
        network,
        showBalance,
        wallets,
        selectedWalletName,
        connect,
        disconnect,
        copyAddress,
        toggleBalance,
        setNetwork,
        explorerUrl,
        solscanUrl,
        errorMessage,
        retryConnect,
        refreshBalance,
        isRefreshing,
        sendTransaction,
        isSending,
        signTransactionFn,
        signAndSendTransaction,
        connection,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within BagsFunWalletProvider");
  return ctx;
}
