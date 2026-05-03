import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
    currentTurnTime: number
    currentRound: number
    activePlayersCount: number
}

export const Header = ({ currentTurnTime, currentRound, activePlayersCount }: HeaderProps) => {
    return (
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-amber-900 mb-2 tracking-tight dark:text-transparent dark:bg-gradient-to-br dark:from-zinc-100 dark:via-amber-100/85 dark:to-zinc-400 dark:bg-clip-text">
                DUNE: IMPERIUM
            </h1>
            <p className="text-xl text-amber-700 dark:text-zinc-500">Turn Timer</p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500/40" />
                    <span className="text-lg font-mono text-amber-800 dark:text-zinc-300 tabular-nums">
                        Current Turn: {currentTurnTime}s
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-amber-700 dark:text-zinc-500">Round {currentRound}</span>
                    <Badge
                        variant="outline"
                        className="border-amber-400 text-amber-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:font-normal"
                    >
                        {activePlayersCount} players active
                    </Badge>
                </div>
            </div>
        </div>
    )
}
