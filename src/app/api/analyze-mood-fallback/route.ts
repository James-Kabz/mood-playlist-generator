import { type NextRequest, NextResponse } from "next/server"

// This is a fallback that doesn't require any API keys
// It provides predefined mood analyses based on keyword matching
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const lowerText = text.toLowerCase()
    let moodAnalysis

    // Check for common moods based on keywords
    if (
      lowerText.includes("happy") ||
      lowerText.includes("joy") ||
      lowerText.includes("excited") ||
      lowerText.includes("energetic")
    ) {
      moodAnalysis = {
        mood: "Energetic",
        genres: ["Pop", "Dance", "Electronic", "Rock"],
        energy: 0.8,
        valence: 0.9,
        tempo: 128,
        acousticness: 0.2,
        danceability: 0.8,
        description:
          "An upbeat, high-energy mood that calls for lively, uplifting music with a fast tempo and positive vibes.",
      }
    } else if (lowerText.includes("sad") || lowerText.includes("depressed") || lowerText.includes("melancholy")) {
      moodAnalysis = {
        mood: "Melancholic",
        genres: ["Indie", "Folk", "Alternative", "Piano"],
        energy: 0.3,
        valence: 0.2,
        tempo: 75,
        acousticness: 0.7,
        danceability: 0.3,
        description:
          "A reflective, somber mood that pairs well with emotional, slower-paced music featuring acoustic elements and minor keys.",
      }
    } else if (
      lowerText.includes("focus") ||
      lowerText.includes("study") ||
      lowerText.includes("concentrate") ||
      lowerText.includes("work")
    ) {
      moodAnalysis = {
        mood: "Focused",
        genres: ["Ambient", "Classical", "Lo-fi", "Instrumental"],
        energy: 0.4,
        valence: 0.6,
        tempo: 90,
        acousticness: 0.6,
        danceability: 0.2,
        description:
          "A concentrated state that benefits from non-distracting, instrumental music with a steady rhythm and minimal vocals.",
      }
    } else if (
      lowerText.includes("relax") ||
      lowerText.includes("calm") ||
      lowerText.includes("chill") ||
      lowerText.includes("peaceful")
    ) {
      moodAnalysis = {
        mood: "Relaxed",
        genres: ["Ambient", "Chillout", "Acoustic", "Jazz"],
        energy: 0.2,
        valence: 0.7,
        tempo: 70,
        acousticness: 0.8,
        danceability: 0.3,
        description:
          "A tranquil mood that calls for gentle, soothing music with soft textures and a slower tempo to promote relaxation.",
      }
    } else if (
      lowerText.includes("workout") ||
      lowerText.includes("exercise") ||
      lowerText.includes("gym") ||
      lowerText.includes("run")
    ) {
      moodAnalysis = {
        mood: "Workout",
        genres: ["EDM", "Hip Hop", "Rock", "Pop"],
        energy: 0.9,
        valence: 0.8,
        tempo: 140,
        acousticness: 0.1,
        danceability: 0.7,
        description:
          "A high-energy state that requires motivating, rhythmic music with a strong beat to maintain momentum during physical activity.",
      }
    } else if (lowerText.includes("romantic") || lowerText.includes("love") || lowerText.includes("date")) {
      moodAnalysis = {
        mood: "Romantic",
        genres: ["R&B", "Soul", "Jazz", "Pop Ballads"],
        energy: 0.5,
        valence: 0.7,
        tempo: 85,
        acousticness: 0.5,
        danceability: 0.6,
        description:
          "A warm, intimate mood that pairs well with smooth, soulful music featuring romantic themes and sensual rhythms.",
      }
    } else {
      // Default mood if no keywords match
      moodAnalysis = {
        mood: "Balanced",
        genres: ["Pop", "Rock", "Alternative", "Indie"],
        energy: 0.6,
        valence: 0.6,
        tempo: 110,
        acousticness: 0.4,
        danceability: 0.5,
        description:
          "A balanced mood that works well with a mix of genres featuring moderate energy and a blend of acoustic and electronic elements.",
      }
    }

    return NextResponse.json(moodAnalysis)
  } catch (error) {
    console.error("Error in fallback mood analysis:", error)

    // Return a default analysis even if something goes wrong
    return NextResponse.json({
      mood: "Default",
      genres: ["Pop", "Rock", "Electronic"],
      energy: 0.5,
      valence: 0.5,
      tempo: 100,
      acousticness: 0.5,
      danceability: 0.5,
      description: "A general playlist with a mix of popular genres and balanced musical attributes.",
    })
  }
}

