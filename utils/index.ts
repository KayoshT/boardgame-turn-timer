import { AVAILABLE_COLORS } from "@/constants"
import type { ColorOption } from "@/types"

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export const getPlayerColors = (color: string): ColorOption => {
  console.log(color)
  return AVAILABLE_COLORS.find((c) => c.value === color) || AVAILABLE_COLORS[0]
}

export const getTurnProgressColor = (secondsUsed: number): string => {
  if (secondsUsed < 30) {
    return "bg-emerald-500 dark:bg-emerald-500"
  } else if (secondsUsed < 50) {
    return "bg-amber-500 dark:bg-amber-500"
  } else {
    return "bg-rose-500 dark:bg-rose-500"
  }
}
