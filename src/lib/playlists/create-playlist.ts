import type { MoodAnalysis } from "../types"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "../prisma"
import { getSession } from "next-auth/react"
import type { Session, SpotifyTrack, CreatePlaylistResponse } from "../types"

export async function createPlaylist(moodAnalysis: MoodAnalysis, userId?: string): Promise<CreatePlaylistResponse> {
  try {
    // If user is authenticated, create playlist on Spotify
    if (userId) {
      const spotifyPlaylist = await createSpotifyPlaylist(moodAnalysis)

      // Save to database if user is authenticated
      const session = (await getSession()) as Session | null
      if (session?.user?.id) {
        await saveToDatabase(spotifyPlaylist, session.user.id)
      }

      return spotifyPlaylist
    }

    // Otherwise, create a local playlist with mock data
    return await createLocalPlaylist(moodAnalysis)
  } catch (error) {
    console.error("Error creating playlist:", error)
    throw new Error("Failed to create playlist")
  }
}

// Function to save playlist to database
async function saveToDatabase(playlistData: CreatePlaylistResponse, userId: string): Promise<string | null> {
  try {
    // Check if playlist already exists by spotifyId
    const existingPlaylist = await prisma.playlist.findFirst({
      where: {
        spotifyId: playlistData.id,
      },
    })

    if (existingPlaylist) {
      return existingPlaylist.id
    }

    // Create new playlist in database
    const playlist = await prisma.playlist.create({
      data: {
        name: playlistData.name,
        description: playlistData.description || "",
        spotifyId: playlistData.id,
        spotifyUrl: playlistData.spotifyUrl || "#",
        coverImage: playlistData.coverImage,
        userId: userId,
        moodData: JSON.parse(JSON.stringify(playlistData.moodAnalysis)),
        tracks: {
          create: playlistData.tracks.map((track) => ({
            name: track.name,
            artist: track.artist,
            album: track.album || "",
            albumCover: track.albumCover || "",
            duration: track.duration || "",
            spotifyId: track.id,
            spotifyUrl: track.spotifyUrl || "#",
          })),
        },
      },
    })

    return playlist.id
  } catch (error) {
    console.error("Error saving playlist to database:", error)
    // Don't throw here, just log the error and continue
    // This way, even if database save fails, user still gets their playlist
    return null
  }
}

async function createSpotifyPlaylist(moodAnalysis: MoodAnalysis): Promise<CreatePlaylistResponse> {
  try {
    const session = (await fetch("/api/auth/session").then((res) => res.json())) as Session | null

    if (!session?.accessToken) {
      throw new Error("No access token available")
    }

    // Use a list of valid Spotify genres
    // These are confirmed to work with the Spotify API
    const validSpotifyGenres = [
      "acoustic",
      "afrobeat",
      "alt-rock",
      "alternative",
      "ambient",
      "anime",
      "black-metal",
      "bluegrass",
      "blues",
      "bossanova",
      "brazil",
      "breakbeat",
      "british",
      "cantopop",
      "chicago-house",
      "children",
      "chill",
      "classical",
      "club",
      "comedy",
      "country",
      "dance",
      "dancehall",
      "death-metal",
      "deep-house",
      "detroit-techno",
      "disco",
      "disney",
      "drum-and-bass",
      "dub",
      "dubstep",
      "edm",
      "electro",
      "electronic",
      "emo",
      "folk",
      "forro",
      "french",
      "funk",
      "garage",
      "german",
      "gospel",
      "goth",
      "grindcore",
      "groove",
      "grunge",
      "guitar",
      "happy",
      "hard-rock",
      "hardcore",
      "hardstyle",
      "heavy-metal",
      "hip-hop",
      "holidays",
      "honky-tonk",
      "house",
      "idm",
      "indian",
      "indie",
      "indie-pop",
      "industrial",
      "iranian",
      "j-dance",
      "j-idol",
      "j-pop",
      "j-rock",
      "jazz",
      "k-pop",
      "kids",
      "latin",
      "latino",
      "malay",
      "mandopop",
      "metal",
      "metal-misc",
      "metalcore",
      "minimal-techno",
      "movies",
      "mpb",
      "new-age",
      "new-release",
      "opera",
      "pagode",
      "party",
      "philippines-opm",
      "piano",
      "pop",
      "pop-film",
      "post-dubstep",
      "power-pop",
      "progressive-house",
      "psych-rock",
      "punk",
      "punk-rock",
      "r-n-b",
      "rainy-day",
      "reggae",
      "reggaeton",
      "road-trip",
      "rock",
      "rock-n-roll",
      "rockabilly",
      "romance",
      "sad",
      "salsa",
      "samba",
      "sertanejo",
      "show-tunes",
      "singer-songwriter",
      "ska",
      "sleep",
      "songwriter",
      "soul",
      "soundtracks",
      "spanish",
      "study",
      "summer",
      "swedish",
      "synth-pop",
      "tango",
      "techno",
      "trance",
      "trip-hop",
      "turkish",
      "work-out",
      "world-music",
    ]

    // Map user genres to valid Spotify genres
    let seedGenres: string[] = []

    for (const genre of moodAnalysis.genres) {
      const normalizedGenre = genre.toLowerCase().replace(/\s+/g, "-")

      // Check if the normalized genre is valid
      if (validSpotifyGenres.includes(normalizedGenre)) {
        seedGenres.push(normalizedGenre)
      } else {
        // Try to find a close match
        const similarGenre = validSpotifyGenres.find((g) => g.includes(normalizedGenre) || normalizedGenre.includes(g))

        if (similarGenre) {
          seedGenres.push(similarGenre)
        }
      }
    }

    // Limit to 2 genres and ensure we have at least one
    seedGenres = seedGenres.slice(0, 2)

    // If no valid genres, use some safe defaults based on mood
    if (seedGenres.length === 0) {
      if (moodAnalysis.energy > 0.7) {
        seedGenres = ["pop", "dance"]
      } else if (moodAnalysis.energy < 0.3) {
        seedGenres = ["classical", "ambient"]
      } else {
        seedGenres = ["indie", "chill"]
      }
    }

    // Create a search query based on the mood analysis
    const searchParams = new URLSearchParams()
    searchParams.append("seed_genres", seedGenres.join(","))
    searchParams.append("limit", "10")

    // Only add parameters if they're within valid ranges
    if (moodAnalysis.energy >= 0 && moodAnalysis.energy <= 1) {
      searchParams.append("target_energy", moodAnalysis.energy.toString())
    }

    if (moodAnalysis.valence >= 0 && moodAnalysis.valence <= 1) {
      searchParams.append("target_valence", moodAnalysis.valence.toString())
    }

    if (moodAnalysis.tempo >= 60 && moodAnalysis.tempo <= 180) {
      searchParams.append("target_tempo", moodAnalysis.tempo.toString())
    }

    if (moodAnalysis.acousticness >= 0 && moodAnalysis.acousticness <= 1) {
      searchParams.append("target_acousticness", moodAnalysis.acousticness.toString())
    }

    if (moodAnalysis.danceability >= 0 && moodAnalysis.danceability <= 1) {
      searchParams.append("target_danceability", moodAnalysis.danceability.toString())
    }

    console.log("Requesting recommendations with params:", searchParams.toString())

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
      const errorText = await recommendationsResponse.text()
      console.error("Spotify API error:", errorText)
      throw new Error(`Failed to get recommendations from Spotify: ${recommendationsResponse.status}`)
    }

    const recommendations = await recommendationsResponse.json()
    const tracks = recommendations.tracks || []

    if (tracks.length === 0) {
      throw new Error("No tracks returned from Spotify recommendations")
    }

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
    const playlistDescription = moodAnalysis.description || `A ${moodAnalysis.mood} playlist`

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
    const trackUris = tracks.map((track: SpotifyTrack) => track.uri)

    if (trackUris.length > 0) {
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: trackUris,
        }),
      })

      if (!addTracksResponse.ok) {
        console.error("Failed to add tracks to playlist, but continuing...")
      }
    }

    // Format the playlist data
    const playlistData: CreatePlaylistResponse = {
      id: playlist.id,
      name: playlistName,
      description: playlistDescription,
      spotifyId: playlist.id,
      spotifyUrl: playlist.external_urls?.spotify || "#",
      coverImage: playlist.images?.[0]?.url || "/placeholder.svg?height=300&width=300",
      tracks: tracks.map((track: SpotifyTrack) => ({
        id: track.id,
        name: track.name,
        artist: track.artists?.map((artist) => artist.name).join(", ") || "Unknown Artist",
        album: track.album?.name || "Unknown Album",
        albumCover: track.album?.images?.[0]?.url || "/placeholder.svg?height=64&width=64",
        duration: formatDuration(track.duration_ms || 0),
        spotifyUrl: track.external_urls?.spotify || "#",
      })),
      moodAnalysis,
      createdAt: new Date().toISOString(),
    }

    return playlistData
  } catch (error) {
    console.error("Error creating Spotify playlist:", error)
    // If Spotify API fails, fall back to local playlist
    return createLocalPlaylist(moodAnalysis)
  }
}

async function createLocalPlaylist(moodAnalysis: MoodAnalysis): Promise<CreatePlaylistResponse> {
  // Generate mock data based on the mood
  const playlistId = uuidv4()
  const playlistName = `${moodAnalysis.mood} Mood - ${new Date().toLocaleDateString()}`

  // Create different mock tracks based on the mood
  const tracks = getMockTracksForMood(moodAnalysis)

  return {
    id: playlistId,
    name: playlistName,
    description: moodAnalysis.description || `A ${moodAnalysis.mood} playlist`,
    spotifyId: playlistId,
    spotifyUrl: "#",
    coverImage: "/placeholder.svg?height=300&width=300",
    tracks,
    moodAnalysis,
    createdAt: new Date().toISOString(),
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

