"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserPlaylists } from "@/lib/playlists/get-user-playlists"

type PlaylistSummary = {
  id: string
  name: string
  description: string
  coverImage: string
  createdAt: string
}

export function RecentPlaylists() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getUserPlaylists()
      .then((data) => {
        setPlaylists(data)
      })
      .catch((error) => {
        console.error("Error fetching user playlists:", error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-neutral-800/50 rounded-xl border border-neutral-700 overflow-hidden p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-24 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-800/30 rounded-xl border border-neutral-700">
        <p className="text-neutral-400">You haven&apos;t created any playlists yet.</p>
        <p className="mt-2">Describe your mood above to get started!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className="bg-neutral-800/50 rounded-xl border border-neutral-700 overflow-hidden hover:bg-neutral-800 transition-colors"
        >
          <Link href={`/playlist/${playlist.id}`} className="block p-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={playlist.coverImage || "/placeholder.svg"}
                  alt={playlist.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-md"
                />
              </div>

              <div className="flex-1">
                <h4 className="font-medium line-clamp-1">{playlist.name}</h4>
                <p className="text-sm text-neutral-400 line-clamp-2 mt-1">{playlist.description}</p>

                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>{playlist.createdAt}</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Button size="sm" className="w-full bg-green-500/80 hover:bg-green-500 text-xs">
                <Play className="mr-1 h-3 w-3" fill="currentColor" />
                Play on Spotify
              </Button>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}

