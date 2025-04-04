import { getSession } from "next-auth/react"
import type { Session } from "../types"
import { Playlist } from "../types";

export async function savePlaylist(playlistId: string): Promise<{ success: boolean; playlistId?: string }> {
  try {
    const session = (await getSession()) as Session | null

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

  
    // First, check if this is a guest playlist in localStorage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let playlistData: any = null
    if (typeof window !== "undefined") {
      const guestPlaylists = JSON.parse(localStorage.getItem("guestPlaylists") || "[]")
      playlistData = guestPlaylists.find((p: Playlist) => p.id === playlistId)
    }

    // If not found in localStorage, fetch from API
    if (!playlistData) {
      const response = await fetch(`/api/playlist/${playlistId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch playlist data")
      }
      playlistData = await response.json()
    }

    if (!playlistData) {
      throw new Error("Playlist not found")
    }

    // Save playlist to database via API
    const saveResponse = await fetch("/api/playlist/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playlistId: playlistData.id,
        playlistData,
      }),
    })

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json()
      throw new Error(errorData.error || "Failed to save playlist")
    }

    const result = await saveResponse.json()
    return { success: true, playlistId: result.playlistId }
  } catch (error) {
    console.error("Error saving playlist:", error)
    throw new Error("Failed to save playlist")
  }
}

