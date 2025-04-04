import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { v4 as uuidv4 } from "uuid"
import { authOptions } from "@/lib/auth/auth"
import { createPlaylist } from "@/lib/playlists/create-playlist"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { moodAnalysis } = await request.json()

    if (!moodAnalysis) {
      return NextResponse.json({ error: "Mood analysis is required" }, { status: 400 })
    }

    // If user is authenticated, create a Spotify playlist
    if (session?.user) {
      const playlist = await createPlaylist(moodAnalysis, session.user.id)
      return NextResponse.json(playlist)
    }

    // For guest users, create a local playlist with a unique ID
    const playlistId = uuidv4()
    const playlistName = `${moodAnalysis.mood} Mood - ${new Date().toLocaleDateString()}`

    // Return a mock playlist structure
    return NextResponse.json({
      id: playlistId,
      name: playlistName,
      description: moodAnalysis.description,
      spotifyUrl: "#",
      coverImage: "/placeholder.svg?height=300&width=300",
      tracks: [], // This would be populated with mock tracks based on the mood
      moodAnalysis,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}

