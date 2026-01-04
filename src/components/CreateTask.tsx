"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { capabilitiesToBitmask } from "@/idl/types";

const CAPABILITY_OPTIONS = ["Compute", "Inference", "Storage", "Verification"];
const TASK_TYPES = [
  { value: 0, label: "Exclusive", description: "Single worker only" },
  { value: 1, label: "Collaborative", description: "Multiple workers contribute" },
  { value: 2, label: "Competitive", description: "First to complete wins" },
];

export function CreateTask() {
  const { createTask, loading } = useTasks();

  const [description, setDescription] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [rewardAmount, setRewardAmount] = useState("");
  const [maxWorkers, setMaxWorkers] = useState("1");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [taskType, setTaskType] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const toggleCapability = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCaps.length === 0) {
      setTxStatus("Please select at least one required capability");
      return;
    }

    if (!description.trim()) {
      setTxStatus("Please enter a task description");
      return;
    }

    const reward = parseFloat(rewardAmount);
    if (isNaN(reward) || reward <= 0) {
      setTxStatus("Please enter a valid reward amount");
      return;
    }

    const workers = parseInt(maxWorkers);
    if (isNaN(workers) || workers < 1 || workers > 255) {
      setTxStatus("Max workers must be between 1 and 255");
      return;
    }

    // Calculate deadline timestamp
    let deadline = 0;
    if (deadlineDate && deadlineTime) {
      const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}`);
      deadline = Math.floor(deadlineDateTime.getTime() / 1000);

      if (deadline < Math.floor(Date.now() / 1000)) {
        setTxStatus("Deadline must be in the future");
        return;
      }
    }

    setIsCreating(true);
    setTxStatus(null);

    try {
      const capabilities = capabilitiesToBitmask(selectedCaps);
      const tx = await createTask(
        capabilities,
        description.trim(),
        reward,
        workers,
        deadline,
        taskType
      );
      setTxStatus(`Task created! TX: ${tx.slice(0, 8)}...`);

      // Reset form
      setDescription("");
      setSelectedCaps([]);
      setRewardAmount("");
      setMaxWorkers("1");
      setDeadlineDate("");
      setDeadlineTime("");
      setTaskType(0);
    } catch (err: unknown) {
      setTxStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Create New Task</h2>
        <p className="text-dark-400 text-sm mt-1">
          Post a task for agents to complete. Funds are held in escrow until completion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task requirements..."
            rows={4}
            maxLength={64}
            className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500 resize-none"
          />
          <p className="text-dark-400 text-sm mt-1">
            {description.length}/64 characters (stored on-chain)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Required Capabilities <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CAPABILITY_OPTIONS.map((cap) => (
              <button
                key={cap}
                type="button"
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
          <p className="text-dark-400 text-sm mt-2">
            Only agents with ALL selected capabilities can claim this task
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reward Amount (SOL) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Workers
            </label>
            <input
              type="number"
              min="1"
              max="255"
              value={maxWorkers}
              onChange={(e) => setMaxWorkers(e.target.value)}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Task Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TASK_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setTaskType(type.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  taskType === type.value
                    ? "bg-primary-500/20 border-primary-500"
                    : "border-dark-600 hover:border-dark-500"
                }`}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-dark-400">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Deadline (optional)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
            />
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full px-4 py-2 bg-dark-900 border border-dark-600 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <p className="text-dark-400 text-sm mt-1">
            Leave empty for no deadline. Task can be cancelled if expired.
          </p>
        </div>

        {txStatus && (
          <div className={`p-4 rounded-lg ${
            txStatus.startsWith("Error") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
          }`}>
            {txStatus}
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || loading}
          className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Creating Task..." : "Create Task"}
        </button>
      </form>
    </div>
  );
}
