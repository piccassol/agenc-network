"use client";

import { useState } from "react";
import { useAgent } from "@/hooks/useAgent";
import { useProtocolConfig } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  getAgentStatusName,
  getCapabilityNames,
  capabilitiesToBitmask,
} from "@/idl/types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const CAPABILITY_OPTIONS = ["Compute", "Inference", "Storage", "Verification"];

export function AgentDashboard() {
  const { publicKey } = useWallet();
  const { agent, loading, error, registerAgent, deregisterAgent, refresh } = useAgent();
  const { error: protocolError } = useProtocolConfig();

  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const handleRegister = async () => {
    if (selectedCaps.length === 0) {
      setTxStatus("Please select at least one capability");
      return;
    }
    if (!endpoint) {
      setTxStatus("Please enter an endpoint");
      return;
    }

    setIsRegistering(true);
    setTxStatus(null);

    try {
      const capabilities = capabilitiesToBitmask(selectedCaps);
      const stake = stakeAmount ? parseFloat(stakeAmount) : undefined;
      const tx = await registerAgent(capabilities, endpoint, metadataUri || undefined, stake);
      setTxStatus(`Registered! TX: ${tx.slice(0, 8)}...`);
      setSelectedCaps([]);
      setEndpoint("");
      setMetadataUri("");
      setStakeAmount("");
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeregister = async () => {
    if (!confirm("Are you sure you want to deregister? This will close your agent account.")) {
      return;
    }

    setIsRegistering(true);
    setTxStatus(null);

    try {
      const tx = await deregisterAgent();
      setTxStatus(`Deregistered! TX: ${tx.slice(0, 8)}...`);
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const toggleCapability = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  // Agent is registered - show stats
  if (agent) {
    const capabilities = getCapabilityNames(agent.capabilities.toNumber());
    const status = getAgentStatusName(agent.status);
    const stake = agent.stake.toNumber() / LAMPORTS_PER_SOL;
    const earned = agent.totalEarned.toNumber() / LAMPORTS_PER_SOL;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Agent</h2>
          <button
            onClick={() => refresh()}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <div className="text-dark-400 text-sm mb-1">Status</div>
            <div className={`font-semibold ${
              status === "Active" ? "text-green-400" :
              status === "Busy" ? "text-yellow-400" :
              "text-dark-300"
            }`}>
              {status}
            </div>
          </div>

          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <div className="text-dark-400 text-sm mb-1">Reputation</div>
            <div className="font-semibold text-primary-400">
              {agent.reputation} / 10000
            </div>
          </div>

          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <div className="text-dark-400 text-sm mb-1">Tasks Completed</div>
            <div className="font-semibold">{agent.tasksCompleted.toString()}</div>
          </div>

          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <div className="text-dark-400 text-sm mb-1">Total Earned</div>
            <div className="font-semibold">{earned.toFixed(4)} SOL</div>
          </div>
        </div>

        <div className="bg-dark-900 rounded-lg p-6 border border-dark-700">
          <h3 className="font-semibold mb-4">Agent Details</h3>
          <div className="space-y-4">
            <div>
              <div className="text-dark-400 text-sm mb-1">Capabilities</div>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-dark-400 text-sm mb-1">Endpoint</div>
              <div className="font-mono text-sm text-dark-200">{agent.endpoint || "Not set"}</div>
            </div>

            <div>
              <div className="text-dark-400 text-sm mb-1">Stake Amount</div>
              <div>{stake.toFixed(4)} SOL</div>
            </div>

            <div>
              <div className="text-dark-400 text-sm mb-1">Active Tasks</div>
              <div>{agent.activeTasks}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-700 pt-6">
          <button
            onClick={handleDeregister}
            disabled={isRegistering || agent.activeTasks > 0}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? "Processing..." : "Deregister Agent"}
          </button>
          {agent.activeTasks > 0 && (
            <p className="text-dark-400 text-sm mt-2">
              Complete all active tasks before deregistering.
            </p>
          )}
        </div>

        {txStatus && (
          <div className={`p-4 rounded-lg ${
            txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
          }`}>
            {txStatus}
          </div>
        )}
      </div>
    );
  }

  // Agent not registered - show registration form
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Register as Agent</h2>
        <p className="text-dark-400">
          Register on-chain to start accepting and completing tasks.
        </p>
      </div>

      {protocolError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
          {protocolError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Capabilities</label>
          <div className="flex flex-wrap gap-2">
            {CAPABILITY_OPTIONS.map((cap) => (
              <button
                key={cap}
                onClick={() => toggleCapability(cap)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedCaps.includes(cap)
                    ? "bg-primary-500/20 border-primary-500 text-primary-400"
                    : "border-dark-600 text-dark-300 hover:border-dark-500"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Endpoint <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-agent.example.com/api"
            className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <p className="text-dark-400 text-sm mt-1">
            Network endpoint for off-chain communication
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Metadata URI (optional)
          </label>
          <input
            type="text"
            value={metadataUri}
            onChange={(e) => setMetadataUri(e.target.value)}
            placeholder="ipfs://... or arweave://..."
            className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <p className="text-dark-400 text-sm mt-1">
            Link to extended metadata (IPFS, Arweave)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Stake (future) (optional)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <p className="text-dark-400 text-sm mt-1">
            This is not enforced by the current register instruction.
          </p>
        </div>

        <button
          onClick={handleRegister}
          disabled={isRegistering || selectedCaps.length === 0 || !endpoint || !!protocolError}
          className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? "Registering..." : "Register Agent"}
        </button>

        {txStatus && (
          <div className={`p-4 rounded-lg ${
            txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
          }`}>
            {txStatus}
          </div>
        )}
      </div>
    </div>
  );
}
