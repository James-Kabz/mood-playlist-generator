import { getSession } from "next-auth/react"
import type { Session, PlaylistSummary, Playlist } from "../types"

export async function getUserPlaylists(): Promise<PlaylistSummary[]> {
  try {
    const session = (await getSession()) as Session | null

    if (!session?.user?.id) {
      // Return guest playlists from localStorage if available
      if (typeof window !== "undefined") {
        const guestPlaylists = JSON.parse(localStorage.getItem("guestPlaylists") || "[]")
        return guestPlaylists.map((playlist: Playlist) => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description || "No description",
          coverImage: playlist.coverImage || "/placeholder.svg?height=200&width=200",
          createdAt: new Date(playlist.createdAt).toLocaleDateString(),
        }))
      }
      return []
    }

    // For authenticated users, fetch playlists from our API endpoint
    try {
      const response = await fetch("/api/user/playlists")

      if (!response.ok) {
        throw new Error("Failed to fetch playlists from API")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching playlists from API:", error)
      // Fall back to mock data
    }

    // Fallback mock data
    return [
      {
        id: "1",
        name: "Energetic Workout Mix",
        description: "High-energy tracks to power your workout session",
        coverImage: "/placeholder.svg?height=200&width=200",
        createdAt: "Apr 2, 2023",
      },
      {
        id: "2",
        name: "Chill Study Session",
        description: "Calm and focused music for productive study time",
        coverImage: "/placeholder.svg?height=200&width=200",
        createdAt: "Mar 15, 2023",
      },
      {
        id: "3",
        name: "Morning Motivation",
        description: "Start your day with these uplifting tracks",
        coverImage: "/placeholder.svg?height=200&width=200",
        createdAt: "Feb 28, 2023",
      },
    ]
  } catch (error) {
    console.error("Error fetching user playlists:", error)
    return []
  }
}

