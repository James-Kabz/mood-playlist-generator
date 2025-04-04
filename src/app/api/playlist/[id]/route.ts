import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { getPlaylist } from "@/lib/playlists/get-playlist"

export async function GET(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ message: "Invalid playlist ID" }, { status: 400 });
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      }
    const playlist = await getPlaylist(id)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

