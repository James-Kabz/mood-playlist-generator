import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/prisma"
import type { Session, Track } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null

    const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();
  
      if (!id) {
        return NextResponse.json({ message: "Invalid playlist ID" }, { status: 400 });
      }
    // First try to get the playlist from our database
    let playlist = null

    try {
      // Try to find by spotifyId first
      playlist = await prisma.playlist.findFirst({
        where: {
          spotifyId: id,
        },
        include: {
          tracks: true,
        },
      })

      // If not found, try to find by MongoDB ObjectId
      if (!playlist && /^[0-9a-fA-F]{24}$/.test(id)) {
        playlist = await prisma.playlist.findUnique({
          where: {
            id: id,
          },
          include: {
            tracks: true,
          },
        })
      }

      if (playlist) {
        // Format the playlist data
        return NextResponse.json({
          id: playlist.spotifyId,
          name: playlist.name,
          description: playlist.description,
          coverImage: playlist.coverImage,
          spotifyUrl: playlist.spotifyUrl,
          tracks: playlist.tracks.map((track) => ({
            id: track.spotifyId,
            name: track.name,
            artist: track.artist,
            album: track.album,
            albumCover: track.albumCover,
            duration: track.duration,
            spotifyUrl: track.spotifyUrl,
          })),
          moodAnalysis: playlist.moodData,
          createdAt: playlist.createdAt,
        })
      }
    } catch (error) {
      console.error("Error fetching playlist from database:", error)
      // Continue to try Spotify API if database fetch fails
    }

    // If not found in database and user is authenticated, try to fetch from Spotify API
    if (session?.accessToken) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch playlist from Spotify")
        }

        const spotifyPlaylist = await response.json()

        // Format the playlist data
        const formattedPlaylist = {
          id: spotifyPlaylist.id,
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description || "",
          coverImage: spotifyPlaylist.images[0]?.url || "/placeholder.svg?height=300&width=300",
          spotifyUrl: spotifyPlaylist.external_urls?.spotify || "#",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tracks: spotifyPlaylist.tracks.items.map((item: any) => {
            const track = item.track
            return {
              id: track.id,
              name: track.name,
              artist: track.artists.map((artist: Track) => artist.name).join(", "),
              album: track.album.name,
              albumCover: track.album.images[0]?.url || "/placeholder.svg?height=64&width=64",
              duration: formatDuration(track.duration_ms),
              spotifyUrl: track.external_urls?.spotify || "#",
            }
          }),
        }

        // Try to save this playlist to our database for future use
        try {
          // Check if playlist already exists
          const existingPlaylist = await prisma.playlist.findFirst({
            where: {
              spotifyId: spotifyPlaylist.id,
            },
          })

          if (!existingPlaylist && session.user?.id) {
            // Create new playlist in database
            await prisma.playlist.create({
              data: {
                name: spotifyPlaylist.name,
                description: spotifyPlaylist.description || "",
                spotifyId: spotifyPlaylist.id,
                spotifyUrl: spotifyPlaylist.external_urls?.spotify || "#",
                coverImage: spotifyPlaylist.images[0]?.url || "/placeholder.svg?height=300&width=300",
                userId: session.user.id,
                tracks: {
                  create: formattedPlaylist.tracks.map((track: Track) => ({
                    name: track.name,
                    artist: track.artist,
                    album: track.album,
                    albumCover: track.albumCover,
                    duration: track.duration,
                    spotifyId: track.id,
                    spotifyUrl: track.spotifyUrl,
                  })),
                },
              },
            })
          }
        } catch (error) {
          console.error("Error saving Spotify playlist to database:", error)
          // Continue even if database save fails
        }

        return NextResponse.json(formattedPlaylist)
      } catch (error) {
        console.error("Error fetching playlist from Spotify:", error)
        // Fall back to mock data
      }
    }

    // If we get here, return a mock playlist
    return NextResponse.json({
      id: id,
      name: "Energetic Workout Mix",
      description: "High-energy tracks to power your workout session with upbeat rhythms and motivating beats.",
      coverImage: "/placeholder.svg?height=300&width=300",
      spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP",
      tracks: [
        {
          id: "1",
          name: "Don't Stop Me Now",
          artist: "Queen",
          album: "Jazz",
          albumCover: "/placeholder.svg?height=64&width=64",
          duration: "3:29",
          spotifyUrl: "https://open.spotify.com/track/7hQJA50XrCWABAu5v6QZ4i",
        },
        {
          id: "2",
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          albumCover: "/placeholder.svg?height=64&width=64",
          duration: "3:20",
          spotifyUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
        },
        {
          id: "3",
          name: "Physical",
          artist: "Dua Lipa",
          album: "Future Nostalgia",
          albumCover: "/placeholder.svg?height=64&width=64",
          duration: "3:41",
          spotifyUrl: "https://open.spotify.com/track/3AzjcOeAmA57TIOr9zF1ZW",
        },
        {
          id: "4",
          name: "Uptown Funk",
          artist: "Mark Ronson ft. Bruno Mars",
          album: "Uptown Special",
          albumCover: "/placeholder.svg?height=64&width=64",
          duration: "4:30",
          spotifyUrl: "https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS",
        },
        {
          id: "5",
          name: "Can't Stop the Feeling!",
          artist: "Justin Timberlake",
          album: "Trolls (Original Motion Picture Soundtrack)",
          albumCover: "/placeholder.svg?height=64&width=64",
          duration: "3:56",
          spotifyUrl: "https://open.spotify.com/track/1WkMMavIMc4JZ8cfMmxHkI",
        },
      ],
    })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

