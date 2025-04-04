
import { v4 as uuidv4 } from "uuid"
import { MoodAnalysis } from "../mood/analyze-mood"

interface Track {
  uri: string;
  id?: string;
  name?: string;
  artists?: string[]; // Already defined as an array of strings
  album: {
    name?: string;
    images: {
      url?: string;
    }[];
  }
  duration_ms: number;
  external_urls: {
    spotify?: string;
  }
  // Add other properties as needed
}

export async function createPlaylist(moodAnalysis: MoodAnalysis, userId?: string) {
  try {
    // If user is authenticated, create playlist on Spotify
    if (userId) {
      return await createSpotifyPlaylist(moodAnalysis)
    }

    // Otherwise, create a local playlist with mock data
    return await createLocalPlaylist(moodAnalysis)
  } catch (error) {
    console.error("Error creating playlist:", error)
    throw new Error("Failed to create playlist")
  }
}

async function createSpotifyPlaylist(moodAnalysis: MoodAnalysis) {
  try {
    const session = await fetch("/api/auth/session").then((res) => res.json())

    if (!session?.accessToken) {
      throw new Error("No access token available")
    }

    // Create a search query based on the mood analysis
    const searchParams = new URLSearchParams({
      seed_genres: moodAnalysis.genres.slice(0, 5).join(","),
      limit: "50",
      target_energy: moodAnalysis.energy.toString(),
      target_valence: moodAnalysis.valence.toString(),
      target_tempo: moodAnalysis.tempo.toString(),
      target_acousticness: moodAnalysis.acousticness.toString(),
      target_danceability: moodAnalysis.danceability.toString(),
    })

    // Get recommendations from Spotify
    const recommendationsResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!recommendationsResponse.ok) {
      throw new Error("Failed to get recommendations from Spotify")
    }

    const recommendations = await recommendationsResponse.json()
    const tracks = recommendations.tracks

    // Get user info
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to get user info from Spotify")
    }

    const user = await userResponse.json()
    const userId = user.id

    // Create a new playlist
    const playlistName = `${moodAnalysis.mood} Mood - ${new Date().toLocaleDateString()}`
    const playlistDescription = moodAnalysis.description

    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: false,
      }),
    })

    if (!createPlaylistResponse.ok) {
      throw new Error("Failed to create playlist on Spotify")
    }

    const playlist = await createPlaylistResponse.json()

    // Add tracks to the playlist
    const trackUris = tracks.map((track: Track) => track.uri)

    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    })

    // Format the playlist data
    const playlistData = {
      id: playlist.id,
      userId,
      name: playlistName,
      description: playlistDescription,
      spotifyId: playlist.id,
      spotifyUrl: playlist.external_urls.spotify,
      coverImage: playlist.images[0]?.url || "/placeholder.svg?height=300&width=300",
      tracks: tracks.map((track: Track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.join(", "),
        album: track.album.name,
        albumCover: track.album.images[0]?.url || "/placeholder.svg?height=64&width=64",
        duration: formatDuration(track.duration_ms),
        spotifyUrl: track.external_urls.spotify,
      })),
      moodAnalysis,
      createdAt: new Date(),
    }

    return playlistData
  } catch (error) {
    console.error("Error creating Spotify playlist:", error)
    // If Spotify API fails, fall back to local playlist
    return createLocalPlaylist(moodAnalysis)
  }
}

async function createLocalPlaylist(moodAnalysis: MoodAnalysis) {
  // Generate mock data based on the mood
  const playlistId = uuidv4()
  const playlistName = `${moodAnalysis.mood} Mood - ${new Date().toLocaleDateString()}`

  // Create different mock tracks based on the mood
  const tracks = getMockTracksForMood(moodAnalysis)

  return {
    id: playlistId,
    name: playlistName,
    description: moodAnalysis.description,
    spotifyUrl: "#",
    coverImage: "/placeholder.svg?height=300&width=300",
    tracks,
    moodAnalysis,
    createdAt: new Date(),
  }
}

function getMockTracksForMood(moodAnalysis: MoodAnalysis) {
  // High energy, positive valence
  if (moodAnalysis.energy > 0.7 && moodAnalysis.valence > 0.7) {
    return [
      {
        id: "1",
        name: "Don't Stop Me Now",
        artist: "Queen",
        album: "Jazz",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:29",
        spotifyUrl: "#",
      },
      {
        id: "2",
        name: "Uptown Funk",
        artist: "Mark Ronson ft. Bruno Mars",
        album: "Uptown Special",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "4:30",
        spotifyUrl: "#",
      },
      {
        id: "3",
        name: "Can't Stop the Feeling!",
        artist: "Justin Timberlake",
        album: "Trolls (Original Motion Picture Soundtrack)",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:56",
        spotifyUrl: "#",
      },
      {
        id: "4",
        name: "Happy",
        artist: "Pharrell Williams",
        album: "G I R L",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:53",
        spotifyUrl: "#",
      },
      {
        id: "5",
        name: "Good as Hell",
        artist: "Lizzo",
        album: "Cuz I Love You",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "2:39",
        spotifyUrl: "#",
      },
    ]
  }

  // Low energy, low valence (sad, calm)
  if (moodAnalysis.energy < 0.4 && moodAnalysis.valence < 0.4) {
    return [
      {
        id: "1",
        name: "Someone Like You",
        artist: "Adele",
        album: "21",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "4:45",
        spotifyUrl: "#",
      },
      {
        id: "2",
        name: "Fix You",
        artist: "Coldplay",
        album: "X&Y",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "4:55",
        spotifyUrl: "#",
      },
      {
        id: "3",
        name: "Skinny Love",
        artist: "Bon Iver",
        album: "For Emma, Forever Ago",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:58",
        spotifyUrl: "#",
      },
      {
        id: "4",
        name: "Hurt",
        artist: "Johnny Cash",
        album: "American IV: The Man Comes Around",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:38",
        spotifyUrl: "#",
      },
      {
        id: "5",
        name: "Hallelujah",
        artist: "Jeff Buckley",
        album: "Grace",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "6:53",
        spotifyUrl: "#",
      },
    ]
  }

  // Focus, study (medium energy, medium-high valence)
  if (moodAnalysis.energy < 0.6 && moodAnalysis.energy > 0.3 && moodAnalysis.valence > 0.4) {
    return [
      {
        id: "1",
        name: "Experience",
        artist: "Ludovico Einaudi",
        album: "In a Time Lapse",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "5:15",
        spotifyUrl: "#",
      },
      {
        id: "2",
        name: "Divenire",
        artist: "Ludovico Einaudi",
        album: "Divenire",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "6:42",
        spotifyUrl: "#",
      },
      {
        id: "3",
        name: "Nuvole Bianche",
        artist: "Ludovico Einaudi",
        album: "Una Mattina",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "5:57",
        spotifyUrl: "#",
      },
      {
        id: "4",
        name: "River Flows In You",
        artist: "Yiruma",
        album: "First Love",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "3:50",
        spotifyUrl: "#",
      },
      {
        id: "5",
        name: "Comptine d'un autre été",
        artist: "Yann Tiersen",
        album: "Amélie",
        albumCover: "/placeholder.svg?height=64&width=64",
        duration: "2:21",
        spotifyUrl: "#",
      },
    ]
  }

  // Default tracks
  return [
    {
      id: "1",
      name: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      albumCover: "/placeholder.svg?height=64&width=64",
      duration: "3:20",
      spotifyUrl: "#",
    },
    {
      id: "2",
      name: "Shape of You",
      artist: "Ed Sheeran",
      album: "÷",
      albumCover: "/placeholder.svg?height=64&width=64",
      duration: "3:53",
      spotifyUrl: "#",
    },
    {
      id: "3",
      name: "Dance Monkey",
      artist: "Tones and I",
      album: "The Kids Are Coming",
      albumCover: "/placeholder.svg?height=64&width=64",
      duration: "3:29",
      spotifyUrl: "#",
    },
    {
      id: "4",
      name: "Watermelon Sugar",
      artist: "Harry Styles",
      album: "Fine Line",
      albumCover: "/placeholder.svg?height=64&width=64",
      duration: "2:54",
      spotifyUrl: "#",
    },
    {
      id: "5",
      name: "Bad Guy",
      artist: "Billie Eilish",
      album: "When We All Fall Asleep, Where Do We Go?",
      albumCover: "/placeholder.svg?height=64&width=64",
      duration: "3:14",
      spotifyUrl: "#",
    },
  ]
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

