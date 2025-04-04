import { toast as sonnerToast } from "sonner"

type ToastType = "default" | "success" | "error" | "warning" | "info"

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastType
  duration?: number
}

export function toast({ title, description, variant = "default", duration }: ToastOptions) {
  const options = {
    duration,
  }

  switch (variant) {
    case "success":
      return sonnerToast.success(title, {
        description,
        ...options,
      })
    case "error":
      return sonnerToast.error(title, {
        description,
        ...options,
      })
    case "warning":
      return sonnerToast.warning(title, {
        description,
        ...options,
      })
    case "info":
      return sonnerToast.info(title, {
        description,
        ...options,
      })
    default:
      return sonnerToast(title, {
        description,
        ...options,
      })
  }
}

