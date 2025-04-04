import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null
    let {  playlistData } = await request.json()
    const { playlistId } = await request.json()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    // Check if playlist already exists in database
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        spotifyId: playlistId,
      },
    })

    if (existingPlaylist) {
      // Playlist already exists, return success
      return NextResponse.json({
        success: true,
        playlistId: existingPlaylist.id,
        message: "Playlist already exists in database",
      })
    }

    if (!playlistData) {
      // If playlistData is not provided, fetch it from Spotify
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch playlist from Spotify")
        }

        playlistData = await response.json()
      } catch (error) {
        console.error("Error fetching playlist data:", error)
        return NextResponse.json({ error: "Failed to fetch playlist data" }, { status: 500 })
      }
    }

    // Create new playlist in database
    const playlist = await prisma.playlist.create({
      data: {
        name: playlistData.name,
        description: playlistData.description || "",
        spotifyId: playlistId,
        spotifyUrl: playlistData.external_urls?.spotify || "#",
        coverImage: playlistData.images?.[0]?.url || "/placeholder.svg?height=300&width=300",
        userId: session.user.id,
        moodData: playlistData.moodAnalysis || {},
        tracks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: (playlistData.tracks || []).map((track: any) => ({
            name: track.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            artist: track.artist || track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
            album: track.album?.name || track.album || "",
            albumCover: track.album?.images?.[0]?.url || track.albumCover || "",
            duration: track.duration_ms ? formatDuration(track.duration_ms) : track.duration || "",
            spotifyId: track.id,
            spotifyUrl: track.external_urls?.spotify || track.spotifyUrl || "#",
          })),
        },
      },
    })

    return NextResponse.json({
      success: true,
      playlistId: playlist.id,
      message: "Playlist saved successfully",
    })
  } catch (error) {
    console.error("Error saving playlist to database:", error)
    return NextResponse.json({ error: "Failed to save playlist to database" }, { status: 500 })
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

