"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import {
  Wallet,
  Plus,
  Send,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Check,
} from "lucide-react"

type Theme = "light" | "dark"
type Tab = "overview" | "send" | "receive" | "import"

interface TetsuoWallet {
  name: string
  address: string
  balance: number
  publicKey: string
  privateKey: string
  mnemonic?: string
}

export default function WalletPage() {
  const [theme, setTheme] = useState<Theme>("dark")
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [wallets, setWallets] = useState<TetsuoWallet[]>([])
  const [selectedWallet, setSelectedWallet] = useState<TetsuoWallet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Send form state
  const [sendTo, setSendTo] = useState("")
  const [sendAmount, setSendAmount] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  // Import form state
  const [importType, setImportType] = useState<"mnemonic" | "privatekey">("mnemonic")
  const [importValue, setImportValue] = useState("")
  const [importName, setImportName] = useState("")
  const [isImporting, setIsImporting] = useState(false)

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

    // Load wallets from localStorage
    const savedWallets = localStorage.getItem("tetsuo_wallets")
    if (savedWallets) {
      try {
        const parsed = JSON.parse(savedWallets)
        setWallets(parsed)
        if (parsed.length > 0) {
          setSelectedWallet(parsed[0])
        }
      } catch (e) {
        console.error("Failed to parse saved wallets")
      }
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const saveWallets = (newWallets: TetsuoWallet[]) => {
    setWallets(newWallets)
    localStorage.setItem("tetsuo_wallets", JSON.stringify(newWallets))
  }

  const createWallet = async () => {
    setIsLoading(true)
    try {
      // Dynamic import to avoid SSR issues
      const { generateWallet } = await import("tetsuo-blockchain-wallet")
      const wallet = await generateWallet()
      
      const newWallet: TetsuoWallet = {
        name: `Wallet ${wallets.length + 1}`,
        address: wallet.address,
        balance: 0,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic,
      }
      
      const newWallets = [...wallets, newWallet]
      saveWallets(newWallets)
      setSelectedWallet(newWallet)
    } catch (error) {
      console.error("Failed to create wallet:", error)
      alert("Failed to create wallet. Make sure tetsuo-blockchain-wallet is installed.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBalance = async () => {
    if (!selectedWallet) return
    setIsLoading(true)
    try {
      const { createRPCClient } = await import("tetsuo-blockchain-wallet")
      const rpc = createRPCClient("https://tetsuoarena.com")
      const balance = await rpc.getBalance(selectedWallet.address)
      
      const updatedWallet = { ...selectedWallet, balance }
      const updatedWallets = wallets.map(w => 
        w.address === selectedWallet.address ? updatedWallet : w
      )
      saveWallets(updatedWallets)
      setSelectedWallet(updatedWallet)
    } catch (error) {
      console.error("Failed to fetch balance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!selectedWallet || !sendTo || !sendAmount) return
    setIsSending(true)
    
    try {
      const {
        createRPCClient,
        buildTransaction,
        createTransactionHex,
        signTransaction,
      } = await import("tetsuo-blockchain-wallet")
      
      const rpc = createRPCClient("https://tetsuoarena.com")
      const utxos = await rpc.getUTXOs(selectedWallet.address)
      
      const { inputs, outputs } = buildTransaction(
        selectedWallet.address,
        sendTo,
        parseFloat(sendAmount),
        utxos,
        selectedWallet.address
      )
      
      const txHex = createTransactionHex(inputs, outputs)
      const signedTx = signTransaction(txHex, selectedWallet.privateKey, inputs, utxos)
      const txid = await rpc.broadcastTransaction(signedTx)
      
      alert(`Transaction sent! TXID: ${txid}`)
      setSendTo("")
      setSendAmount("")
      refreshBalance()
    } catch (error: any) {
      console.error("Failed to send:", error)
      alert(`Failed to send: ${error.message || "Unknown error"}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleImport = async () => {
    if (!importValue || !importName) return
    setIsImporting(true)
    
    try {
      let wallet
      if (importType === "mnemonic") {
        const { importFromMnemonic } = await import("tetsuo-blockchain-wallet")
        wallet = await importFromMnemonic(importValue.trim())
      } else {
        const { importFromPrivateKey } = await import("tetsuo-blockchain-wallet")
        wallet = importFromPrivateKey(importValue.trim())
      }
      
      const newWallet: TetsuoWallet = {
        name: importName,
        address: wallet.address,
        balance: 0,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey,
        mnemonic: importType === "mnemonic" ? importValue.trim() : undefined,
      }
      
      const newWallets = [...wallets, newWallet]
      saveWallets(newWallets)
      setSelectedWallet(newWallet)
      setImportValue("")
      setImportName("")
      setActiveTab("overview")
    } catch (error: any) {
      console.error("Failed to import:", error)
      alert(`Failed to import: ${error.message || "Invalid input"}`)
    } finally {
      setIsImporting(false)
    }
  }

  const deleteWallet = (address: string) => {
    if (!confirm("Are you sure you want to delete this wallet? Make sure you have backed up your mnemonic!")) {
      return
    }
    const newWallets = wallets.filter(w => w.address !== address)
    saveWallets(newWallets)
    if (selectedWallet?.address === address) {
      setSelectedWallet(newWallets[0] || null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 gap-3">
      <Card className="w-full max-w-4xl min-h-[600px] flex flex-col shadow-lg overflow-hidden">
        <div className="border-b px-4 py-2.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold">TETSUO Wallet</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your TETSUO blockchain assets
            </p>
          </div>
          <Navigation theme={theme} onToggleTheme={toggleTheme} />
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-56 border-r p-3 space-y-2 overflow-y-auto">
            <Button
              onClick={createWallet}
              disabled={isLoading}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? "Creating..." : "New Wallet"}
            </Button>
            
            <div className="pt-2 space-y-1">
              {wallets.map(wallet => (
                <button
                  key={wallet.address}
                  onClick={() => setSelectedWallet(wallet)}
                  className={`w-full text-left p-2 text-sm transition-colors ${
                    selectedWallet?.address === wallet.address
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium truncate">{wallet.name}</p>
                      <p className="text-xs opacity-70 font-mono truncate">
                        {wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {wallets.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No wallets yet. Create one to get started.
              </p>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedWallet ? (
              <>
                <div className="border-b px-4 py-2 shrink-0">
                  <div className="flex gap-1">
                    {[
                      { id: "overview" as Tab, label: "Overview" },
                      { id: "send" as Tab, label: "Send" },
                      { id: "receive" as Tab, label: "Receive" },
                      { id: "import" as Tab, label: "Import" },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 text-sm transition-colors ${
                          activeTab === tab.id
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="border p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">{selectedWallet.name}</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={refreshBalance}
                            disabled={isLoading}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                          </Button>
                        </div>
                        
                        <div className="text-center py-6">
                          <p className="text-4xl font-mono font-bold">
                            {selectedWallet.balance.toFixed(8)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">TETSUO</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Address</Label>
                          <div className="flex gap-2">
                            <Input
                              value={selectedWallet.address}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(selectedWallet.address)}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {selectedWallet.mnemonic && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Mnemonic (backup phrase)</Label>
                            <div className="flex gap-2">
                              <Input
                                type={showPrivateKey ? "text" : "password"}
                                value={selectedWallet.mnemonic}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                              >
                                {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-destructive">
                              Never share your mnemonic with anyone!
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteWallet(selectedWallet.address)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Wallet
                      </Button>
                    </div>
                  )}

                  {activeTab === "send" && (
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-1.5">
                        <Label>Recipient Address</Label>
                        <Input
                          value={sendTo}
                          onChange={(e) => setSendTo(e.target.value)}
                          placeholder="TAddress..."
                          className="font-mono"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>Amount (TETSUO)</Label>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.0"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available: {selectedWallet.balance.toFixed(8)} TETSUO
                        </p>
                      </div>

                      <Button
                        onClick={handleSend}
                        disabled={!sendTo || !sendAmount || isSending}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSending ? "Sending..." : "Send TETSUO"}
                      </Button>
                    </div>
                  )}

                  {activeTab === "receive" && (
                    <div className="space-y-4 max-w-md">
                      <p className="text-sm text-muted-foreground">
                        Share this address to receive TETSUO
                      </p>
                      
                      <div className="border p-4 text-center">
                        <p className="font-mono text-sm break-all">{selectedWallet.address}</p>
                      </div>
                      
                      <Button
                        onClick={() => copyToClipboard(selectedWallet.address)}
                        className="w-full"
                      >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied!" : "Copy Address"}
                      </Button>
                    </div>
                  )}

                  {activeTab === "import" && (
                    <div className="space-y-4 max-w-md">
                      <div className="flex gap-2">
                        <Button
                          variant={importType === "mnemonic" ? "default" : "outline"}
                          onClick={() => setImportType("mnemonic")}
                          className="flex-1"
                        >
                          Mnemonic
                        </Button>
                        <Button
                          variant={importType === "privatekey" ? "default" : "outline"}
                          onClick={() => setImportType("privatekey")}
                          className="flex-1"
                        >
                          Private Key
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Wallet Name</Label>
                        <Input
                          value={importName}
                          onChange={(e) => setImportName(e.target.value)}
                          placeholder="My Wallet"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label>
                          {importType === "mnemonic" ? "12-word Mnemonic" : "Private Key (hex)"}
                        </Label>
                        <Input
                          value={importValue}
                          onChange={(e) => setImportValue(e.target.value)}
                          placeholder={
                            importType === "mnemonic"
                              ? "word1 word2 word3..."
                              : "abcd1234..."
                          }
                          className="font-mono"
                        />
                      </div>

                      <Button
                        onClick={handleImport}
                        disabled={!importValue || !importName || isImporting}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isImporting ? "Importing..." : "Import Wallet"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">No wallet selected</p>
                    <p className="text-sm text-muted-foreground">
                      Create a new wallet or import an existing one
                    </p>
                  </div>
                  <Button onClick={createWallet} disabled={isLoading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Wallet
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          TETSUO Wallet SDK |{" "}
          <a
            href="https://tetsuoarena.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Explorer
          </a>
        </p>
      </div>
    </div>
  )
}
