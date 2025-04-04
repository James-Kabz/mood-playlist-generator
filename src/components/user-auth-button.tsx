"use client"

import { useState } from "react"
import Link from "next/link"
import { LogIn, User, LogOut, Music, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signIn, signOut } from "next-auth/react"

export function UserAuthButton() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn("spotify", { callbackUrl: window.location.href })
    setIsLoading(false)
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ callbackUrl: "/" })
    setIsLoading(false)
  }

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        className="bg-green-500 hover:bg-green-600 text-white"
        id="connect-spotify"
      >
        <LogIn className="h-4 w-4 mr-2" />
        {isLoading ? "Connecting..." : "Connect with Spotify"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
            <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/playlists">
            <Music className="mr-2 h-4 w-4" />
            <span>My Playlists</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open Spotify</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

