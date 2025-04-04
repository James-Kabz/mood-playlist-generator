import { MoodAnalyzer } from "@/components/mood/mood-analyzer"
import { PlaylistDisplay } from "@/components/playlist/playlist-display"
import { RecentPlaylists } from "@/components/playlist/recent-playlists"
import { UserAuthButton } from "@/components/user-auth-button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Moodify
        </h1>
        <UserAuthButton />
      </header>

      <main className="container mx-auto py-8 px-4">
        <section className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Discover music for your mood</h2>
          <p className="text-lg text-neutral-300 mb-8">
            Tell us how you&apos;re feeling, and we&apos;ll create the perfect playlist for you
          </p>

          <MoodAnalyzer />
        </section>

        <section className="mt-16">
          <PlaylistDisplay />
        </section>

        <section className="mt-16">
          <h3 className="text-2xl font-semibold mb-6">Your Recent Playlists</h3>
          <RecentPlaylists />
        </section>
      </main>

      <footer className="container mx-auto py-6 text-center text-neutral-400 text-sm">
        <p>Moodify works with or without a Spotify account. Connect with Spotify for the full experience.</p>
      </footer>
    </div>
  )
}

