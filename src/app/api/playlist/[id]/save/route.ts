import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"
import { savePlaylist } from "@/lib/playlists/save-playlist"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ message: "Invalid playlist ID" }, { status: 400 });
    }

    await savePlaylist(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving playlist:", error)
    return NextResponse.json({ error: "Failed to save playlist" }, { status: 500 })
  }
}

