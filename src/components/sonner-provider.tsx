"use client"

import { Toaster } from "sonner"

export function SonnerProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1e1e1e",
          color: "#ffffff",
          border: "1px solid #333333",
        },
        className: "sonner-toast",
        duration: 4000,
      }}
    />
  )
}

