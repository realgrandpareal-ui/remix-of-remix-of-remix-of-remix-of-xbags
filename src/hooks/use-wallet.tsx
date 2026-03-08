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
export type ChainType = "solana" | "base";

export interface ChainBalance {
  chain: ChainType;
  address: string;
  balance: number;
  usdValue: number;
  symbol: string;
  networkLabel: string;
}

export interface WalletAccount {
  id: string;
  name: string;
  walletName: WalletName;
  chains: ChainBalance[];
}

export interface WalletInfo {
  name: WalletName;
  label: string;
  icon: string;
  description: string;
  installUrl: string;
  installed: boolean;
}

interface WalletContextType {
  status: WalletStatus;
  activeAccount: WalletAccount | null;
  accounts: WalletAccount[];
  network: NetworkType;
  showBalance: boolean;
  wallets: WalletInfo[];
  connect: (walletName: WalletName) => Promise<void>;
  disconnect: () => void;
  switchAccount: (accountId: string) => void;
  copyAddress: (address: string) => void;
  toggleBalance: () => void;
  setNetwork: (network: NetworkType) => void;
  explorerUrl: (chain: ChainType, address: string) => string;
  errorMessage: string | null;
  retryConnect: () => void;
  totalUsdBalance: number;
}

const STORAGE_KEY = "bagsfun_wallet_v2";
const BALANCE_KEY = "bagsfun_show_balance";

export function truncateAddress(address: string, startLen = 4, endLen = 4): string {
  if (!address) return "";
  if (address.length <= startLen + endLen + 3) return address;
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`;
}

function generateSolAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function generateEthAddress(): string {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < 40; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function generateAccountName(): string {
  const names = ["doge", "anon", "chad", "based", "wagmi", "creator", "builder"];
  return names[Math.floor(Math.random() * names.length)];
}

const WALLETS: WalletInfo[] = [
  { name: "phantom", label: "Phantom", icon: "👻", description: "Popular Solana wallet", installUrl: "https://phantom.app/", installed: true },
  { name: "solflare", label: "Solflare", icon: "🔆", description: "Secure & fast", installUrl: "https://solflare.com/", installed: true },
  { name: "backpack", label: "Backpack", icon: "🎒", description: "Next-gen wallet", installUrl: "https://backpack.app/", installed: false },
];

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [network, setNetworkState] = useState<NetworkType>("mainnet-beta");
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem(BALANCE_KEY) === "true");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAttemptedWallet, setLastAttemptedWallet] = useState<WalletName | null>(null);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || null;
  const totalUsdBalance = activeAccount
    ? activeAccount.chains.reduce((sum, c) => sum + c.usdValue, 0)
    : 0;

  // Auto-reconnect
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.accounts?.length > 0) {
          setAccounts(data.accounts);
          setActiveAccountId(data.activeAccountId || data.accounts[0].id);
          setNetworkState(data.network ?? "mainnet-beta");
          setStatus("connected");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveState = useCallback((accs: WalletAccount[], activeId: string, net: NetworkType) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accounts: accs, activeAccountId: activeId, network: net }));
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
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    if (Math.random() < 0.08) {
      setStatus(accounts.length > 0 ? "connected" : "error");
      setErrorMessage("Connection rejected by user.");
      toast.error("Connection rejected", { description: "You declined the wallet connection request." });
      return;
    }

    const name = generateAccountName();
    const solBalance = parseFloat((Math.random() * 10).toFixed(4));
    const baseBalance = parseFloat((Math.random() * 0.5).toFixed(6));
    const newAccount: WalletAccount = {
      id: crypto.randomUUID(),
      name,
      walletName,
      chains: [
        { chain: "solana", address: generateSolAddress(), balance: solBalance, usdValue: parseFloat((solBalance * 20).toFixed(2)), symbol: "SOL", networkLabel: "SOL" },
        { chain: "base", address: generateEthAddress(), balance: baseBalance, usdValue: parseFloat((baseBalance * 3200).toFixed(2)), symbol: "ETH", networkLabel: "BASE" },
      ],
    };

    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    setActiveAccountId(newAccount.id);
    setStatus("connected");
    saveState(newAccounts, newAccount.id, network);
    toast.success("Wallet connected!", { description: `Connected as ${name} via ${wallet.label}` });
  }, [accounts, network, saveState]);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setAccounts([]);
    setActiveAccountId(null);
    setErrorMessage(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("Logged out successfully");
  }, []);

  const switchAccount = useCallback((accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) {
      setActiveAccountId(accountId);
      saveState(accounts, accountId, network);
      toast.success(`Switched to ${acc.name}`);
    }
  }, [accounts, network, saveState]);

  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  }, []);

  const toggleBalance = useCallback(() => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem(BALANCE_KEY, String(next));
      return next;
    });
  }, []);

  const setNetwork = useCallback((net: NetworkType) => {
    setNetworkState(net);
    if (activeAccountId) saveState(accounts, activeAccountId, net);
    toast.info(`Switched to ${net === "mainnet-beta" ? "Mainnet" : "Devnet"}`);
  }, [accounts, activeAccountId, saveState]);

  const retryConnect = useCallback(() => {
    if (lastAttemptedWallet) connect(lastAttemptedWallet);
  }, [lastAttemptedWallet, connect]);

  const explorerUrl = useCallback((chain: ChainType, address: string) => {
    if (chain === "base") return `https://basescan.org/address/${address}`;
    return `https://explorer.solana.com/address/${address}${network === "devnet" ? "?cluster=devnet" : ""}`;
  }, [network]);

  return (
    <WalletContext.Provider value={{
      status, activeAccount, accounts, network, showBalance, wallets: WALLETS,
      connect, disconnect, switchAccount, copyAddress, toggleBalance, setNetwork,
      explorerUrl, errorMessage, retryConnect, totalUsdBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
