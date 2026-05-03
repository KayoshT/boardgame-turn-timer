"use client"

import { ChevronLeft, ChevronRight, Play, Eye, UserCheck, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MobileCardNavigationProps {
  currentIndex: number
  totalCards: number
  onPrevious: () => void
  onNext: () => void
  isActivePlayer?: boolean
  gameStarted?: boolean
  isRunning?: boolean
  isPaused?: boolean
}

export const MobileCardNavigation = ({
  currentIndex,
  totalCards,
  onPrevious,
  onNext,
  isActivePlayer = false,
  gameStarted = false,
  isRunning = false,
  isPaused = false,
}: MobileCardNavigationProps) => {
  const getButtonText = (direction: "next" | "previous") => {
    if (isPaused) {
      return direction === "next" ? "Next Player" : "Prev Player"
    }
    if (isActivePlayer && gameStarted && isRunning) {
      return direction === "next" ? "Next Turn" : "Prev Turn"
    }
    return direction === "next" ? "Next Card" : "Prev Card"
  }

  const getButtonIcon = (direction: "next" | "previous") => {
    if (isPaused) {
      return <UserCheck className="w-4 h-4" />
    }
    if (isActivePlayer && gameStarted && isRunning) {
      return <Play className="w-4 h-4" />
    }
    return direction === "next" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
  }

  const getButtonStyle = () => {
    if (isPaused) {
      return "bg-blue-100 border-blue-500 text-blue-700 font-medium dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:font-normal"
    }
    if (isActivePlayer && gameStarted && isRunning) {
      return "bg-amber-100 border-amber-500 text-amber-700 font-medium dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-100/90 dark:font-normal dark:shadow-[0_0_24px_-8px_rgba(245,158,11,0.2)]"
    }
    return "border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-white/10 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
  }

  return (
    <div className="flex items-center justify-between mb-4 lg:hidden">
      <Button
        onClick={onPrevious}
        variant="outline"
        size="sm"
        className={`transition-all duration-200 ${getButtonStyle()}`}
      >
        {getButtonIcon("previous")}
        <span className="ml-1">{getButtonText("previous")}</span>
      </Button>

      <div className="flex items-center gap-3">
        {/* Card Position Indicators */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalCards }, (_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "bg-amber-600 scale-125 dark:bg-amber-400/50" : "bg-amber-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Enhanced Status Badge */}
        {gameStarted && (
          <Badge
            variant="outline"
            className={`text-xs font-normal ${
              isPaused
                ? "border-zinc-300 text-zinc-600 bg-zinc-50 dark:border-white/10 dark:text-zinc-400 dark:bg-zinc-900/50"
                : isActivePlayer && isRunning
                  ? "border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-500/15 dark:text-emerald-200/75 dark:bg-emerald-950/25"
                  : isActivePlayer
                    ? "border-amber-300 text-amber-800 bg-amber-50 dark:border-amber-500/15 dark:text-amber-100/80 dark:bg-amber-950/20"
                    : "border-zinc-200 text-zinc-600 bg-zinc-50 dark:border-white/10 dark:text-zinc-500 dark:bg-zinc-900/40"
            }`}
          >
            {isPaused ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Select Player
              </>
            ) : isActivePlayer && isRunning ? (
              <>
                <Play className="w-3 h-3 mr-1" />
                Active Turn
              </>
            ) : isActivePlayer ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Active Player
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Viewing
              </>
            )}
          </Badge>
        )}
      </div>

      <Button
        onClick={onNext}
        variant="outline"
        size="sm"
        className={`transition-all duration-200 ${getButtonStyle()}`}
      >
        <span className="mr-1">{getButtonText("next")}</span>
        {getButtonIcon("next")}
      </Button>
    </div>
  )
}
