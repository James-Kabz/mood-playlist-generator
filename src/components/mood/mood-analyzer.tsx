"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Music, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createPlaylist } from "@/lib/playlists/create-playlist"
import { toast } from "@/lib/toast"
import { useSession } from "next-auth/react"
import type { MoodAnalysis } from "@/lib/types"

export function MoodAnalyzer() {
  const [moodText, setMoodText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!moodText.trim()) {
      toast({
        title: "Please describe your mood",
        description: "We need some text to analyze your mood",
        variant: "error",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Try Gemini first, fall back to DeepSeek if that fails
      let response
      let moodAnalysis: MoodAnalysis

      try {
        response = await fetch("/api/analyze-mood", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: moodText }),
        })

        if (!response.ok) {
          throw new Error("Gemini API failed")
        }

        moodAnalysis = (await response.json()) as MoodAnalysis
      } catch (error) {
        toast({
          title: "Please describe your mood",
          description: `We need some text to analyze your mood "${error}" `,
          variant: "error",
        })
        console.log("Falling back to DeepSeek API")
        response = await fetch("/api/analyze-mood-deepseek", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: moodText }),
        })

        if (!response.ok) {
          throw new Error("All AI APIs failed")
        }

        moodAnalysis = (await response.json()) as MoodAnalysis
      }

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

      toast({
        title: "Playlist created!",
        description: `Your "${playlist.name}" playlist is ready`,
        variant: "success",
      })

      // Redirect to the playlist page
      router.push(`/playlist/${playlist.id}`)
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast({
        title: "Something went wrong",
        description: "We couldn't create your playlist. Please try again.",
        variant: "error",
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
          onChange={(e) => setMoodText(e.target.value)}
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

