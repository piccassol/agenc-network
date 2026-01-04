"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram, getAgentPDA, getProtocolConfigPDA, AccountNamespace } from "./useProgram";
import { AgentRegistration, generateAgentId } from "@/idl/types";
import { BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export function useAgent() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [agent, setAgent] = useState<AgentRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!publicKey || !program) {
      setAgent(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [agentPDA] = getAgentPDA(agentId);

      const accounts = program.account as AccountNamespace;
      const agentAccount = await accounts.agentRegistration.fetchNullable(agentPDA);
      setAgent(agentAccount as AgentRegistration | null);
    } catch (err: unknown) {
      console.error("Failed to fetch agent:", err);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const registerAgent = async (
    capabilities: bigint,
    endpoint: string,
    metadataUri?: string,
    _stakeAmount?: number
  ) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [agentPDA] = getAgentPDA(agentId);
      const [protocolConfig] = getProtocolConfigPDA();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .registerAgent(
          Array.from(agentId),
          new BN(capabilities.toString()),
          endpoint,
          metadataUri || null
        )
        .accounts({
          agent: agentPDA,
          protocolConfig,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Register agent tx:", tx);
      await fetchAgent();
      return tx;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to register agent");
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deregisterAgent = async () => {
    if (!publicKey || !program || !agent) {
      throw new Error("No agent to deregister");
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [agentPDA] = getAgentPDA(agentId);
      const [protocolConfig] = getProtocolConfigPDA();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .deregisterAgent()
        .accounts({
          agent: agentPDA,
          protocolConfig,
          authority: publicKey,
        })
        .rpc();

      console.log("Deregister agent tx:", tx);
      setAgent(null);
      return tx;
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to deregister agent");
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    agent,
    loading,
    error,
    registerAgent,
    deregisterAgent,
    refresh: fetchAgent,
  };
}
