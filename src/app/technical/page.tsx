"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import {
  IS_DEVNET,
  PROGRAM_ID,
  SOLANA_CLUSTER,
  explorerAddressUrl,
  shortenAddress,
} from "@/lib/solanaConfig"
import {
  Cpu,
  Brain,
  HardDrive,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Coins,
} from "lucide-react"

type Theme = "light" | "dark"
type Tab = "agent" | "tasks" | "create" | "mytasks"

const CAPABILITIES = [
  { id: 0, name: "COMPUTE", icon: Cpu, description: "General computation tasks" },
  { id: 1, name: "INFERENCE", icon: Brain, description: "AI/ML inference workloads" },
  { id: 2, name: "STORAGE", icon: HardDrive, description: "Data storage operations" },
  { id: 3, name: "VERIFICATION", icon: Shield, description: "Verification tasks" },
]

interface Agent {
  id: string
  owner: string
  capabilities: number
  stake: number
  reputation: number
  tasksCompleted: number
  isActive: boolean
}

interface Task {
  id: string
  creator: string
  reward: number
  requiredCapabilities: number
  deadline: number
  status: "open" | "claimed" | "completed" | "disputed"
  assignedAgent?: string
}

export default function TechnicalPage() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [activeTab, setActiveTab] = useState<Tab>("agent")
  const { connected, publicKey } = useWallet()
  
  // Agent state
  const [selectedCapabilities, setSelectedCapabilities] = useState<number[]>([])
  const [stakeAmount, setStakeAmount] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [myAgent, setMyAgent] = useState<Agent | null>(null)
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskReward, setNewTaskReward] = useState("")
  const [newTaskCapabilities, setNewTaskCapabilities] = useState<number[]>([])
  const [newTaskDeadline, setNewTaskDeadline] = useState("")
  const [isCreatingTask, setIsCreatingTask] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (systemPrefersDark) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const toggleCapability = (id: number, list: number[], setList: (v: number[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(c => c !== id))
    } else {
      setList([...list, id])
    }
  }

  const capabilitiesToBitmask = (caps: number[]) => {
    return caps.reduce((mask, cap) => mask | (1 << cap), 0)
  }

  const bitmaskToCapabilities = (mask: number) => {
    return CAPABILITIES.filter((_, i) => (mask & (1 << i)) !== 0).map(c => c.id)
  }

  const handleRegisterAgent = async () => {
    if (!connected || !publicKey) return
    setIsRegistering(true)
    
    try {
      // TODO: Call the actual Anchor program instruction
      // For now, simulate the registration
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setMyAgent({
        id: publicKey.toBase58().slice(0, 8),
        owner: publicKey.toBase58(),
        capabilities: capabilitiesToBitmask(selectedCapabilities),
        stake: parseFloat(stakeAmount) || 0,
        reputation: 100,
        tasksCompleted: 0,
        isActive: true,
      })
      
      setSelectedCapabilities([])
      setStakeAmount("")
    } catch (error) {
      console.error("Failed to register agent:", error)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleCreateTask = async () => {
    if (!connected || !publicKey) return
    setIsCreatingTask(true)
    
    try {
      // TODO: Call the actual Anchor program instruction
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newTask: Task = {
        id: `task_${Date.now()}`,
        creator: publicKey.toBase58(),
        reward: parseFloat(newTaskReward) || 0,
        requiredCapabilities: capabilitiesToBitmask(newTaskCapabilities),
        deadline: Date.now() + (parseInt(newTaskDeadline) || 24) * 60 * 60 * 1000,
        status: "open",
      }
      
      setTasks([newTask, ...tasks])
      setNewTaskReward("")
      setNewTaskCapabilities([])
      setNewTaskDeadline("")
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleClaimTask = async (taskId: string) => {
    if (!connected || !publicKey || !myAgent) return
    
    setTasks(tasks.map(t => 
      t.id === taskId 
        ? { ...t, status: "claimed" as const, assignedAgent: publicKey.toBase58() }
        : t
    ))
  }

  const shortPid = shortenAddress(PROGRAM_ID, 4, 4)
  const explorer = explorerAddressUrl(PROGRAM_ID, SOLANA_CLUSTER)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 gap-3">
      <Card className="w-full max-w-5xl min-h-[700px] flex flex-col shadow-lg overflow-hidden">
        <div className="border-b px-4 py-2.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold">AgenC Technical Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {IS_DEVNET ? "devnet" : "mainnet"} |{" "}
              <a
                href={explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {shortPid}
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WalletMultiButton className="!h-8 !text-sm !px-3" />
            <Navigation theme={theme} onToggleTheme={toggleTheme} />
          </div>
        </div>

        <div className="border-b px-4 py-2 shrink-0">
          <div className="flex gap-1">
            {[
              { id: "agent" as Tab, label: "My Agent", icon: User },
              { id: "tasks" as Tab, label: "Task Board", icon: CheckCircle },
              { id: "create" as Tab, label: "Create Task", icon: Coins },
              { id: "mytasks" as Tab, label: "My Tasks", icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!connected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-muted-foreground">Connect your wallet to access the dashboard</p>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              {activeTab === "agent" && (
                <div className="space-y-6">
                  {myAgent ? (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">Your Agent</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border p-4">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-lg font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Active
                          </p>
                        </div>
                        <div className="border p-4">
                          <p className="text-xs text-muted-foreground">Stake</p>
                          <p className="text-lg font-mono">{myAgent.stake} SOL</p>
                        </div>
                        <div className="border p-4">
                          <p className="text-xs text-muted-foreground">Reputation</p>
                          <p className="text-lg font-mono">{myAgent.reputation}</p>
                        </div>
                        <div className="border p-4">
                          <p className="text-xs text-muted-foreground">Tasks Completed</p>
                          <p className="text-lg font-mono">{myAgent.tasksCompleted}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
                        <div className="flex gap-2">
                          {bitmaskToCapabilities(myAgent.capabilities).map(capId => {
                            const cap = CAPABILITIES.find(c => c.id === capId)
                            if (!cap) return null
                            return (
                              <div key={cap.id} className="flex items-center gap-1.5 px-2 py-1 bg-muted text-sm">
                                <cap.icon className="w-3.5 h-3.5" />
                                {cap.name}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <Button variant="outline" className="mt-4">
                        Deregister Agent
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Register as Agent</h2>
                        <p className="text-sm text-muted-foreground">
                          Stake SOL and select your capabilities to start accepting tasks
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Select Capabilities</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {CAPABILITIES.map(cap => (
                              <button
                                key={cap.id}
                                onClick={() => toggleCapability(cap.id, selectedCapabilities, setSelectedCapabilities)}
                                className={`flex items-center gap-3 p-3 border text-left transition-colors ${
                                  selectedCapabilities.includes(cap.id)
                                    ? "border-foreground bg-foreground/5"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >
                                <cap.icon className="w-5 h-5 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">{cap.name}</p>
                                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="stake" className="text-sm">Stake Amount (SOL)</Label>
                          <Input
                            id="stake"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="0.5"
                            className="font-mono"
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum stake: 0.1 SOL. Higher stakes improve your reputation.
                          </p>
                        </div>

                        <Button
                          onClick={handleRegisterAgent}
                          disabled={selectedCapabilities.length === 0 || !stakeAmount || isRegistering}
                          className="w-full"
                        >
                          {isRegistering ? "Registering..." : "Register Agent"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Available Tasks</h2>
                  {tasks.filter(t => t.status === "open").length === 0 ? (
                    <div className="border-2 border-dashed p-8 text-center">
                      <p className="text-muted-foreground">No open tasks available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.filter(t => t.status === "open").map(task => (
                        <div key={task.id} className="border p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-sm">{task.id}</p>
                              <p className="text-xs text-muted-foreground">
                                by {shortenAddress(task.creator, 4, 4)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-lg">{task.reward} SOL</p>
                              <p className="text-xs text-muted-foreground">reward</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Required:</span>
                            {bitmaskToCapabilities(task.requiredCapabilities).map(capId => {
                              const cap = CAPABILITIES.find(c => c.id === capId)
                              if (!cap) return null
                              return (
                                <div key={cap.id} className="flex items-center gap-1 px-1.5 py-0.5 bg-muted text-xs">
                                  <cap.icon className="w-3 h-3" />
                                  {cap.name}
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(task.deadline).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              onClick={() => handleClaimTask(task.id)}
                              disabled={!myAgent}
                            >
                              Claim Task
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "create" && (
                <div className="space-y-6 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Create New Task</h2>
                    <p className="text-sm text-muted-foreground">
                      Define task requirements and set a reward for agents
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Reward Amount (SOL)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newTaskReward}
                        onChange={(e) => setNewTaskReward(e.target.value)}
                        placeholder="1.0"
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Required Capabilities</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {CAPABILITIES.map(cap => (
                          <button
                            key={cap.id}
                            onClick={() => toggleCapability(cap.id, newTaskCapabilities, setNewTaskCapabilities)}
                            className={`flex items-center gap-2 p-2 border text-left text-sm transition-colors ${
                              newTaskCapabilities.includes(cap.id)
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <cap.icon className="w-4 h-4" />
                            {cap.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm">Deadline (hours from now)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        placeholder="24"
                        className="font-mono"
                      />
                    </div>

                    <Button
                      onClick={handleCreateTask}
                      disabled={!newTaskReward || newTaskCapabilities.length === 0 || isCreatingTask}
                      className="w-full"
                    >
                      {isCreatingTask ? "Creating..." : "Create Task & Fund Escrow"}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "mytasks" && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">My Tasks</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Tasks I Created</h3>
                      {tasks.filter(t => t.creator === publicKey?.toBase58()).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tasks created yet</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.filter(t => t.creator === publicKey?.toBase58()).map(task => (
                            <div key={task.id} className="border p-3 flex items-center justify-between">
                              <div>
                                <p className="font-mono text-sm">{task.id}</p>
                                <p className="text-xs text-muted-foreground">{task.reward} SOL reward</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs ${
                                  task.status === "open" ? "bg-blue-500/20 text-blue-400" :
                                  task.status === "claimed" ? "bg-yellow-500/20 text-yellow-400" :
                                  task.status === "completed" ? "bg-green-500/20 text-green-400" :
                                  "bg-red-500/20 text-red-400"
                                }`}>
                                  {task.status}
                                </span>
                                {task.status === "open" && (
                                  <Button size="sm" variant="outline">Cancel</Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Tasks I Claimed</h3>
                      {tasks.filter(t => t.assignedAgent === publicKey?.toBase58()).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No claimed tasks</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.filter(t => t.assignedAgent === publicKey?.toBase58()).map(task => (
                            <div key={task.id} className="border p-3 flex items-center justify-between">
                              <div>
                                <p className="font-mono text-sm">{task.id}</p>
                                <p className="text-xs text-muted-foreground">{task.reward} SOL reward</p>
                              </div>
                              <Button size="sm">Complete Task</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <div className="shrink-0">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            program on explorer
          </a>
          <span className="text-muted-foreground/40">|</span>
          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            devnet faucet
          </a>
        </div>
      </div>
    </div>
  )
}
