"use client"

import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import JoinRoomModal from "./JoinRoomModal"

interface ControlPanelProps {
    isRunning: boolean
    gameStarted: boolean
    activePlayer: any
    roomCode: string | null
    /** Used for Join Room dialog (portaled) styling */
    timerDark?: boolean
    onStartPause: () => void
    onNextTurn: () => void
    onStartReveal: () => void
    onEndRound: () => void
    onReset: () => void
    onToggleSettings: () => void
}

export const ControlPanel = ({
    isRunning,
    gameStarted,
    activePlayer,
    roomCode,
    timerDark = false,
    onStartPause,
    onNextTurn,
    onStartReveal,
    onEndRound,
    onReset,
    onToggleSettings,
}: ControlPanelProps) => {
    return (
        <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 dark:border-white/[0.08] dark:[background-image:none] dark:bg-zinc-900/75 dark:text-zinc-200 dark:shadow-none">
            <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Button
                        onClick={onStartPause}
                        size="lg"
                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 dark:border-0 dark:bg-gradient-to-b dark:from-amber-500/90 dark:to-amber-600/95 dark:text-white dark:shadow-[0_0_32px_-8px_rgba(217,119,6,0.28)] dark:hover:from-amber-500 dark:hover:to-amber-600"
                    >
                        {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isRunning ? "Pause" : gameStarted ? "Resume" : "Start Game"}
                    </Button>

                    <Button
                        onClick={onNextTurn}
                        disabled={!gameStarted}
                        size="lg"
                        variant="outline"
                        className="border-amber-600 text-amber-700 hover:bg-amber-50 px-8 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white dark:disabled:border-zinc-800 dark:disabled:text-zinc-600 dark:disabled:bg-zinc-950/50 dark:disabled:opacity-100"
                    >
                        Next Turn
                    </Button>

                    {activePlayer && !activePlayer.isRevealing && (
                        <Button
                            onClick={onStartReveal}
                            disabled={!gameStarted}
                            size="lg"
                            variant="outline"
                            className="border-purple-600 text-purple-700 hover:bg-purple-50 px-6 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white dark:disabled:border-zinc-800 dark:disabled:text-zinc-600 dark:disabled:bg-zinc-950/50 dark:disabled:opacity-100"
                        >
                            Start Reveal
                        </Button>
                    )}

                    <Button
                        onClick={onEndRound}
                        disabled={!gameStarted}
                        size="lg"
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50 px-6 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white dark:disabled:border-zinc-800 dark:disabled:text-zinc-600 dark:disabled:bg-zinc-950/50 dark:disabled:opacity-100"
                    >
                        End Round
                    </Button>


                    <Button
                        onClick={onReset}
                        size="lg"
                        variant="outline"
                        className="border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-rose-500/15 dark:text-rose-300/70 dark:hover:bg-rose-950/20 dark:hover:text-rose-200/90"
                    >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Reset
                    </Button>

                    {gameStarted && (
                        <Button
                            onClick={onToggleSettings}
                            size="lg"
                            variant="outline"
                            className="border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        >
                            <Settings className="w-5 h-5 mr-2" />
                            Settings
                        </Button>
                    )}

                    <JoinRoomModal roomCode={roomCode} timerDark={timerDark}>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-orange-400 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        >
                            Join Room
                        </Button>
                    </JoinRoomModal>

                </div>
                <div className="text-center mt-4 text-sm text-amber-700 dark:text-zinc-500 [&_strong]:dark:text-zinc-300">
                    <p>
                        <strong>Shortcuts:</strong> Space = Pause/Resume, → = Next Turn, ← = Previous Turn
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}
