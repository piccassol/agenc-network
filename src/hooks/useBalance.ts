"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let mounted = true;

    async function fetchBalance() {
      setLoading(true);
      try {
        const lamports = await connection.getBalance(publicKey!);
        if (mounted) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        if (mounted) {
          setBalance(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchBalance();

    // Subscribe to balance changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (account) => {
        if (mounted) {
          setBalance(account.lamports / LAMPORTS_PER_SOL);
        }
      },
      "confirmed"
    );

    return () => {
      mounted = false;
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey]);

  const refresh = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, refresh };
}
