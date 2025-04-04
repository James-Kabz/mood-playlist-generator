import { analyzeMood } from "@/lib/mood/analyze-mood"
import { type NextRequest, NextResponse } from "next/server"


export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const moodAnalysis = await analyzeMood(text)

    return NextResponse.json(moodAnalysis)
  } catch (error) {
    console.error("Error analyzing mood:", error)
    return NextResponse.json({ error: "Failed to analyze mood" }, { status: 500 })
  }
}

