"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram, getTaskPDA, getEscrowPDA, getClaimPDA, getAgentPDA, getProtocolConfigPDA, AccountNamespace } from "./useProgram";
import { Task, TaskClaim, generateTaskId, stringToBytes, generateAgentId } from "@/idl/types";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, SystemProgram, PublicKey } from "@solana/web3.js";

export interface TaskWithPDA extends Task {
  publicKey: PublicKey;
}

export function useTasks() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [tasks, setTasks] = useState<TaskWithPDA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTasks = useCallback(async () => {
    if (!program) {
      setTasks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accounts = program.account as AccountNamespace;
      const allTasks = await accounts.task.all();
      setTasks(
        allTasks.map((t) => ({
          ...(t.account as Task),
          publicKey: t.publicKey,
        }))
      );
    } catch (err: unknown) {
      console.error("Failed to fetch tasks:", err);
      setError("Failed to fetch tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const createTask = async (
    requiredCapabilities: bigint,
    description: string,
    rewardAmount: number,
    maxWorkers: number,
    deadline: number,
    taskType: number
  ) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const taskId = generateTaskId();
      const [taskPDA] = getTaskPDA(publicKey, taskId);
      const [escrowPDA] = getEscrowPDA(taskPDA);
      const [protocolConfig] = getProtocolConfigPDA();

      const descBytes = stringToBytes(description, 64);
      const rewardLamports = new BN(Math.floor(rewardAmount * LAMPORTS_PER_SOL));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .createTask(
          Array.from(taskId),
          new BN(requiredCapabilities.toString()),
          descBytes,
          rewardLamports,
          maxWorkers,
          new BN(deadline),
          taskType
        )
        .accounts({
          task: taskPDA,
          escrow: escrowPDA,
          protocolConfig,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Create task tx:", tx);
      await fetchAllTasks();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create task";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (task: TaskWithPDA) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [workerPDA] = getAgentPDA(agentId);
      const [claimPDA] = getClaimPDA(task.publicKey, workerPDA);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .claimTask()
        .accounts({
          task: task.publicKey,
          claim: claimPDA,
          worker: workerPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Claim task tx:", tx);
      await fetchAllTasks();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to claim task";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (task: TaskWithPDA, proofHash: string) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const agentId = generateAgentId(publicKey);
      const [workerPDA] = getAgentPDA(agentId);
      const [claimPDA] = getClaimPDA(task.publicKey, workerPDA);
      const [escrowPDA] = getEscrowPDA(task.publicKey);
      const [protocolConfig] = getProtocolConfigPDA();

      // Get protocol config to find treasury
      const accounts = program.account as AccountNamespace;
      const config = await accounts.protocolConfig.fetch(protocolConfig);
      const treasury = (config as { treasury: PublicKey }).treasury;

      // Convert proof hash string to bytes
      const proofBytes = stringToBytes(proofHash, 32);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .completeTask(proofBytes, null)
        .accounts({
          task: task.publicKey,
          claim: claimPDA,
          escrow: escrowPDA,
          worker: workerPDA,
          protocolConfig,
          treasury,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Complete task tx:", tx);
      await fetchAllTasks();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete task";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelTask = async (task: TaskWithPDA) => {
    if (!publicKey || !program) {
      throw new Error("Wallet not connected");
    }

    setLoading(true);
    setError(null);

    try {
      const [escrowPDA] = getEscrowPDA(task.publicKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const methods = program.methods as any;
      const tx = await methods
        .cancelTask()
        .accounts({
          task: task.publicKey,
          escrow: escrowPDA,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Cancel task tx:", tx);
      await fetchAllTasks();
      return tx;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel task";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  const openTasks = tasks.filter((t) => "open" in t.status);
  const myCreatedTasks = tasks.filter(
    (t) => publicKey && t.creator.equals(publicKey)
  );

  return {
    tasks,
    openTasks,
    myCreatedTasks,
    loading,
    error,
    createTask,
    claimTask,
    completeTask,
    cancelTask,
    refresh: fetchAllTasks,
  };
}

export function useTaskClaims() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const [claims, setClaims] = useState<{ claim: TaskClaim; publicKey: PublicKey }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyClaims = useCallback(async () => {
    if (!publicKey || !program) {
      setClaims([]);
      return;
    }

    setLoading(true);
    try {
      const agentId = generateAgentId(publicKey);
      const [workerPDA] = getAgentPDA(agentId);

      const accounts = program.account as AccountNamespace;
      const allClaims = await accounts.taskClaim.all([
        {
          memcmp: {
            offset: 8 + 32, // After discriminator + task pubkey
            bytes: workerPDA.toBase58(),
          },
        },
      ]);

      setClaims(
        allClaims.map((c) => ({
          claim: c.account as TaskClaim,
          publicKey: c.publicKey,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch claims:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program]);

  useEffect(() => {
    fetchMyClaims();
  }, [fetchMyClaims]);

  return { claims, loading, refresh: fetchMyClaims };
}
