import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NextAuthProvider } from "../components/auth/next-auth-provider"
import { SonnerProvider } from "@/components/sonner-provider"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Moodify - AI-Powered Mood-Based Playlist Generator",
  description: "Create personalized playlists based on your mood using AI and Spotify",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          {/* <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange> */}
            {children}
            <SonnerProvider />
          {/* </ThemeProvider> */}
        </NextAuthProvider>
      </body>
    </html>
  )
}

