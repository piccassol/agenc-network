import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { prompt, referenceImage } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "Grok API key not configured" },
        { status: 500 }
      )
    }

    // Build the prompt - if there's a reference image, we'll describe the edit
    let fullPrompt = prompt
    if (referenceImage) {
      fullPrompt = `Based on the reference image, ${prompt}`
    }

    const response = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: fullPrompt,
        n: 1,
        response_format: "url",
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error("Grok API error:", error)
      return NextResponse.json(
        { error: error.error?.message || "Failed to generate image" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned from API" },
        { status: 500 }
      )
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
