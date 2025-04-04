import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const response = await fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: "Failed to fetch genres", details: error }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching Spotify genres:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

