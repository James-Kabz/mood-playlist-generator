"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Music, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { analyzeMood } from "@/lib/mood/analyze-mood"
import { createPlaylist } from "@/lib/playlists/create-playlist"
import { toast } from "sonner"

export function MoodAnalyzer() {
  const [moodText, setMoodText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!moodText.trim()) {
      toast.info( "Please describe your mood",{
        description: "We need some text to analyze your mood",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Analyze the mood using AI
      const moodAnalysis = await analyzeMood(moodText)

      // Create a playlist based on the mood
      const playlist = await createPlaylist(moodAnalysis, session?.user?.id)

      // Store the playlist in localStorage if user is not authenticated
      if (!session?.user) {
        const localPlaylists = JSON.parse(localStorage.getItem("guestPlaylists") || "[]")
        localPlaylists.push({
          ...playlist,
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem("guestPlaylists", JSON.stringify(localPlaylists))
      }

      toast.success("Playlist created!",{
        description: `Your "${playlist.name}" playlist is ready`,
      })

      // Redirect to the playlist page
      router.push(`/playlist/${playlist.id}`)
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error("Something went wrong",{
        description: "We couldn't create your playlist. Please try again.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Describe your mood or vibe... (e.g., 'Feeling energetic and ready to workout' or 'Need something calm to help me focus')"
          className="min-h-[120px] bg-neutral-800 border-neutral-600 resize-none text-white placeholder:text-neutral-400"
          value={moodText}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMoodText(e.target.value)}
          disabled={isAnalyzing}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing your mood...
            </>
          ) : (
            <>
              <Music className="mr-2 h-4 w-4" />
              Create My Playlist
            </>
          )}
        </Button>
      </form>

      {!session?.user && (
        <div className="mt-4 text-sm text-neutral-400 text-center">
          <p>
            You&apos;re using Moodify as a guest.{" "}
            <a href="#connect-spotify" className="text-purple-400 hover:underline">
              Connect with Spotify
            </a>{" "}
            to save playlists to your account.
          </p>
        </div>
      )}
    </div>
  )
}

