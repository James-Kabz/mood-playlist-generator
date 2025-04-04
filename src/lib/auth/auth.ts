import type { NextAuthOptions } from "next-auth"
import type { User } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import type { JWT } from "next-auth/jwt"

// Spotify scopes for API access
const scopes = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
].join(" ")

// Function to refresh the access token when it expires
async function refreshAccessToken(token: JWT) {
  try {
    const url = "https://accounts.spotify.com/api/token"
    const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString(
      "base64",
    )

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw data
    }

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
    }
  } catch (error) {
    console.error("Error refreshing access token", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
      authorization: {
        params: { scope: scopes },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token has expired, refresh it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.error = token.error as string | undefined
    
        // Add user ID to the session
        if (token.user) {
          session.user = {
            ...session.user,
            id: (token.user as User).id || token.sub,
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
}

