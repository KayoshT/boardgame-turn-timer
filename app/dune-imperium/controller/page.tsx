"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { GalleryHorizontalEnd, Moon, Pause, Play, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/useSocket"
import { formatTime } from "@/utils"
import { HostState } from "@/types"
import { useSearchParams } from "next/navigation"
import ConnectingModal from "@/components/ConnectingModal"
import useThrottledEmit from "@/hooks/useThrottledEmit"
import { Spinner } from "@/components/ui/spinner"

const TIMER_DARK_STORAGE_KEY = "dune-imperium-timer-dark"

export default function Controller() {

    const searchParams = useSearchParams()
    const roomCode = searchParams.get("roomCode")

    const { connected, emit, emitWithAck, on, off, socket } = useSocket()
    const lastJoinedSocketId = useRef<string | null>(null)

    const throttledEmit = useThrottledEmit(emit)

    const [hostState, setHostState] = useState<HostState | null>(null)

    const [timerDark, setTimerDark] = useState(() => {
        if (typeof window === "undefined") return false
        return window.localStorage.getItem(TIMER_DARK_STORAGE_KEY) === "1"
    })

    const toggleTimerDark = () => {
        setTimerDark((prev) => {
            const next = !prev
            window.localStorage.setItem(TIMER_DARK_STORAGE_KEY, next ? "1" : "0")
            return next
        })
    }

    const activePlayer = useMemo(
        () => hostState?.players?.find((p) => p.isActive) ?? null,
        [hostState]
    )

    const isPaused = !!(hostState?.gameStarted && !hostState?.isRunning)
    const isRevealing = !!activePlayer?.isRevealing
    const isOutOfRound = !!activePlayer?.isOutOfRound

    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!hostState?.isRunning) return

        const id = window.setInterval(() => {
            setNow(Date.now())
        }, 250)

        return () => window.clearInterval(id)
    }, [hostState?.isRunning])

    const getDisplayTimeRemaining = (p: HostState["players"][number]) => {
        if (!hostState) return p.timeRemaining
        if (!hostState.isRunning) return p.timeRemaining
        if (!p.isActive) return p.timeRemaining

        const elapsedMs = Math.max(0, now - (hostState.sentAt ?? now))
        const elapsedSeconds = elapsedMs / 1000


        return Math.max(0, Math.ceil(p.timeRemaining - elapsedSeconds))
    }
    const timeRemaining = activePlayer ? getDisplayTimeRemaining(activePlayer) : null


    // Join room + request state
    useEffect(() => {
        if (!connected || !socket?.id || !roomCode) return
        if (lastJoinedSocketId.current === socket.id) return

        lastJoinedSocketId.current = socket.id

        emit("room:join", { roomCode, role: "controller" })
        emit("host:requestState")
    }, [connected, socket?.id, emit, roomCode])

    // Listen for host state
    useEffect(() => {
        if (!connected) return

        const handleState = (payload: any) => {
            // Support either raw snapshot or {roomCode, snapshot}
            const state: HostState = payload?.snapshot ?? payload
            if (!state?.players) return
            setHostState(state)
            setNow(Date.now())
        }

        on("host:state", handleState)
        return () => off("host:state", handleState)
    }, [connected, on, off])

    const [nextTurnPending, setNextTurnPending] = useState(false)

    const handleNextTurn = async () => {
        if (!roomCode || nextTurnPending) return
        try {
            setNextTurnPending(true)
            const res = await emitWithAck<{ ok: boolean; error?: string }>(
                "game:nextTurn",
                { roomCode },
                8000
            )
            if (!res?.ok) throw new Error(res?.error ?? "Next turn failed")
        } finally {
            setNextTurnPending(false)
        }
    }

    return (
        <div className={cn(timerDark && "dark")}>
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:bg-zinc-950 dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-8%,rgba(251,191,36,0.06),transparent_52%)]">
                {<ConnectingModal open={!connected} />}
                <div className="w-full max-w-md flex justify-end mb-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleTimerDark}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
                        aria-label={timerDark ? "Use light timer theme" : "Use dark timer theme"}
                    >
                        {timerDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="w-full py-2 max-w-md rounded-3xl border border-amber-200/70 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden dark:border-white/[0.08] dark:bg-zinc-900/55 dark:backdrop-blur-xl dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)]">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-medium uppercase tracking-wide text-amber-700/70 dark:text-zinc-500">
                                {connected ? "Active Player" : "Connecting…"}
                            </div>
                            <div className="mt-0.5 text-xl font-semibold text-amber-950 dark:text-zinc-100 truncate">
                                {activePlayer?.name ?? "Waiting for host…"}
                            </div>
                            {timeRemaining != null && (
                                <div
                                    className={`mt-1 text-4xl font-semibold font-mono ${timeRemaining < 60
                                        ? "text-red-600 dark:text-rose-400/60"
                                        : timeRemaining < 180
                                            ? "text-orange-600 dark:text-amber-400/50"
                                            : "text-green-600 dark:text-emerald-400/50"
                                        }`}
                                >
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                        </div>

                        {/* Round pill */}
                        <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-right shadow-sm dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-none">
                            <div className="text-[11px] font-medium text-amber-700/70 dark:text-zinc-500 leading-none">
                                Round
                            </div>
                            <div className="mt-1 font-mono text-2xl font-semibold tracking-tight text-amber-950 dark:text-zinc-200 leading-none">
                                {hostState?.currentRound ?? "--"}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mt-3 flex items-center justify-between">
                        <div
                            className={[
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                                isPaused
                                    ? "bg-red-100/70 text-red-800 dark:bg-rose-950/25 dark:text-rose-200/70"
                                    : "bg-amber-100/70 text-amber-800 dark:bg-emerald-950/20 dark:text-emerald-200/70",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "h-2 w-2 rounded-full",
                                    isPaused ? "bg-red-500" : "bg-green-500 animate-pulse",
                                ].join(" ")}
                            />
                            {hostState ? (isPaused ? "Timer paused" : "Timer running") : "Waiting for host…"}
                        </div>

                        {isRevealing && (
                            <div className="text-xs font-semibold text-purple-700 dark:text-violet-300/60">REVEALING</div>
                        )}
                    </div>

                    {/* Player list */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {(hostState?.players ?? []).map((p) => {
                            const isOut = p.isOutOfRound

                            return (
                                <div
                                    key={p.id}
                                    className={[
                                        "flex items-center justify-between rounded-xl border px-3 py-2 transition",
                                        p.isActive
                                            ? "border-emerald-300/80 bg-emerald-50/60 dark:border-emerald-500/15 dark:bg-emerald-950/20"
                                            : isOut
                                                ? "border-gray-400 bg-gray-100/50 opacity-50 dark:border-zinc-700/50 dark:bg-zinc-900/40 dark:opacity-60"
                                                : "border-amber-200 bg-white/60 dark:border-white/[0.06] dark:bg-zinc-800/40",
                                    ].join(" ")}
                                >
                                    <div className="min-w-0">
                                        <div
                                            className={[
                                                "font-medium truncate",
                                                isOut ? "text-gray-500 dark:text-zinc-600" : "text-amber-950 dark:text-zinc-200",
                                            ].join(" ")}
                                        >
                                            {p.name}
                                        </div>

                                        <div
                                            className={[
                                                "text-xs",
                                                isOut ? "text-gray-500 dark:text-zinc-600" : "text-amber-700/70 dark:text-zinc-500",
                                            ].join(" ")}
                                        >
                                            {formatTime(
                                                activePlayer?.name === p.name
                                                    ? timeRemaining ?? 0
                                                    : p.timeRemaining ?? 0
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {p.isActive && (
                                            <span className="text-xs font-semibold text-green-700 dark:text-emerald-400/55">
                                                ACTIVE
                                            </span>
                                        )}
                                        {hostState?.gameStarted && !p.isActive && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 text-gray-500 hover:text-purple-600 hover:bg-purple-100 dark:border-white/10 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06]"
                                                title={p.isOutOfRound ? "Undo revealed" : "Mark as revealed"}
                                                onClick={() =>
                                                    throttledEmit(
                                                        "game:markPlayerRevealed",
                                                        { roomCode, playerId: p.id },
                                                        400
                                                    )
                                                }
                                            >
                                                <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>


                    {/* Actions */}

                    {hostState?.gameStarted &&
                        <div className="mt-5 grid grid-cols-1 gap-4">
                            {activePlayer && <>

                                <Button
                                    className={[
                                        "h-12 text-sm rounded-xl active:scale-[0.98] transition flex items-center justify-center",
                                        isRevealing
                                            ? "bg-purple-500 hover:bg-purple-600 text-white dark:bg-violet-600/80 dark:hover:bg-violet-600"
                                            : "bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-600/10 dark:border-violet-500/25 dark:text-violet-300/70 dark:hover:bg-violet-950/25",
                                    ].join(" ")}
                                    onClick={() =>
                                        throttledEmit("game:revealTurn", { roomCode }, 800)
                                    }
                                >
                                    {isRevealing ? "Revealing..." : "Start reveal"}
                                </Button>

                                <Button
                                    onClick={() =>
                                        throttledEmit("game:pauseResume", { roomCode }, 500)
                                    }
                                    className={[
                                        "h-12 text-sm rounded-xl active:scale-[0.98] transition flex items-center justify-center",
                                        isPaused
                                            ? "bg-[#D47512] hover:bg-[#c86810] text-white dark:bg-gradient-to-b dark:from-amber-500/90 dark:to-amber-600/95 dark:shadow-[0_0_24px_-8px_rgba(217,119,6,0.25)]"
                                            : "bg-transparent border-2 border-[#D47512] text-[#D47512] hover:bg-[#D47512]/10 dark:border-amber-500/25 dark:text-amber-200/75 dark:hover:bg-amber-500/10",
                                    ].join(" ")}
                                >
                                    {isPaused ? (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Resume timer
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            Pause timer
                                        </>
                                    )}
                                </Button>
                            </>
                            }
                            <Button
                                className="h-12 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-[0.99] transition dark:bg-rose-600/75 dark:hover:bg-rose-600 dark:shadow-[0_0_24px_-8px_rgba(225,29,72,0.25)]"
                                disabled={!connected || nextTurnPending} onClick={handleNextTurn}
                            >
                                {nextTurnPending ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner size="sm" className="border-red-400 border-t-white" />
                                    </span>
                                ) : (
                                    "Next turn"
                                )}
                            </Button>
                        </div>}
                </div>
            </div>
            </div>
        </div>
    )
}
