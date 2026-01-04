"use client";

import { useState } from "react";
import { useTasks, useTaskClaims, TaskWithPDA } from "@/hooks/useTasks";
import { useDisputes } from "@/hooks/useDisputes";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getTaskStatusName,
  getTaskTypeName,
  getCapabilityNames,
  bytesToString,
} from "@/idl/types";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export function MyTasks() {
  const { publicKey } = useWallet();
  const { tasks, myCreatedTasks, loading, cancelTask, completeTask, refresh } = useTasks();
  const { claims, loading: claimsLoading, refresh: refreshClaims } = useTaskClaims();
  const { initiateDispute } = useDisputes();

  const [activeTab, setActiveTab] = useState<"created" | "claimed">("created");
  const [selectedTask, setSelectedTask] = useState<TaskWithPDA | null>(null);
  const [proofHash, setProofHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState("");
  const [resolutionType, setResolutionType] = useState(0);

  // Get tasks that user has claimed
  const claimedTasks = claims
    .map((c) => {
      const task = tasks.find((t) => t.publicKey.equals(c.claim.task));
      return task ? { task, claim: c.claim } : null;
    })
    .filter((x): x is { task: TaskWithPDA; claim: typeof claims[0]["claim"] } => x !== null);

  const handleCancel = async (task: TaskWithPDA) => {
    if (!confirm("Are you sure you want to cancel this task? Funds will be returned.")) {
      return;
    }

    setIsProcessing(true);
    setTxStatus(null);

    try {
      const tx = await cancelTask(task);
      setTxStatus(`Task cancelled! TX: ${tx.slice(0, 8)}...`);
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async (task: TaskWithPDA) => {
    if (!proofHash.trim()) {
      setTxStatus("Please enter a proof hash");
      return;
    }

    setIsProcessing(true);
    setTxStatus(null);

    try {
      const tx = await completeTask(task, proofHash.trim());
      setTxStatus(`Task completed! TX: ${tx.slice(0, 8)}...`);
      setSelectedTask(null);
      setProofHash("");
      refreshClaims();
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiateDispute = async (task: TaskWithPDA) => {
    if (!evidenceHash.trim()) {
      setTxStatus("Please enter evidence hash");
      return;
    }

    setIsProcessing(true);
    setTxStatus(null);

    try {
      const tx = await initiateDispute(task, evidenceHash.trim(), resolutionType);
      setTxStatus(`Dispute initiated! TX: ${tx.slice(0, 8)}...`);
      setShowDisputeModal(false);
      setSelectedTask(null);
      setEvidenceHash("");
      refresh();
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDeadline = (deadline: number) => {
    if (deadline === 0) return "No deadline";
    const date = new Date(deadline * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "text-green-400 bg-green-500/20";
      case "In Progress": return "text-blue-400 bg-blue-500/20";
      case "Completed": return "text-primary-400 bg-primary-500/20";
      case "Cancelled": return "text-dark-400 bg-dark-700";
      case "Disputed": return "text-red-400 bg-red-500/20";
      default: return "text-dark-400 bg-dark-700";
    }
  };

  if (loading || claimsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Tasks</h2>
        <button
          onClick={() => {
            refresh();
            refreshClaims();
          }}
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dark-700">
        <button
          onClick={() => setActiveTab("created")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "created"
              ? "border-primary-400 text-primary-400"
              : "border-transparent text-dark-400 hover:text-dark-200"
          }`}
        >
          Tasks I Created ({myCreatedTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("claimed")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "claimed"
              ? "border-primary-400 text-primary-400"
              : "border-transparent text-dark-400 hover:text-dark-200"
          }`}
        >
          Tasks I Claimed ({claimedTasks.length})
        </button>
      </div>

      {txStatus && (
        <div className={`p-4 rounded-lg ${
          txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {txStatus}
        </div>
      )}

      {/* Created Tasks */}
      {activeTab === "created" && (
        <div className="space-y-4">
          {myCreatedTasks.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              You haven't created any tasks yet.
            </div>
          ) : (
            myCreatedTasks.map((task) => {
              const reward = task.rewardAmount.toNumber() / LAMPORTS_PER_SOL;
              const status = getTaskStatusName(task.status);
              const description = bytesToString(task.description);
              const canCancel = status === "Open" ||
                (task.deadline.toNumber() > 0 && Date.now() > task.deadline.toNumber() * 1000);
              const canDispute = status === "In Progress";

              return (
                <div
                  key={task.publicKey.toBase58()}
                  className="bg-dark-900 rounded-lg border border-dark-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <span className="text-dark-400 text-xs">
                          {task.currentWorkers}/{task.maxWorkers} workers
                        </span>
                      </div>

                      <p className="text-dark-200 mb-2">{description || "No description"}</p>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {getCapabilityNames(task.requiredCapabilities.toNumber()).map((cap) => (
                          <span key={cap} className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>

                      <div className="text-sm text-dark-400">
                        Deadline: {formatDeadline(task.deadline.toNumber())}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-primary-400">
                        {reward.toFixed(4)} SOL
                      </div>
                      <div className="flex gap-2">
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(task)}
                            disabled={isProcessing}
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {canDispute && (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDisputeModal(true);
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50"
                          >
                            Dispute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Claimed Tasks */}
      {activeTab === "claimed" && (
        <div className="space-y-4">
          {claimedTasks.length === 0 ? (
            <div className="text-center py-12 text-dark-400">
              You haven't claimed any tasks yet.
            </div>
          ) : (
            claimedTasks.map(({ task, claim }) => {
              const reward = task.rewardAmount.toNumber() / LAMPORTS_PER_SOL;
              const status = getTaskStatusName(task.status);
              const description = bytesToString(task.description);
              const canComplete = !claim.isCompleted && status === "In Progress";

              return (
                <div
                  key={task.publicKey.toBase58()}
                  className="bg-dark-900 rounded-lg border border-dark-700 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        {claim.isCompleted && (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                            Your Work: Completed
                          </span>
                        )}
                      </div>

                      <p className="text-dark-200 mb-2">{description || "No description"}</p>

                      <div className="text-sm text-dark-400">
                        Creator: {task.creator.toBase58().slice(0, 8)}...
                      </div>

                      {claim.rewardPaid.toNumber() > 0 && (
                        <div className="text-sm text-green-400 mt-1">
                          Reward received: {(claim.rewardPaid.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-primary-400">
                        {reward.toFixed(4)} SOL
                      </div>
                      {canComplete && (
                        <button
                          onClick={() => setSelectedTask(task)}
                          disabled={isProcessing}
                          className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Complete Task Modal */}
      {selectedTask && !showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Complete Task</h3>
            <p className="text-dark-400 mb-4">
              Submit proof of your work to complete the task and receive payment.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Proof Hash</label>
              <input
                type="text"
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                placeholder="Enter proof hash (e.g., IPFS CID)"
                className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <p className="text-dark-400 text-sm mt-1">
                Hash of your work proof (max 32 bytes stored on-chain)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setProofHash("");
                }}
                className="flex-1 py-2 border border-dark-600 rounded-lg hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleComplete(selectedTask)}
                disabled={isProcessing || !proofHash.trim()}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Initiate Dispute</h3>
            <p className="text-dark-400 mb-4">
              Open a dispute for this task. Arbiters will vote on the resolution.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Evidence Hash</label>
                <input
                  type="text"
                  value={evidenceHash}
                  onChange={(e) => setEvidenceHash(e.target.value)}
                  placeholder="Hash of your evidence"
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Requested Resolution</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value={0}>Refund - Return funds to creator</option>
                  <option value={1}>Complete - Pay worker</option>
                  <option value={2}>Split - Split between parties</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedTask(null);
                    setEvidenceHash("");
                  }}
                  className="flex-1 py-2 border border-dark-600 rounded-lg hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleInitiateDispute(selectedTask)}
                  disabled={isProcessing || !evidenceHash.trim()}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Initiate Dispute"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
