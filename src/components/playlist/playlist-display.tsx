"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, ExternalLink, Heart, Clock, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"

import { useSession } from "next-auth/react"
import { signIn } from "next-auth/react"
import { savePlaylist } from "@/lib/playlists/save-playlist"
import { getPlaylist } from "@/lib/playlists/get-playlist"
import { toast } from "sonner"

type Track = {
  id: string
  name: string
  artist: string
  album: string
  albumCover: string
  duration: string
  spotifyUrl: string
}

type Playlist = {
  id: string
  name: string
  description: string
  coverImage: string
  tracks: Track[]
  spotifyUrl: string
}

export function PlaylistDisplay() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const searchParams = useSearchParams()
  const playlistId = searchParams.get("id")
  const { data: session } = useSession()

  useEffect(() => {
    if (playlistId) {
      setIsLoading(true)
      getPlaylist(playlistId)
        .then((data) => {
          setPlaylist(data)
        })
        .catch((error) => {
          console.error("Error fetching playlist:", error)
          toast.error("Failed to load playlist",{
            description: "We couldn't load the playlist. Please try again.",
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [playlistId])

  const handleSavePlaylist = async () => {
    if (!playlist) return

    if (!session?.user) {
      // Prompt to sign in with Spotify
      toast.info("Authentication required",{
        description: "Please connect with Spotify to save playlists",
      })
      signIn("spotify", { callbackUrl: window.location.href })
      return
    }

    setIsSaving(true)
    try {
      await savePlaylist(playlist.id)
      toast.success("Playlist saved",{
        description: "The playlist has been saved to your account",
      })
    } catch (error) {
      console.error("Error saving playlist:", error)
      toast.error("Failed to save playlist",{
        description: "We couldn't save the playlist. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePlayOnSpotify = () => {
    if (!session?.user) {
      // Prompt to sign in with Spotify
      toast.info("Authentication required",{
        description: "Please connect with Spotify to play on Spotify",

      })
      signIn("spotify", { callbackUrl: window.location.href })
      return
    }

    if (playlist?.spotifyUrl && playlist.spotifyUrl !== "#") {
      window.open(playlist.spotifyUrl, "_blank")
    }
  }

  if (!playlistId) {
    return null
  }

  if (isLoading) {
    return <PlaylistSkeleton />
  }

  if (!playlist) {
    return null
  }

  return (
    <div className="bg-neutral-800/50 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-48 h-48 relative flex-shrink-0">
          <Image
            src={playlist.coverImage || "/placeholder.svg"}
            alt={playlist.name}
            fill
            className="object-cover rounded-lg"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold mb-2">{playlist.name}</h2>
          <p className="text-neutral-300 mb-4">{playlist.description}</p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <Button className="bg-green-500 hover:bg-green-600" onClick={handlePlayOnSpotify}>
              <Play className="mr-2 h-4 w-4" fill="currentColor" />
              Play on Spotify
            </Button>

            <Button variant="outline" onClick={handleSavePlaylist} disabled={isSaving}>
              <Heart className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Playlist"}
            </Button>

            <Button variant="outline">
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle Play
            </Button>

            {session?.user && playlist.spotifyUrl !== "#" && (
              <Button variant="outline" asChild>
                <a href={playlist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Spotify
                </a>
              </Button>
            )}
          </div>

          {!session?.user && (
            <div className="mt-4 text-sm text-neutral-400">
              <p>Connect with Spotify to save this playlist to your account and play on Spotify.</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="border-t border-neutral-700 pt-4">
          <table className="w-full">
            <thead>
              <tr className="text-neutral-400 text-sm border-b border-neutral-700">
                <th className="pb-2 text-left font-medium w-8">#</th>
                <th className="pb-2 text-left font-medium">Title</th>
                <th className="pb-2 text-left font-medium hidden md:table-cell">Album</th>
                <th className="pb-2 text-right font-medium">
                  <Clock className="h-4 w-4 inline" />
                </th>
              </tr>
            </thead>
            <tbody>
              {playlist.tracks.map((track, index) => (
                <tr key={track.id} className="hover:bg-neutral-700/30 group">
                  <td className="py-3 text-neutral-400">{index + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 relative hidden sm:block">
                        <Image
                          src={track.albumCover || "/placeholder.svg"}
                          alt={track.album}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{track.name}</div>
                        <div className="text-sm text-neutral-400">{track.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-neutral-400 hidden md:table-cell">{track.album}</td>
                  <td className="py-3 text-neutral-400 text-right">{track.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PlaylistSkeleton() {
  return (
    <div className="bg-neutral-800/50 rounded-xl border border-neutral-700 overflow-hidden p-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <Skeleton className="w-48 h-48 rounded-lg" />

        <div className="flex-1 space-y-4 w-full">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />

          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

