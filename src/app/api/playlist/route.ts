import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { createPlaylist } from "@/lib/playlists/create-playlist"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import type { Session, MoodAnalysis } from "@/lib/types"

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ playlists: [] });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    const { moodAnalysis } = (await request.json()) as { moodAnalysis: MoodAnalysis }

    if (!moodAnalysis) {
      return NextResponse.json({ error: "Mood analysis is required" }, { status: 400 })
    }

    // If user is authenticated, create a Spotify playlist
    if (session?.user) {
      const playlist = await createPlaylist(moodAnalysis, session.user.id)

      // Save to database
      try {
        // Check if playlist already exists
        const existingPlaylist = await prisma.playlist.findFirst({
          where: {
            spotifyId: playlist.id,
          },
        })

        if (!existingPlaylist) {
          // Create new playlist in database
          await prisma.playlist.create({
            data: {
              name: playlist.name,
              description: playlist.description || "",
              spotifyId: playlist.id,
              spotifyUrl: playlist.spotifyUrl || "#",
              coverImage: playlist.coverImage,
              userId: session.user.id,
              moodData: JSON.stringify(moodAnalysis),
              tracks: {
                create: playlist.tracks.map((track) => ({
                  name: track.name,
                  artist: track.artist,
                  album: track.album || "",
                  albumCover: track.albumCover || "",
                  duration: track.duration || "",
                  spotifyId: track.id,
                  spotifyUrl: track.spotifyUrl || "#",
                })),
              },
            },
          })
        }
      } catch (error) {
        console.error("Error saving playlist to database:", error)
        // Continue even if database save fails
      }

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
      spotifyId: playlistId,
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

