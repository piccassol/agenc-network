"use client";

import { useState } from "react";
import { useTasks, TaskWithPDA } from "@/hooks/useTasks";
import { useAgent } from "@/hooks/useAgent";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getTaskStatusName,
  getTaskTypeName,
  getCapabilityNames,
  bytesToString,
} from "@/idl/types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function TaskBoard() {
  const { publicKey } = useWallet();
  const { openTasks, loading, error, claimTask, refresh } = useTasks();
  const { agent } = useAgent();

  const [selectedTask, setSelectedTask] = useState<TaskWithPDA | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleClaim = async (task: TaskWithPDA) => {
    if (!agent) {
      setTxStatus("You must register as an agent first");
      return;
    }

    // Check if agent has required capabilities
    const agentCaps = BigInt(agent.capabilities.toString());
    const requiredCaps = BigInt(task.requiredCapabilities.toString());
    if ((agentCaps & requiredCaps) !== requiredCaps) {
      setTxStatus("You don't have the required capabilities for this task");
      return;
    }

    setIsClaiming(true);
    setTxStatus(null);

    try {
      const tx = await claimTask(task);
      setTxStatus(`Task claimed! TX: ${tx.slice(0, 8)}...`);
      setSelectedTask(null);
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatDeadline = (deadline: number) => {
    if (deadline === 0) return "No deadline";
    const date = new Date(deadline * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const isExpired = (deadline: number) => {
    if (deadline === 0) return false;
    return Date.now() > deadline * 1000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Available Tasks</h2>
          <p className="text-dark-400 text-sm mt-1">
            {openTasks.length} open task{openTasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          Refresh
        </button>
      </div>

      {!agent && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
          You need to register as an agent before claiming tasks.
        </div>
      )}

      {txStatus && (
        <div className={`p-4 rounded-lg ${
          txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {txStatus}
        </div>
      )}

      {openTasks.length === 0 ? (
        <div className="text-center py-12 text-dark-400">
          No open tasks available. Check back later or create one!
        </div>
      ) : (
        <div className="grid gap-4">
          {openTasks.map((task) => {
            const reward = task.rewardAmount.toNumber() / LAMPORTS_PER_SOL;
            const deadline = task.deadline.toNumber();
            const requiredCaps = getCapabilityNames(task.requiredCapabilities.toNumber());
            const description = bytesToString(task.description);
            const expired = isExpired(deadline);

            // Check if current user has capabilities
            const agentCaps = agent ? BigInt(agent.capabilities.toString()) : 0n;
            const taskCaps = BigInt(task.requiredCapabilities.toString());
            const hasCapabilities = agent && (agentCaps & taskCaps) === taskCaps;

            return (
              <div
                key={task.publicKey.toBase58()}
                className={`bg-dark-900 rounded-lg border p-4 ${
                  expired ? "border-dark-600 opacity-60" : "border-dark-700 hover:border-dark-600"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        getTaskTypeName(task.taskType) === "Exclusive"
                          ? "bg-blue-500/20 text-blue-400"
                          : getTaskTypeName(task.taskType) === "Collaborative"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {getTaskTypeName(task.taskType)}
                      </span>
                      <span className="text-dark-400 text-xs">
                        {task.currentWorkers}/{task.maxWorkers} workers
                      </span>
                    </div>

                    <p className="text-dark-200 mb-3 line-clamp-2">
                      {description || "No description"}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {requiredCaps.map((cap) => (
                        <span
                          key={cap}
                          className={`px-2 py-0.5 text-xs rounded ${
                            hasCapabilities ? "bg-green-500/20 text-green-400" : "bg-dark-700 text-dark-400"
                          }`}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span>
                        Creator: {task.creator.toBase58().slice(0, 4)}...{task.creator.toBase58().slice(-4)}
                      </span>
                      <span className={expired ? "text-red-400" : ""}>
                        Deadline: {formatDeadline(deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-primary-400">
                      {reward.toFixed(4)} SOL
                    </div>
                    <button
                      onClick={() => handleClaim(task)}
                      disabled={!agent || !hasCapabilities || expired || isClaiming}
                      className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClaiming ? "Claiming..." : "Claim Task"}
                    </button>
                    {agent && !hasCapabilities && (
                      <span className="text-xs text-red-400">Missing capabilities</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
