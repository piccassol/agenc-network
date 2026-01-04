import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID as PROGRAM_ID_STRING } from "@/lib/solanaConfig";

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

// Capability bitmask values
export const Capabilities = {
  COMPUTE: 1n,      // bit 0
  INFERENCE: 2n,    // bit 1
  STORAGE: 4n,      // bit 2
  VERIFICATION: 8n, // bit 3
} as const;

export const CAPABILITY_NAMES: Record<number, string> = {
  1: "Compute",
  2: "Inference",
  4: "Storage",
  8: "Verification",
};

export function getCapabilityNames(bitmask: bigint | number): string[] {
  const mask = typeof bitmask === "number" ? BigInt(bitmask) : bitmask;
  const names: string[] = [];
  if (mask & Capabilities.COMPUTE) names.push("Compute");
  if (mask & Capabilities.INFERENCE) names.push("Inference");
  if (mask & Capabilities.STORAGE) names.push("Storage");
  if (mask & Capabilities.VERIFICATION) names.push("Verification");
  return names;
}

export function capabilitiesToBitmask(caps: string[]): bigint {
  let mask = 0n;
  if (caps.includes("Compute")) mask |= Capabilities.COMPUTE;
  if (caps.includes("Inference")) mask |= Capabilities.INFERENCE;
  if (caps.includes("Storage")) mask |= Capabilities.STORAGE;
  if (caps.includes("Verification")) mask |= Capabilities.VERIFICATION;
  return mask;
}

// Agent Status enum
export enum AgentStatus {
  Inactive = 0,
  Active = 1,
  Busy = 2,
  Suspended = 3,
}

export const AGENT_STATUS_NAMES: Record<number, string> = {
  0: "Inactive",
  1: "Active",
  2: "Busy",
  3: "Suspended",
};

// Task Status enum
export enum TaskStatus {
  Open = 0,
  InProgress = 1,
  PendingValidation = 2,
  Completed = 3,
  Cancelled = 4,
  Disputed = 5,
}

export const TASK_STATUS_NAMES: Record<number, string> = {
  0: "Open",
  1: "In Progress",
  2: "Pending Validation",
  3: "Completed",
  4: "Cancelled",
  5: "Disputed",
};

// Task Type enum
export enum TaskType {
  Exclusive = 0,
  Collaborative = 1,
  Competitive = 2,
}

export const TASK_TYPE_NAMES: Record<number, string> = {
  0: "Exclusive",
  1: "Collaborative",
  2: "Competitive",
};

// Dispute Status enum
export enum DisputeStatus {
  Active = 0,
  Resolved = 1,
  Expired = 2,
}

export const DISPUTE_STATUS_NAMES: Record<number, string> = {
  0: "Active",
  1: "Resolved",
  2: "Expired",
};

// Resolution Type enum
export enum ResolutionType {
  Refund = 0,
  Complete = 1,
  Split = 2,
}

export const RESOLUTION_TYPE_NAMES: Record<number, string> = {
  0: "Refund",
  1: "Complete",
  2: "Split",
};

// Account types
export interface AgentRegistration {
  agentId: number[];
  authority: PublicKey;
  capabilities: BN;
  status: { inactive?: {} } | { active?: {} } | { busy?: {} } | { suspended?: {} };
  endpoint: string;
  metadataUri: string;
  registeredAt: BN;
  lastActive: BN;
  tasksCompleted: BN;
  totalEarned: BN;
  reputation: number;
  activeTasks: number;
  stake: BN;
  bump: number;
}

export interface Task {
  taskId: number[];
  creator: PublicKey;
  requiredCapabilities: BN;
  description: number[];
  rewardAmount: BN;
  maxWorkers: number;
  currentWorkers: number;
  status: { open?: {} } | { inProgress?: {} } | { pendingValidation?: {} } | { completed?: {} } | { cancelled?: {} } | { disputed?: {} };
  taskType: { exclusive?: {} } | { collaborative?: {} } | { competitive?: {} };
  createdAt: BN;
  deadline: BN;
  completedAt: BN;
  escrow: PublicKey;
  result: number[];
  completions: number;
  requiredCompletions: number;
  bump: number;
}

export interface TaskClaim {
  task: PublicKey;
  worker: PublicKey;
  claimedAt: BN;
  completedAt: BN;
  proofHash: number[];
  resultData: number[];
  isCompleted: boolean;
  isValidated: boolean;
  rewardPaid: BN;
  bump: number;
}

export interface TaskEscrow {
  task: PublicKey;
  amount: BN;
  distributed: BN;
  isClosed: boolean;
  bump: number;
}

export interface ProtocolConfig {
  authority: PublicKey;
  treasury: PublicKey;
  disputeThreshold: number;
  protocolFeeBps: number;
  minArbiterStake: BN;
  totalAgents: BN;
  totalTasks: BN;
  completedTasks: BN;
  totalValueDistributed: BN;
  bump: number;
}

export interface Dispute {
  disputeId: number[];
  task: PublicKey;
  initiator: PublicKey;
  evidenceHash: number[];
  resolutionType: { refund?: {} } | { complete?: {} } | { split?: {} };
  status: { active?: {} } | { resolved?: {} } | { expired?: {} };
  createdAt: BN;
  resolvedAt: BN;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  votingDeadline: BN;
  bump: number;
}

export interface DisputeVote {
  dispute: PublicKey;
  voter: PublicKey;
  approved: boolean;
  votedAt: BN;
  bump: number;
}

// Helper to convert status object to string
export function getAgentStatusName(status: AgentRegistration["status"]): string {
  if ("inactive" in status) return "Inactive";
  if ("active" in status) return "Active";
  if ("busy" in status) return "Busy";
  if ("suspended" in status) return "Suspended";
  return "Unknown";
}

export function getTaskStatusName(status: Task["status"]): string {
  if ("open" in status) return "Open";
  if ("inProgress" in status) return "In Progress";
  if ("pendingValidation" in status) return "Pending Validation";
  if ("completed" in status) return "Completed";
  if ("cancelled" in status) return "Cancelled";
  if ("disputed" in status) return "Disputed";
  return "Unknown";
}

export function getTaskTypeName(taskType: Task["taskType"]): string {
  if ("exclusive" in taskType) return "Exclusive";
  if ("collaborative" in taskType) return "Collaborative";
  if ("competitive" in taskType) return "Competitive";
  return "Unknown";
}

export function getDisputeStatusName(status: Dispute["status"]): string {
  if ("active" in status) return "Active";
  if ("resolved" in status) return "Resolved";
  if ("expired" in status) return "Expired";
  return "Unknown";
}

export function getResolutionTypeName(resType: Dispute["resolutionType"]): string {
  if ("refund" in resType) return "Refund";
  if ("complete" in resType) return "Complete";
  if ("split" in resType) return "Split";
  return "Unknown";
}

// Helper to decode byte array to string
export function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes.filter(b => b !== 0)));
}

// Helper to encode string to byte array with padding
export function stringToBytes(str: string, length: number): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const result = new Array(length).fill(0);
  for (let i = 0; i < Math.min(bytes.length, length); i++) {
    result[i] = bytes[i];
  }
  return result;
}

// Generate agent ID from public key
export function generateAgentId(pubkey: PublicKey): number[] {
  return Array.from(pubkey.toBytes());
}

// Generate random task ID
export function generateTaskId(): number[] {
  const id = new Uint8Array(32);
  crypto.getRandomValues(id);
  return Array.from(id);
}
