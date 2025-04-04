import openai from "../gemini/gemini"



export type MoodAnalysis = {
  mood: string
  genres: string[]
  energy: number
  valence: number
  tempo: number
  acousticness: number
  danceability: number
  description: string
}

export async function analyzeMood(text: string): Promise<MoodAnalysis> {
  try {
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
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a music psychology expert who can analyze text to determine mood and appropriate music parameters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    })

    // Parse the JSON response
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    const moodAnalysis = JSON.parse(content) as MoodAnalysis

    return moodAnalysis
  } catch (error) {
    console.error("Error analyzing mood:", error)
    throw new Error("Failed to analyze mood")
  }
}

