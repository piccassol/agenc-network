"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "@/idl/agenc_coordination.json";
import { PROGRAM_ID } from "@/idl/types";

// Generic program type to avoid TypeScript infinite instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnchorProgram = Program<any>;

// Type for account namespace with new Anchor 0.30+ IDL format
export type AccountNamespace = Record<string, {
  all: (filters?: unknown[]) => Promise<{ account: unknown; publicKey: PublicKey }[]>;
  fetch: (key: PublicKey) => Promise<unknown>;
  fetchNullable: (key: PublicKey) => Promise<unknown | null>;
}>;

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  const program = useMemo((): AnchorProgram | null => {
    if (!provider) {
      return null;
    }
    try {
      // Anchor 0.30+ format: IDL includes address, use new Program(idl, provider)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Program(idl as any, provider);
    } catch (err) {
      console.error("Failed to create Program:", err);
      return null;
    }
  }, [provider]);

  return { program, provider, connection };
}

export function useProtocolConfig() {
  const { program } = useProgram();
  const [config, setConfig] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!program) {
      return;
    }

    setLoading(true);

    try {
      const [protocolConfig] = getProtocolConfigPDA();
      const accounts = program.account as AccountNamespace;
      const account = await accounts.protocolConfig.fetchNullable(protocolConfig);

      if (!account) {
        setConfig(null);
        setError("Protocol not initialized on this cluster");
      } else {
        setConfig(account);
        setError(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch protocol config";
      setConfig(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, error, refresh: fetchConfig };
}

// PDA derivation helpers
export function getProtocolConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("protocol")],
    PROGRAM_ID
  );
}

export function getAgentPDA(agentId: number[] | Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), Buffer.from(agentId)],
    PROGRAM_ID
  );
}

export function getTaskPDA(creator: PublicKey, taskId: number[] | Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), Buffer.from(taskId)],
    PROGRAM_ID
  );
}

export function getEscrowPDA(task: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), task.toBuffer()],
    PROGRAM_ID
  );
}

export function getClaimPDA(task: PublicKey, worker: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("claim"), task.toBuffer(), worker.toBuffer()],
    PROGRAM_ID
  );
}

export function getDisputePDA(disputeId: number[] | Uint8Array): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("dispute"), Buffer.from(disputeId)],
    PROGRAM_ID
  );
}

export function getVotePDA(dispute: PublicKey, arbiter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), dispute.toBuffer(), arbiter.toBuffer()],
    PROGRAM_ID
  );
}

export { SystemProgram };
