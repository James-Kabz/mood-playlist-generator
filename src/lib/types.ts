// Define all types for the application to avoid using 'any'

export interface User {
    id: string
    name?: string
    email?: string
    image?: string
  }
  
  export interface Session {
    user: User
    accessToken?: string
    refreshToken?: string
    error?: string
  }
  
  export interface MoodAnalysis {
    mood: string
    genres: string[]
    energy: number
    valence: number
    tempo: number
    acousticness: number
    danceability: number
    description: string
  }
  
  export interface Track {
    id: string
    name: string
    artist: string
    album?: string
    albumCover?: string
    duration?: string
    spotifyId: string
    spotifyUrl?: string
  }
  
  export interface Playlist {
    id: string
    name: string
    description?: string
    spotifyId: string
    spotifyUrl: string
    coverImage?: string
    tracks: Track[]
    moodData?: MoodAnalysis
    images: {
      url?: string
    }[];
    added_at?: Date
    createdAt: Date
    updatedAt: Date
  }
  
  export interface SpotifyTrack {
    id: string
    name: string
    uri: string
    duration_ms: number
    artists: SpotifyArtist[]
    album: SpotifyAlbum
    external_urls: {
      spotify: string
    }
  }
  
  export interface SpotifyArtist {
    id: string
    name: string
    external_urls: {
      spotify: string
    }
  }
  
  export interface SpotifyAlbum {
    id: string
    name: string
    images: SpotifyImage[]
    external_urls: {
      spotify: string
    }
  }
  
  export interface SpotifyImage {
    url: string
    height: number
    width: number
  }
  
  export interface SpotifyPlaylist {
    id: string
    name: string
    description: string
    images: SpotifyImage[]
    external_urls: {
      spotify: string
    }
    tracks: {
      items: {
        track: SpotifyTrack
        added_at: string
      }[]
    }
  }
  
  export interface PlaylistSummary {
    id: string
    name: string
    description: string
    coverImage: string
    createdAt: string
  }
  
  export interface CreatePlaylistResponse {
    id: string
    name: string
    description: string
    spotifyUrl: string
    coverImage: string
    tracks: {
      id: string
      name: string
      artist: string
      album?: string
      albumCover?: string
      duration?: string
      spotifyUrl?: string
    }[]
    moodAnalysis: MoodAnalysis
    createdAt: string
    spotifyId: string
  }
  
  

  