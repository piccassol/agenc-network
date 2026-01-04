"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowUp, Upload, X, Download } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"

import {
  IS_DEVNET,
  PROGRAM_ID,
  SOLANA_CLUSTER,
  explorerAddressUrl,
  shortenAddress,
} from "@/lib/solanaConfig"

type Mode = "chatbot" | "image"
type Theme = "light" | "dark"

export default function Page() {
  const [mode, setMode] = useState<Mode>("chatbot")
  const [theme, setTheme] = useState<Theme>("dark")
  const [imagePrompt, setImagePrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else if (systemPrefersDark) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    } else {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.target === document.body || e.target === document.documentElement) {
        setIsDragging(false)
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          setMode("image")
          setReferenceFile(file)
          const reader = new FileReader()
          reader.onloadend = () => {
            setReferenceImage(reader.result as string)
          }
          reader.readAsDataURL(file)
        }
      }
    }

    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("dragleave", handleDragLeave)
    document.addEventListener("drop", handleDrop)

    return () => {
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("dragleave", handleDragLeave)
      document.removeEventListener("drop", handleDrop)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const message = formData.get("message") as string

    if (message.trim()) {
      sendMessage({ text: message })
      e.currentTarget.reset()
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) form.requestSubmit()
    }
  }

  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReferenceFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReferenceImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearReferenceImage = () => {
    setReferenceImage(null)
    setReferenceFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDownloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `agenc-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUseAsReference = () => {
    if (!generatedImage) return
    setReferenceImage(generatedImage)
    setImagePrompt("")
    setGeneratedImage(null)
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, referenceImage }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? "Failed to generate image")
      setGeneratedImage(data.imageUrl)
    } catch (error) {
      console.error("Error generating image:", error)
      alert("Error generating image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const shortPid = shortenAddress(PROGRAM_ID, 4, 4)
  const explorer = explorerAddressUrl(PROGRAM_ID, SOLANA_CLUSTER)

  return (
    <>
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border-2 border-dashed border-primary p-12 bg-card">
            <p className="text-2xl font-mono">Drop image to edit</p>
          </div>
        </div>
      )}

      {isFullscreen && generatedImage && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-background/80 hover:bg-background rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={generatedImage || "/placeholder.svg"}
            alt="Generated fullscreen"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center p-3 gap-3">
        <Card className="w-full max-w-4xl h-[600px] flex flex-col shadow-lg overflow-hidden">
          <div className="border-b px-4 py-2.5 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-lg font-semibold">AgenC Gateway</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {IS_DEVNET ? "devnet beta" : "mainnet"} |{" "}
                <a
                  href={explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  title={PROGRAM_ID}
                >
                  program {shortPid}
                </a>
              </p>
            </div>

            <div className="flex gap-1.5">
              <Navigation theme={theme} onToggleTheme={toggleTheme} />

              <div className="relative inline-flex h-8 bg-muted border border-border shadow-sm">
                <div
                  className="absolute top-0 h-full bg-background border border-border shadow-sm transition-all duration-300 ease-out"
                  style={{
                    left: mode === "chatbot" ? "0" : "50%",
                    width: "50%",
                  }}
                />
                <button
                  onClick={() => setMode("chatbot")}
                  className={`relative z-10 w-28 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                    mode === "chatbot"
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  Chatbot
                </button>
                <button
                  onClick={() => setMode("image")}
                  className={`relative z-10 w-28 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                    mode === "image"
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  Image
                </button>
              </div>
            </div>
          </div>

          {mode === "chatbot" ? (
            <>
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-base">Start a conversation with AgenC</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`relative max-w-[70%] px-3 py-2 text-base leading-relaxed rounded-2xl ${
                            message.role === "user"
                              ? "bg-foreground text-background after:content-[''] after:absolute after:bottom-2 after:-right-1.5 after:w-0 after:h-0 after:border-t-[6px] after:border-t-transparent after:border-l-[10px] after:border-l-foreground after:border-b-[6px] after:border-b-transparent"
                              : "bg-muted text-foreground after:content-[''] after:absolute after:bottom-2 after:-left-1.5 after:w-0 after:h-0 after:border-t-[6px] after:border-t-transparent after:border-r-[10px] after:border-r-muted after:border-b-[6px] after:border-b-transparent"
                          }`}
                        >
                          {message.parts.map((part, index) => {
                            if (part.type === "text") {
                              return (
                                <p key={index} className="whitespace-pre-wrap break-words">
                                  {part.text}
                                </p>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    ))}

                    {status === "streaming" && (
                      <div className="flex justify-start">
                        <div className="relative max-w-[70%] px-3 py-2 bg-muted rounded-2xl after:content-[''] after:absolute after:bottom-2 after:-left-1.5 after:w-0 after:h-0 after:border-t-[6px] after:border-t-transparent after:border-r-[10px] after:border-r-muted after:border-b-[6px] after:border-b-transparent">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t px-4 py-2.5 shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    name="message"
                    placeholder="Message AgenC..."
                    disabled={status === "streaming"}
                    className="flex-1 h-9"
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <Button type="submit" disabled={status === "streaming"} size="icon" className="shrink-0 h-9 w-9">
                    <ArrowUp className="w-4 h-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-hidden min-h-0">
                <div className="grid grid-cols-2 h-full">
                  <div className="border-r p-4 overflow-y-auto">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-mono font-semibold mb-1">Text to Image</h2>
                        <p className="text-xs text-muted-foreground">
                          Generate or edit an image (optional reference)
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reference-image" className="font-mono text-sm">
                            Reference Image (Optional)
                          </Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 bg-transparent font-mono h-8 text-sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="w-3 h-3 mr-2" />
                              Upload Image
                            </Button>
                            {referenceImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={clearReferenceImage}
                                className="h-8 w-8 bg-transparent"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleReferenceImageChange}
                          />
                          {referenceImage && (
                            <div className="relative overflow-hidden border aspect-square w-full max-w-[200px]">
                              <img
                                src={referenceImage || "/placeholder.svg"}
                                alt="Reference"
                                className="w-full h-full object-contain bg-muted/20"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prompt" className="font-mono text-sm">
                            Prompt
                          </Label>
                          <Input
                            id="prompt"
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder={
                              referenceImage
                                ? "Describe how to modify the image..."
                                : "Describe the image you want to generate..."
                            }
                            className="font-mono h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleGenerateImage()
                              }
                            }}
                            autoFocus
                          />
                        </div>

                        <Button
                          onClick={handleGenerateImage}
                          disabled={isGenerating || !imagePrompt.trim()}
                          className="w-full font-mono h-8 text-sm"
                        >
                          {isGenerating ? "Generating..." : referenceImage ? "Edit Image" : "Generate Image"}
                        </Button>

                        {generatedImage && (
                          <Button
                            onClick={() => {
                              setImagePrompt("")
                              setGeneratedImage(null)
                            }}
                            variant="outline"
                            className="w-full font-mono h-8 text-sm"
                          >
                            Clear & Generate New
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-center bg-muted/20">
                    {generatedImage ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={generatedImage || "/placeholder.svg"}
                          alt="Generated"
                          className="max-w-full max-h-full object-contain shadow-lg cursor-pointer"
                          onClick={() => setIsFullscreen(true)}
                        />
                        <div className="absolute bottom-4 left-4 flex gap-2">
                          <Button
                            onClick={handleDownloadImage}
                            size="sm"
                            className="h-8 gap-2 bg-white/80 hover:bg-white/90 text-black border shadow-sm"
                          >
                            <Download className="w-4 h-4 text-black" />
                            <span className="text-sm font-mono text-black">Download</span>
                          </Button>
                          <Button
                            onClick={handleUseAsReference}
                            size="sm"
                            className="h-8 gap-2 bg-white/80 hover:bg-white/90 text-black border shadow-sm"
                          >
                            <Upload className="w-4 h-4 text-black" />
                            <span className="text-sm font-mono text-black">Use as Input</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                          <p className="text-base text-muted-foreground font-mono">Preview will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
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
            <span className="text-muted-foreground/40">|</span>
            <span>{IS_DEVNET ? "devnet beta" : "mainnet"}</span>
          </div>
        </div>
      </div>
    </>
  )
}