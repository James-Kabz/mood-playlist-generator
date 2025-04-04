import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ message: "Invalid playlist ID" }, { status: 400 });
    }
    const playlistId = id

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

    // Fetch playlist data from Spotify
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch playlist from Spotify")
      }

      const playlistData = await response.json()

      // Create new playlist in database
      const playlist = await prisma.playlist.create({
        data: {
          name: playlistData.name,
          description: playlistData.description || "",
          spotifyId: playlistId,
          spotifyUrl: playlistData.external_urls?.spotify || "#",
          coverImage: playlistData.images?.[0]?.url || "/placeholder.svg?height=300&width=300",
          userId: session.user.id,
          tracks: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: (playlistData.tracks?.items || []).map((item: any) => {
              const track = item.track
              return {
                name: track.name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                artist: track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
                album: track.album?.name || "",
                albumCover: track.album?.images?.[0]?.url || "",
                duration: formatDuration(track.duration_ms || 0),
                spotifyId: track.id,
                spotifyUrl: track.external_urls?.spotify || "#",
              }
            }),
          },
        },
      })

      return NextResponse.json({
        success: true,
        playlistId: playlist.id,
        message: "Playlist saved successfully",
      })
    } catch (error) {
      console.error("Error fetching and saving Spotify playlist:", error)
      return NextResponse.json({ error: "Failed to save playlist" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error saving playlist:", error)
    return NextResponse.json({ error: "Failed to save playlist" }, { status: 500 })
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

