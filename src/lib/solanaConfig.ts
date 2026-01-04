// src/lib/solanaConfig.ts
export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta" | "localnet";

const DEFAULT_CLUSTER: SolanaCluster = "devnet";
const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_PROGRAM_ID = "EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ";

export const SOLANA_CLUSTER: SolanaCluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) ?? DEFAULT_CLUSTER;

export const RPC_URL: string =
  process.env.NEXT_PUBLIC_RPC_URL ?? DEFAULT_RPC_URL;

export const PROGRAM_ID: string =
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? DEFAULT_PROGRAM_ID;

export const IS_DEVNET = SOLANA_CLUSTER === "devnet";

export function shortenAddress(addr: string, left = 4, right = 4) {
  if (!addr) return "";
  if (addr.length <= left + right + 1) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}

export function explorerAddressUrl(address: string, cluster: SolanaCluster) {
  // Solana Explorer uses ?cluster=devnet/testnet/mainnet-beta
  // (If cluster is localnet, devnet link is still better than broken.)
  const safeCluster =
    cluster === "localnet" ? "devnet" : (cluster as Exclude<SolanaCluster, "localnet">);

  return `https://explorer.solana.com/address/${address}?cluster=${safeCluster}`;
}
