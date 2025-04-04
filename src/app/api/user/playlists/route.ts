import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"
import type { Playlist, Session } from "@/lib/types"

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null

    if (!session?.user?.id.toString) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get playlists from database
    const dbPlaylists = await prisma.playlist.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tracks: true,
      },
    })

    if (dbPlaylists.length > 0) {
      return NextResponse.json(
        dbPlaylists.map((playlist) => ({
          id: playlist.spotifyId,
          name: playlist.name,
          description: playlist.description || "No description",
          coverImage: playlist.coverImage || "/placeholder.svg?height=200&width=200",
          createdAt: new Date(playlist.createdAt).toLocaleDateString(),
        })),
      )
    }

    // If no playlists in database, try to fetch from Spotify API
    if (session?.accessToken) {
      try {
        const response = await fetch("https://api.spotify.com/v1/me/playlists", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch playlists from Spotify")
        }

        const data = await response.json()

        // Save these playlists to our database for future use
        for (const spotifyPlaylist of data.items) {
          try {
            // Check if playlist already exists in database
            const existingPlaylist = await prisma.playlist.findFirst({
              where: {
                spotifyId: spotifyPlaylist.id,
              },
            })

            if (!existingPlaylist) {
              // Create new playlist in database
              await prisma.playlist.create({
                data: {
                  name: spotifyPlaylist.name,
                  description: spotifyPlaylist.description || "",
                  spotifyId: spotifyPlaylist.id,
                  spotifyUrl: spotifyPlaylist.external_urls?.spotify || "#",
                  coverImage: spotifyPlaylist.images[0]?.url || "/placeholder.svg?height=200&width=200",
                  userId: session.user.id,
                },
              })
            }
          } catch (error) {
            console.error("Error saving Spotify playlist to database:", error)
            // Continue with next playlist
          }
        }

        return NextResponse.json(
          data.items.map((playlist: Playlist) => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || "No description",
            coverImage: playlist.images[0]?.url || "/placeholder.svg?height=200&width=200",
            createdAt: new Date(playlist.added_at || Date.now()).toLocaleDateString(),
          })),
        )
      } catch (error) {
        console.error("Error fetching Spotify playlists:", error)
      }
    }

    // Return empty array if no playlists found
    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching user playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

