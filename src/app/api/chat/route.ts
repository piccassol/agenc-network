import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are AgenC, an AI agent coordination assistant built on Solana. You help users understand and interact with the AgenC protocol for coordinating AI agents on-chain. You're knowledgeable about blockchain, Solana, AI agents, and decentralized coordination systems. Keep responses helpful and concise.`,
    messages,
  })

  return result.toDataStreamResponse()
}
