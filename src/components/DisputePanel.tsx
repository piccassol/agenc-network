"use client";

import { useState } from "react";
import { useDisputes, DisputeWithPDA } from "@/hooks/useDisputes";
import { useAgent } from "@/hooks/useAgent";
import { useTasks } from "@/hooks/useTasks";
import {
  getDisputeStatusName,
  getResolutionTypeName,
  bytesToString,
  Capabilities,
} from "@/idl/types";

export function DisputePanel() {
  const { disputes, activeDisputes, loading, voteDispute, refresh } = useDisputes();
  const { agent } = useAgent();
  const { tasks } = useTasks();

  const [isVoting, setIsVoting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Check if user is an arbiter (has VERIFICATION capability and stake)
  const isArbiter = agent && (
    BigInt(agent.capabilities.toString()) & Capabilities.VERIFICATION
  ) !== 0n;

  const handleVote = async (dispute: DisputeWithPDA, approve: boolean) => {
    setIsVoting(true);
    setTxStatus(null);

    try {
      const tx = await voteDispute(dispute, approve);
      setTxStatus(`Vote submitted! TX: ${tx.slice(0, 8)}...`);
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "text-yellow-400 bg-yellow-500/20";
      case "Resolved": return "text-green-400 bg-green-500/20";
      case "Expired": return "text-dark-400 bg-dark-700";
      default: return "text-dark-400 bg-dark-700";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
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
          <h2 className="text-xl font-semibold">Disputes</h2>
          <p className="text-dark-400 text-sm mt-1">
            {activeDisputes.length} active dispute{activeDisputes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          Refresh
        </button>
      </div>

      {!isArbiter && agent && (
        <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
          <p className="text-dark-400">
            <span className="text-yellow-400 font-medium">Note:</span> To vote on disputes,
            you need the Verification capability. Update your agent registration to participate.
          </p>
        </div>
      )}

      {!agent && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
          Register as an agent with Verification capability to vote on disputes.
        </div>
      )}

      {txStatus && (
        <div className={`p-4 rounded-lg ${
          txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        }`}>
          {txStatus}
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="text-center py-12 text-dark-400">
          No disputes found.
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const status = getDisputeStatusName(dispute.status);
            const resolutionType = getResolutionTypeName(dispute.resolutionType);
            const task = tasks.find((t) => t.publicKey.equals(dispute.task));
            const taskDescription = task ? bytesToString(task.description) : "Task not found";
            const canVote = isArbiter && status === "Active";
            const votingDeadline = dispute.votingDeadline.toNumber();
            const isExpired = votingDeadline > 0 && Date.now() > votingDeadline * 1000;

            return (
              <div
                key={dispute.publicKey.toBase58()}
                className="bg-dark-900 rounded-lg border border-dark-700 p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-dark-700 text-dark-300 rounded">
                        {resolutionType}
                      </span>
                    </div>
                    <p className="text-dark-200 mb-1">
                      <span className="text-dark-400">Task:</span> {taskDescription}
                    </p>
                    <p className="text-sm text-dark-400">
                      Initiator: {dispute.initiator.toBase58().slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-dark-400 text-xs">Votes For</div>
                    <div className="text-green-400 font-semibold">{dispute.votesFor}</div>
                  </div>
                  <div>
                    <div className="text-dark-400 text-xs">Votes Against</div>
                    <div className="text-red-400 font-semibold">{dispute.votesAgainst}</div>
                  </div>
                  <div>
                    <div className="text-dark-400 text-xs">Total Voters</div>
                    <div className="font-semibold">{dispute.totalVoters}</div>
                  </div>
                  <div>
                    <div className="text-dark-400 text-xs">Voting Deadline</div>
                    <div className={`text-sm ${isExpired ? "text-red-400" : ""}`}>
                      {formatTimestamp(votingDeadline)}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-dark-400 text-xs mb-1">Evidence Hash</div>
                  <div className="font-mono text-xs text-dark-300 break-all">
                    {bytesToString(dispute.evidenceHash) || "No evidence provided"}
                  </div>
                </div>

                {canVote && !isExpired && (
                  <div className="flex gap-3 pt-4 border-t border-dark-700">
                    <button
                      onClick={() => handleVote(dispute, true)}
                      disabled={isVoting}
                      className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
                    >
                      {isVoting ? "Voting..." : "Vote For (Approve)"}
                    </button>
                    <button
                      onClick={() => handleVote(dispute, false)}
                      disabled={isVoting}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {isVoting ? "Voting..." : "Vote Against (Reject)"}
                    </button>
                  </div>
                )}

                {status === "Resolved" && (
                  <div className="pt-4 border-t border-dark-700">
                    <div className="text-green-400 text-sm">
                      Resolved at: {formatTimestamp(dispute.resolvedAt.toNumber())}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
