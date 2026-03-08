import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";

export type WalletName = "phantom" | "solflare" | "backpack";
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
export type NetworkType = "mainnet-beta" | "devnet";

export interface WalletInfo {
  name: WalletName;
  label: string;
  icon: string;
  installUrl: string;
  installed: boolean;
}

interface WalletContextType {
  status: WalletStatus;
  address: string | null;
  balance: number | null;
  network: NetworkType;
  showBalance: boolean;
  selectedWallet: WalletName | null;
  wallets: WalletInfo[];
  connect: (walletName: WalletName) => Promise<void>;
  disconnect: () => void;
  copyAddress: () => void;
  toggleBalance: () => void;
  setNetwork: (network: NetworkType) => void;
  explorerUrl: string | null;
  errorMessage: string | null;
  retryConnect: () => void;
}

const STORAGE_KEY = "bagsfun_wallet";
const BALANCE_KEY = "bagsfun_show_balance";

export function addressToColor(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function generateMockAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const WALLETS: WalletInfo[] = [
  { name: "phantom", label: "Phantom", icon: "👻", installUrl: "https://phantom.app/", installed: true },
  { name: "solflare", label: "Solflare", icon: "🔆", installUrl: "https://solflare.com/", installed: true },
  { name: "backpack", label: "Backpack", icon: "🎒", installUrl: "https://backpack.app/", installed: false },
];

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [network, setNetworkState] = useState<NetworkType>("mainnet-beta");
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem(BALANCE_KEY) === "true");
  const [selectedWallet, setSelectedWallet] = useState<WalletName | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAttemptedWallet, setLastAttemptedWallet] = useState<WalletName | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.wallet && data.address) {
          setSelectedWallet(data.wallet);
          setAddress(data.address);
          setBalance(data.balance ?? Math.random() * 50);
          setNetworkState(data.network ?? "mainnet-beta");
          setStatus("connected");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const connect = useCallback(async (walletName: WalletName) => {
    const wallet = WALLETS.find((w) => w.name === walletName);
    if (!wallet) return;
    setLastAttemptedWallet(walletName);
    setErrorMessage(null);
    if (!wallet.installed) {
      setErrorMessage(`${wallet.label} is not installed.`);
      setStatus("error");
      toast.error(`${wallet.label} not found`, {
        description: "Please install it from the official website.",
        action: { label: "Install", onClick: () => window.open(wallet.installUrl, "_blank") },
      });
      return;
    }
    setStatus("connecting");
    setSelectedWallet(walletName);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    if (Math.random() < 0.1) {
      setStatus("error");
      setErrorMessage("Connection rejected by user.");
      toast.error("Connection rejected", { description: "You declined the wallet connection request." });
      return;
    }
    const newAddress = generateMockAddress();
    const newBalance = parseFloat((Math.random() * 50 + 0.5).toFixed(4));
    setAddress(newAddress);
    setBalance(newBalance);
    setStatus("connected");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ wallet: walletName, address: newAddress, balance: newBalance, network }));
    toast.success("Wallet connected!", { description: `Connected to ${wallet.label} on ${network === "mainnet-beta" ? "Mainnet" : "Devnet"}` });
  }, [network]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAddress(null);
    setBalance(null);
    setSelectedWallet(null);
    setErrorMessage(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Wallet disconnected");
  }, []);

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
    if (address && selectedWallet) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wallet: selectedWallet, address, balance, network: net }));
    }
    toast.info(`Switched to ${net === "mainnet-beta" ? "Mainnet" : "Devnet"}`);
  }, [address, selectedWallet, balance]);

  const retryConnect = useCallback(() => {
    if (lastAttemptedWallet) connect(lastAttemptedWallet);
  }, [lastAttemptedWallet, connect]);

  const explorerUrl = address
    ? `https://explorer.solana.com/address/${address}${network === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  return (
    <WalletContext.Provider value={{ status, address, balance, network, showBalance, selectedWallet, wallets: WALLETS, connect, disconnect, copyAddress, toggleBalance, setNetwork, explorerUrl, errorMessage, retryConnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
