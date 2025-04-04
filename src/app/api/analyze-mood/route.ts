import { type NextRequest, NextResponse } from "next/server"
import genAI from "@/lib/gemini/gemini"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 })
    }

    const prompt = `
      Analyze the following text and extract the user's mood or vibe. Then, suggest appropriate music parameters.
      
      Text: "${text}"
      
      Return a JSON object with the following properties:
      - mood: A short label for the mood (e.g., "energetic", "melancholic", "focused")
      - genres: An array of 2-4 music genres that would fit this mood
      - energy: A number from 0 to 1 representing how energetic the music should be
      - valence: A number from 0 to 1 representing how positive the music should be
      - tempo: A number from 60 to 180 representing the BPM of the music
      - acousticness: A number from 0 to 1 representing how acoustic the music should be
      - danceability: A number from 0 to 1 representing how danceable the music should be
      - description: A short description of the mood and why these music parameters were chosen
      
      IMPORTANT: Your response must be a valid JSON object with no additional text or explanation.
    `

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    if (!content) {
      throw new Error("No response from Gemini")
    }

    // Parse the JSON response
    // Sometimes Gemini might include markdown code blocks, so we need to clean that up
    const cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    const moodAnalysis = JSON.parse(cleanedContent)

    return NextResponse.json(moodAnalysis)
  } catch (error) {
    console.error("Error analyzing mood:", error)
    return NextResponse.json({ error: "Failed to analyze mood" }, { status: 500 })
  }
}

