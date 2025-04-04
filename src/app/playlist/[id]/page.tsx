import type { Metadata } from "next"
import { PlaylistDisplay } from "@/components/playlist/playlist-display"
import { RecentPlaylists } from "@/components/playlist/recent-playlists"
import { UserAuthButton } from "@/components/user-auth-button"

export const metadata: Metadata = {
  title: "Playlist | Moodify",
  description: "View your mood-based playlist",
}

export default function PlaylistPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Moodify
        </h1>
        <UserAuthButton />
      </header>

      <main className="container mx-auto py-8 px-4">
        <section className="max-w-4xl mx-auto mb-12">
          <PlaylistDisplay />
        </section>

        <section className="mt-16">
          <h3 className="text-2xl font-semibold mb-6">Your Recent Playlists</h3>
          <RecentPlaylists />
        </section>
      </main>
    </div>
  )
}

