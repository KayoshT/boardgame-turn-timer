"use client"

import type React from "react"
import { Play, Clock, Plus, GripVertical, AlertTriangle, Edit2, Minus, GalleryHorizontalEnd } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Player } from "@/types"
import { formatTime, getTurnProgressColor } from "@/utils"

const AVAILABLE_COLORS = [
    {
        value: "blue",
        label: "Blue",
        bg: "bg-blue-50 dark:bg-zinc-900/45",
        border: "border-blue-200 dark:border-zinc-700/40",
        text: "text-blue-700 dark:text-blue-300/55",
        bar: "bg-blue-500",
    },
    {
        value: "green",
        label: "Green",
        bg: "bg-green-50 dark:bg-zinc-900/45",
        border: "border-green-200 dark:border-zinc-700/40",
        text: "text-green-700 dark:text-emerald-300/55",
        bar: "bg-green-500",
    },
    {
        value: "purple",
        label: "Purple",
        bg: "bg-purple-50 dark:bg-zinc-900/45",
        border: "border-purple-200 dark:border-zinc-700/40",
        text: "text-purple-700 dark:text-violet-300/55",
        bar: "bg-purple-500",
    },
    {
        value: "orange",
        label: "Orange",
        bg: "bg-orange-50 dark:bg-zinc-900/45",
        border: "border-orange-200 dark:border-zinc-700/40",
        text: "text-orange-700 dark:text-orange-300/50",
        bar: "bg-orange-500",
    },
    {
        value: "red",
        label: "Red",
        bg: "bg-red-50 dark:bg-zinc-900/45",
        border: "border-red-200 dark:border-zinc-700/40",
        text: "text-red-700 dark:text-rose-300/55",
        bar: "bg-red-500",
    },
    {
        value: "indigo",
        label: "Indigo",
        bg: "bg-indigo-50 dark:bg-zinc-900/45",
        border: "border-indigo-200 dark:border-zinc-700/40",
        text: "text-indigo-700 dark:text-indigo-300/55",
        bar: "bg-indigo-500",
    },
    {
        value: "pink",
        label: "Pink",
        bg: "bg-pink-50 dark:bg-zinc-900/45",
        border: "border-pink-200 dark:border-zinc-700/40",
        text: "text-pink-700 dark:text-pink-300/50",
        bar: "bg-pink-500",
    },
    {
        value: "teal",
        label: "Teal",
        bg: "bg-teal-50 dark:bg-zinc-900/45",
        border: "border-teal-200 dark:border-zinc-700/40",
        text: "text-teal-700 dark:text-teal-300/55",
        bar: "bg-teal-500",
    },
]

interface PlayerCardProps {
    player: Player
    isActive: boolean
    currentTurnTime: number
    gameStarted: boolean
    initialTime: number
    showAdjustButtons: boolean
    showColorSelectors: boolean
    editingPlayer: number | null
    editName: string
    onPlayerClick: (playerId: number) => void
    onDragStart: (playerId: number) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (targetPlayerId: number) => void
    onAdjustTime: (playerId: number, adjustment: number) => void
    onUpdateName: (playerId: number, newName: string) => void
    onUpdateColor: (playerId: number, newColor: string) => void
    onStartEdit: (playerId: number, currentName: string) => void
    onSetEditName: (name: string) => void
    onMarkRevealed?: (playerId: number) => void
}

const getPlayerColorStyles = (color: string) => {
    const colorOption = AVAILABLE_COLORS.find((c) => c.value === color) || AVAILABLE_COLORS[0]
    return colorOption
}

export const PlayerCard = ({
    player,
    isActive,
    currentTurnTime,
    gameStarted,
    initialTime,
    showAdjustButtons,
    showColorSelectors,
    editingPlayer,
    editName,
    onPlayerClick,
    onDragStart,
    onDragOver,
    onDrop,
    onAdjustTime,
    onUpdateName,
    onUpdateColor,
    onStartEdit,
    onSetEditName,
    onMarkRevealed,
}: PlayerCardProps) => {

    const colors = getPlayerColorStyles(player.color)
    const turnProgressColor = getTurnProgressColor(currentTurnTime)
    const isOvertime = currentTurnTime > 60

    // Calculate remaining time percentage for turn progress bar
    const turnTimeRemaining = Math.max(0, 60 - currentTurnTime)
    const turnProgressPercentage = (turnTimeRemaining / 60) * 100

    return (
        <Card
            draggable
            onDragStart={(e) => {
                onDragStart(player.id)
                e.dataTransfer.effectAllowed = "move"
            }}
            onDragOver={onDragOver}
            onDrop={(e) => {
                e.preventDefault()
                onDrop(player.id)
            }}
            onClick={() => onPlayerClick(player.id)}
            className={`transition-all duration-300 cursor-pointer touch-manipulation h-full ${isActive
                    ? "border-4 border-amber-500 bg-gradient-to-br from-amber-100 to-orange-100 shadow-xl text-amber-950 dark:border-amber-500/30 dark:[background-image:none] dark:bg-zinc-900/85 dark:text-zinc-100 dark:shadow-[0_0_48px_-12px_rgba(251,191,36,0.12)]"
                    : player.isOutOfRound
                        ? `border-2 border-gray-300 bg-gray-100 opacity-60 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:opacity-70`
                        : `border-2 ${colors.border} bg-white hover:shadow-md active:scale-[0.99] dark:bg-zinc-900/40`
                }`}
            style={{
                // Ensure consistent rendering and no height variations
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderWidth: isActive ? "4px" : "2px",
                borderStyle: "solid",
                minHeight: "100%",
            }}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 dark:text-zinc-600 cursor-grab touch-none" />
                        {editingPlayer === player.id ? (
                            <Input
                                value={editName}
                                onChange={(e) => onSetEditName(e.target.value)}
                                onBlur={() => onUpdateName(player.id, editName)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        onUpdateName(player.id, editName)
                                    }
                                    if (e.key === "Escape") {
                                        onStartEdit(-1, "")
                                    }
                                }}
                                className="text-xl font-semibold w-32"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <CardTitle
                                    className={`text-xl ${isActive ? "text-amber-800 dark:text-amber-100/90" : "text-gray-700 dark:text-zinc-300"}`}
                                >
                                    {player.name}
                                </CardTitle>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onStartEdit(player.id, player.name)
                                    }}
                                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100 touch-manipulation"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        {player.isOutOfRound && (
                            <Badge className="bg-gray-500 text-white text-xs dark:bg-zinc-700 dark:text-zinc-300">
                                Round Complete
                            </Badge>
                        )}
                        {player.isRevealing && (
                            <Badge className="bg-purple-500 text-white text-xs dark:bg-violet-600/25 dark:text-violet-200/90 dark:font-normal">
                                Revealing
                            </Badge>
                        )}
                        {isActive && isOvertime && (
                            <Badge className="bg-red-500 text-white text-xs animate-pulse dark:bg-rose-600/25 dark:text-rose-200/90 dark:font-normal">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overtime
                            </Badge>
                        )}
                        {isActive && !player.isOutOfRound && (
                            <Badge className="bg-amber-500 text-white text-xs dark:bg-amber-500/20 dark:text-amber-100/90 dark:font-normal">
                                <Play className="w-3 h-3 mr-1" />
                                Active
                            </Badge>
                        )}
                        {gameStarted && !isActive && onMarkRevealed && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkRevealed(player.id)
                                }}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-purple-600 hover:bg-purple-100 touch-manipulation shrink-0 dark:border-white/10 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06]"
                                title={player.isOutOfRound ? "Undo revealed" : "Mark as revealed"}
                            >
                                <GalleryHorizontalEnd className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Color Selection */}
                    {showColorSelectors && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600 dark:text-zinc-500">Color:</Label>
                            <Select value={player.color} onValueChange={(value) => onUpdateColor(player.id, value)}>
                                <SelectTrigger className="w-fit h-8" onClick={(e) => e.stopPropagation()}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_COLORS.map((color) => (
                                        <SelectItem key={color.value} value={color.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color.bar}`} />
                                                {color.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Main Timer */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                            <div
                                className={`text-3xl md:text-4xl font-mono font-bold ${player.timeRemaining < 60
                                        ? "text-red-600 dark:text-rose-400/65"
                                        : player.timeRemaining < 180
                                            ? "text-orange-600 dark:text-amber-400/55"
                                            : "text-green-600 dark:text-emerald-400/55"
                                    }`}
                            >
                                {formatTime(player.timeRemaining)}
                            </div>
                            {isActive && gameStarted && !player.isOutOfRound && (
                                <div className="flex items-center text-green-600 dark:text-emerald-400/50 text-sm font-medium">
                                    <Plus className="w-4 h-4" />
                                    <span>1:00</span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-zinc-500 mt-1">Time Remaining</p>

                        {/* Manual Time Adjustment */}
                        {showAdjustButtons && (
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAdjustTime(player.id, -60)
                                    }}
                                    className="h-8 w-8 p-0 touch-manipulation"
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs text-gray-500 dark:text-zinc-600 px-2">Adjust</span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onAdjustTime(player.id, 60)
                                    }}
                                    className="h-8 w-8 p-0 touch-manipulation"
                                >
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Turn Progress Bar (for active player) */}
                    {isActive && gameStarted && !player.isOutOfRound && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600 dark:text-zinc-500">
                                <span>Turn Progress</span>
                                <span>{Math.min(60 - currentTurnTime, 60)}/60s</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-zinc-800/80 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${turnProgressColor} ${isOvertime ? "animate-pulse" : ""
                                        }`}
                                    style={{ width: `${Math.max(0, turnProgressPercentage)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div
                            className={`rounded-lg p-3 ${player.currentTurnEfficiency >= 0 ? colors.bg : "bg-red-50 dark:bg-rose-950/20"}`}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Clock
                                    className={`w-4 h-4 ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-600 dark:text-rose-400/50"}`}
                                />
                                <span
                                    className={`text-xs md:text-sm font-medium ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-700 dark:text-rose-300/55"}`}
                                >
                                    Turn Efficiency
                                </span>
                            </div>
                            <div
                                className={`text-lg font-bold ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-800 dark:text-rose-200/60"}`}
                            >
                                {player.currentTurnEfficiency >= 0 ? "+ " : "- "}
                                {formatTime(Math.abs(player.currentTurnEfficiency))}
                                {Math.abs(player.currentTurnEfficiency) >= 60 ? "m" : "s"}
                            </div>
                        </div>

                        <div className={`rounded-lg p-3 ${colors.bg}`}>
                            <div className={`text-xs md:text-sm font-medium ${colors.text} mb-1`}>Turns</div>
                            <div className={`text-lg font-bold ${colors.text}`}>{player.turnsCompleted}</div>
                        </div>
                    </div>

                    {/* Overall Time Status Bar */}
                    <div className="w-full bg-gray-200 dark:bg-zinc-800/80 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                player.timeRemaining < 60
                                    ? "bg-red-500 dark:bg-rose-500/35"
                                    : player.timeRemaining < 180
                                      ? "bg-orange-500 dark:bg-amber-500/30"
                                      : `${colors.bar} dark:opacity-70`
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, (player.timeRemaining / initialTime) * 100))}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
