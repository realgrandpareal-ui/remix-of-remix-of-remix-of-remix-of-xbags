import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import type { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

interface SolanaWalletProviderProps {
  children: ReactNode;
  network?: WalletAdapterNetwork;
}

const SolanaWalletProvider = ({
  children,
  network = "mainnet-beta" as WalletAdapterNetwork,
}: SolanaWalletProviderProps) => {
  const endpoint = useMemo(() => {
    // Use public RPC endpoints
    if (network === "devnet") return clusterApiUrl("devnet");
    return clusterApiUrl("mainnet-beta");
  }, [network]);

  // Wallets auto-detect from browser extensions (standard wallet adapter)
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
