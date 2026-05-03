"use client"

import { Settings, Eye, EyeOff, Volume2, VolumeX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/utils"

interface SettingsPanelProps {
  showSettings: boolean
  gameStarted: boolean
  initialTime: number
  showAdjustButtons: boolean
  showColorSelectors: boolean
  soundEnabled: boolean
  onInitialTimeChange: (time: number) => void
  onToggleAdjustButtons: () => void
  onToggleColorSelectors: () => void
  onToggleSound: () => void
}

export const SettingsPanel = ({
  showSettings,
  gameStarted,
  initialTime,
  showAdjustButtons,
  showColorSelectors,
  soundEnabled,
  onInitialTimeChange,
  onToggleAdjustButtons,
  onToggleColorSelectors,
  onToggleSound,
}: SettingsPanelProps) => {
  if (!showSettings && gameStarted) return null

  return (
    <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-950 dark:border-white/[0.08] dark:[background-image:none] dark:bg-zinc-900/75 dark:text-zinc-200 dark:shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-zinc-100">
          <Settings className="w-5 h-5 dark:text-zinc-500" />
          Game Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Label htmlFor="initial-time" className="text-blue-700 dark:text-zinc-400 font-medium">
            Initial Time (minutes):
          </Label>
          <Input
            id="initial-time"
            type="number"
            min="1"
            max="60"
            value={initialTime / 60}
            onChange={(e) => onInitialTimeChange(Number.parseInt(e.target.value) * 60 || 600)}
            className="w-20 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200"
          />
          <span className="text-sm text-blue-600 dark:text-zinc-500">({formatTime(initialTime)} per player)</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={onToggleAdjustButtons}
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {showAdjustButtons ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showAdjustButtons ? "Hide" : "Show"} Time Adjust Buttons
          </Button>
          {gameStarted && (
            <Button
              onClick={onToggleColorSelectors}
              variant="outline"
              size="sm"
              className="border-blue-400 text-blue-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {showColorSelectors ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showColorSelectors ? "Hide" : "Show"} Color Selectors
            </Button>
          )}
          <Button
            onClick={onToggleSound}
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-600 dark:border-white/10 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {soundEnabled ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
            {soundEnabled ? "Disable" : "Enable"} Sound Effects
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SettingsPanel
