"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram, getDisputePDA, getAgentPDA, getVotePDA, getProtocolConfigPDA, AccountNamespace } from "./useProgram";
import { Dispute, generateTaskId, stringToBytes, generateAgentId } from "@/idl/types";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { TaskWithPDA } from "./useTasks";

export interface DisputeWithPDA extends Dispute {
  publicKey: PublicKey;
}

export function useDisputes() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [disputes, setDisputes] = useState<DisputeWithPDA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDisputes = useCallback(async () => {
    if (!program) {
      setDisputes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accounts = program.account as AccountNamespace;
      const allDisputes = await accounts.dispute.all();
      setDisputes(
        allDisputes.map((d) => ({
          ...(d.account as Dispute),
          publicKey: d.publicKey,
        }))
      );
    } catch (err: unknown) {
      console.error("Failed to fetch disputes:", err);
      setError("Failed to fetch disputes");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchAllDisputes();
  }, [fetchAllDisputes]);

  const initiateDispute = async (
    task: TaskWithPDA,
    evidenceHash: string,
    resolutionType: number
  ) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const disputeId = generateTaskId(); // Reuse random ID generator
      const [disputePDA] = getDisputePDA(disputeId);
      const agentId = generateAgentId(publicKey);
      const [agentPDA] = getAgentPDA(agentId);

      const evidenceBytes = stringToBytes(evidenceHash, 32);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .initiateDispute(
          Array.from(disputeId),
          Array.from(task.taskId),
          evidenceBytes,
          resolutionType
        )
        .accounts({
          dispute: disputePDA,
          task: task.publicKey,
          agent: agentPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initiate dispute tx:", tx);
      await fetchAllDisputes();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate dispute";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const voteDispute = async (dispute: DisputeWithPDA, approve: boolean) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [arbiterPDA] = getAgentPDA(agentId);
      const [votePDA] = getVotePDA(dispute.publicKey, arbiterPDA);
      const [protocolConfig] = getProtocolConfigPDA();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .voteDispute(approve)
        .accounts({
          dispute: dispute.publicKey,
          vote: votePDA,
          arbiter: arbiterPDA,
          protocolConfig,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Vote dispute tx:", tx);
      await fetchAllDisputes();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to vote on dispute";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filter active disputes
  const activeDisputes = disputes.filter((d) => "active" in d.status);

  return {
    disputes,
    activeDisputes,
    loading,
    error,
    initiateDispute,
    voteDispute,
    refresh: fetchAllDisputes,
  };
}
