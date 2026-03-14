import { clusterApiUrl } from "@solana/web3.js";

export function getRpcUrl(network: "mainnet-beta" | "devnet" = "mainnet-beta"): string {
  return clusterApiUrl(network);
}
