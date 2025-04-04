import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    id?: string
  }

  interface Session {
    accessToken?: string
    refreshToken?: string
    error?: string
    user?: {
      id?: string
      role?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
    role?: string
    id?: string
  }
}
