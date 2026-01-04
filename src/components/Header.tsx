"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "@/hooks/useBalance";

// Dynamic import WalletMultiButton to avoid SSR hydration issues
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export function Header() {
  const { connected, publicKey } = useWallet();
  const { balance } = useBalance();

  return (
    <header className="border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-bold text-lg">
            A
          </div>
          <div>
            <h1 className="font-bold text-lg">AgenC</h1>
            <p className="text-xs text-dark-400">Devnet</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {connected && publicKey && (
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="text-dark-400">
                <span className="text-dark-200">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "..."}
                </span>
              </div>
              <div className="text-dark-500">|</div>
              <div className="text-dark-400">
                <span className="text-dark-300">
                  {publicKey.toBase58().slice(0, 4)}...
                  {publicKey.toBase58().slice(-4)}
                </span>
              </div>
            </div>
          )}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
