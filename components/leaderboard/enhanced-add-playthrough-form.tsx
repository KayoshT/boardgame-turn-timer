"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { BarChart3, Calendar, Crown, Flag, Gem, Landmark, NotebookText, Plus, ScrollText, Shield, Swords, Trash2, Trophy, Users, Zap } from "lucide-react"

interface Leader {
  id: string
  name: string
  faction: string
}

interface StrategicArchetype {
  id: string
  name: string
  description?: string
}

interface PlayerResult {
  playerName: string
  rank: number
  playerId?: string
  leaderId?: string
  leaderName?: string
  strategicArchetypeId?: string

  score?: number
  turnOrderPosition?: number

  vpSourcesBase?: number
  vpSourcesConflictCards?: number
  vpSourcesFinalConflict?: number
  vpSourcesBattleIconMatches?: number
  vpSourcesSpiceMustFlow?: number
  vpSourcesIntrigueCards?: number
  vpSourcesTechTiles?: number
  vpSourcesImperiumCards?: number
  vpSourcesLeaderAbilities?: number
  vpSourcesFactions?: number
  vpSourcesUnaccounted?: number

  endgameSpiceCount?: number
  endgameSolariCount?: number
  endgameWaterCount?: number

  influenceEmperor?: number
  influenceSpacingGuild?: number
  influenceBeneGesserit?: number
  influenceFremen?: number
  hasAllianceEmperor?: boolean
  hasAllianceSpacingGuild?: boolean
  hasAllianceBeneGesserit?: boolean
  hasAllianceFremen?: boolean

  finalConflictStrength?: number
  finalConflictPlace?: number
  finalConflictGarrisonTroops?: number
  finalConflictGarrisonCommanders?: number
  finalConflictDeployedTroops?: number
  finalConflictDeployedCommanders?: number
  finalConflictDeployedSandworms?: number
  finalConflictStrengthSourcesCommanderSkills?: number
  finalConflictStrengthSourcesIntrigue?: number
  finalConflictStrengthSourcesImperium?: number
  finalConflictStrengthSourcesTech?: number
  finalConflictStrengthSourcesUnaccounted?: number

  cardsTrashedCount?: number
  finalDeckSize?: number
  intrigueCardsPlayed?: number
  intrigueCardsHeldEndgame?: number
  conflictCardsWonCount?: number
  objectiveCard?: string

  contractsCompletedCount?: number
  contractsHeldIncomplete?: number
  techTilesCount?: number
  controlMarkerCount?: number
  commanderSkillsCount?: number
  spiesOnBoardEndgame?: number
  hasHighCouncil?: boolean
  highCouncilSeatPosition?: number
  hasSwordmaster?: boolean
  hasMakerHooks?: boolean

  notes?: string
}

interface EnhancedAddPlaythroughFormProps {
  game: any
  players: any[]
  onSubmit: (results: PlayerResult[], date?: string, roundCount?: number) => void | Promise<void>
  onCancel: () => void
}

const factionIcons: Record<string, string> = {

  "House Atreides": "🦅",
  "House Harkonnen": "⚔️",
  "House Corrino": "👑",
  "House Richese": "💡",
  "House Thorvald": "❄️",
  "House Vernius": "🦾",
  "House Ecaz": "🌺",
  "House Moritani": "🦂",
  "House Metulli": "💎",
  "House Fenring": "🎭",
  "Bene Gesserit": "🔮",
  Fremen: "🏜️",
  "Spacing Guild": "🚀",
  Smugglers: "💰",
  Ixian: "⚙️",
}

type PlayerResultField = keyof PlayerResult

const numberFields: PlayerResultField[] = [
  "score",
  "turnOrderPosition",
  "vpSourcesBase",
  "vpSourcesConflictCards",
  "vpSourcesFinalConflict",
  "vpSourcesBattleIconMatches",
  "vpSourcesSpiceMustFlow",
  "vpSourcesIntrigueCards",
  "vpSourcesTechTiles",
  "vpSourcesImperiumCards",
  "vpSourcesLeaderAbilities",
  "vpSourcesFactions",
  "vpSourcesUnaccounted",
  "endgameSpiceCount",
  "endgameSolariCount",
  "endgameWaterCount",
  "influenceEmperor",
  "influenceSpacingGuild",
  "influenceBeneGesserit",
  "influenceFremen",
  "finalConflictStrength",
  "finalConflictPlace",
  "finalConflictGarrisonTroops",
  "finalConflictGarrisonCommanders",
  "finalConflictDeployedTroops",
  "finalConflictDeployedCommanders",
  "finalConflictDeployedSandworms",
  "finalConflictStrengthSourcesCommanderSkills",
  "finalConflictStrengthSourcesIntrigue",
  "finalConflictStrengthSourcesImperium",
  "finalConflictStrengthSourcesTech",
  "finalConflictStrengthSourcesUnaccounted",
  "cardsTrashedCount",
  "finalDeckSize",
  "intrigueCardsPlayed",
  "intrigueCardsHeldEndgame",
  "conflictCardsWonCount",
  "contractsCompletedCount",
  "contractsHeldIncomplete",
  "techTilesCount",
  "controlMarkerCount",
  "commanderSkillsCount",
  "spiesOnBoardEndgame",
  "highCouncilSeatPosition",
]

const boolFields: PlayerResultField[] = [
  "hasAllianceEmperor",
  "hasAllianceSpacingGuild",
  "hasAllianceBeneGesserit",
  "hasAllianceFremen",
  "hasHighCouncil",
  "hasSwordmaster",
  "hasMakerHooks",
]

function hasAdvancedData(result: PlayerResult) {
  const advancedFields: PlayerResultField[] = [
    ...numberFields,
    ...boolFields,
    "strategicArchetypeId",
    "objectiveCard",
    "notes",
  ]

  return advancedFields.some((field) => {
    const value = result[field]
    return value !== undefined && value !== null && value !== ""
  })
}

function parseNumberInput(value: string): number | undefined {
  if (value.trim() === "") return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normaliseSelectId(value: string): string | undefined {
  return value === "none" ? undefined : value
}

const OBJECTIVE_OPTIONS = [
  { value: "crysknife", label: "Crysknife" },
  { value: "desert_mouse", label: "Desert Mouse" },
  { value: "ornithopter", label: "Ornithopter" },
  { value: "wild", label: "Wild" },
]

type FactionKey = "emperor" | "spacingGuild" | "beneGesserit" | "fremen"

const FACTIONS: Array<{
  key: FactionKey
  influenceField: string
  allianceField: string
}> = [
  { key: "emperor", influenceField: "influenceEmperor", allianceField: "hasAllianceEmperor" },
  { key: "spacingGuild", influenceField: "influenceSpacingGuild", allianceField: "hasAllianceSpacingGuild" },
  { key: "beneGesserit", influenceField: "influenceBeneGesserit", allianceField: "hasAllianceBeneGesserit" },
  { key: "fremen", influenceField: "influenceFremen", allianceField: "hasAllianceFremen" },
]

function getFactionForInfluenceField(field: string): FactionKey | undefined {
  return FACTIONS.find((faction) => faction.influenceField === field)?.key
}

function getFactionConfig(key: FactionKey) {
  return FACTIONS.find((faction) => faction.key === key)!
}


function numericValue(value: number | undefined | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function vpFromInfluence(value: number | undefined): number {
  return typeof value === "number" && value >= 2 ? 1 : 0
}

function vpFromAlliance(value: boolean | undefined): number {
  return value === true ? 1 : 0
}

function calculateFactionVp(result: Record<string, any>): number {
  return (
    vpFromInfluence(result.influenceEmperor) +
    vpFromInfluence(result.influenceSpacingGuild) +
    vpFromInfluence(result.influenceBeneGesserit) +
    vpFromInfluence(result.influenceFremen) +
    vpFromAlliance(result.hasAllianceEmperor) +
    vpFromAlliance(result.hasAllianceSpacingGuild) +
    vpFromAlliance(result.hasAllianceBeneGesserit) +
    vpFromAlliance(result.hasAllianceFremen)
  )
}

function enforceFinalConflictWithinTotal<T extends Record<string, any>>(result: T): T {
  const finalVp = result.vpSourcesFinalConflict

  // A positive final-conflict VP is a lower bound on total Conflict VP.
  // A zero final-conflict VP means “no VP from the final conflict”, not
  // “no VP from earlier conflicts”, so it must not erase total Conflict VP.
  if (typeof finalVp !== "number" || !Number.isFinite(finalVp) || finalVp <= 0) return result

  const totalVp = result.vpSourcesConflictCards
  if (typeof totalVp === "number" && Number.isFinite(totalVp) && totalVp >= finalVp) return result

  return { ...result, vpSourcesConflictCards: finalVp }
}

function wasConflictVpDerivedFromFinalConflict(result: Record<string, any>): boolean {
  const finalVp = result.vpSourcesFinalConflict
  const conflictVp = result.vpSourcesConflictCards

  return (
    typeof finalVp === "number" &&
    Number.isFinite(finalVp) &&
    finalVp > 0 &&
    typeof conflictVp === "number" &&
    Number.isFinite(conflictVp) &&
    conflictVp === finalVp
  )
}

function syncConflictVpForFinalConflictChange<T extends Record<string, any>>(previous: T, updated: T): T {
  const nextFinalVp = updated.vpSourcesFinalConflict
  const previousConflictVp = previous.vpSourcesConflictCards
  const conflictWasDerived = wasConflictVpDerivedFromFinalConflict(previous)

  if (typeof nextFinalVp === "number" && Number.isFinite(nextFinalVp) && nextFinalVp > 0) {
    if (
      conflictWasDerived ||
      typeof previousConflictVp !== "number" ||
      !Number.isFinite(previousConflictVp) ||
      previousConflictVp < nextFinalVp
    ) {
      return { ...updated, vpSourcesConflictCards: nextFinalVp }
    }

    return updated
  }

  if (conflictWasDerived) {
    return { ...updated, vpSourcesConflictCards: undefined }
  }

  return updated
}

function calculateKnownVp(result: Record<string, any>): number {
  return (
    numericValue(result.vpSourcesBase) +
    calculateFactionVp(result) +
    numericValue(result.vpSourcesConflictCards) +
    numericValue(result.vpSourcesBattleIconMatches) +
    numericValue(result.vpSourcesSpiceMustFlow) +
    numericValue(result.vpSourcesIntrigueCards) +
    numericValue(result.vpSourcesTechTiles) +
    numericValue(result.vpSourcesImperiumCards) +
    numericValue(result.vpSourcesLeaderAbilities)
  )
}

function calculateFinalConflictKnownStrength(result: Record<string, any>): number {
  return (
    numericValue(result.finalConflictDeployedTroops) * 2 +
    numericValue(result.finalConflictDeployedCommanders) * 2 +
    numericValue(result.finalConflictDeployedSandworms) * 3 +
    numericValue(result.finalConflictStrengthSourcesCommanderSkills) +
    numericValue(result.finalConflictStrengthSourcesIntrigue) +
    numericValue(result.finalConflictStrengthSourcesImperium) +
    numericValue(result.finalConflictStrengthSourcesTech)
  )
}

function calculateConflictPlace(results: Array<Record<string, any>>, resultIndex: number): number | undefined {
  const strength = results[resultIndex]?.finalConflictStrength
  if (typeof strength !== "number" || !Number.isFinite(strength)) return undefined

  const strongerPlayers = results.filter((result) => {
    const otherStrength = result.finalConflictStrength
    return typeof otherStrength === "number" && Number.isFinite(otherStrength) && otherStrength > strength
  }).length

  return strongerPlayers + 1
}


function isBlankValue(value: unknown): boolean {
  return value === undefined || value === null || value === ""
}

function isZero(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value === 0
}

function getLeaderLabel(result: Record<string, any>): string {
  return String(result.leaderName ?? result.leader_name ?? result.leader ?? "")
}

function isSteersmanLeader(result: Record<string, any>): boolean {
  return /steersman|yr['’]?koon/i.test(getLeaderLabel(result))
}

function displayMetric(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—"
  return String(value)
}

function getNumericLockReason(result: Record<string, any>, field: string): string | undefined {
  if ((field === "vpSourcesTechTiles" || field === "finalConflictStrengthSourcesTech") && isZero(result.techTilesCount)) {
    return "locked by Tech tiles = 0"
  }

  if (field === "finalConflictStrengthSourcesCommanderSkills" && isZero(result.commanderSkillsCount)) {
    return "locked by Cmdr Skills = 0"
  }

  if (field === "vpSourcesIntrigueCards" && isZero(result.intrigueCardsPlayed) && isZero(result.intrigueCardsHeldEndgame)) {
    return "locked by Intrigues played/held = 0"
  }

  if (field === "vpSourcesLeaderAbilities" && !isSteersmanLeader(result)) {
    return "locked for this leader"
  }

  return undefined
}

function applyCountImpliedZeroes<T extends Record<string, any>>(result: T): T {
  const next = { ...result }

  if (isZero(next.techTilesCount)) {
    if (isBlankValue((next as Record<string, any>).vpSourcesTechTiles)) (next as Record<string, any>).vpSourcesTechTiles = 0
    if (isBlankValue((next as Record<string, any>).finalConflictStrengthSourcesTech)) (next as Record<string, any>).finalConflictStrengthSourcesTech = 0
  }

  if (isZero(next.commanderSkillsCount)) {
    if (isBlankValue((next as Record<string, any>).finalConflictStrengthSourcesCommanderSkills)) {
      (next as Record<string, any>).finalConflictStrengthSourcesCommanderSkills = 0
    }
  }

  if (isZero(next.intrigueCardsPlayed) && isZero(next.intrigueCardsHeldEndgame)) {
    if (isBlankValue((next as Record<string, any>).vpSourcesIntrigueCards)) (next as Record<string, any>).vpSourcesIntrigueCards = 0
  }

  if (!isSteersmanLeader(next) && isBlankValue((next as Record<string, any>).vpSourcesLeaderAbilities)) {
    (next as Record<string, any>).vpSourcesLeaderAbilities = 0
  }

  return next as T
}

function zeroBlankStrengthSourcesWhenBalanced<T extends Record<string, any>>(result: T, unaccounted: number | undefined): T {
  if (typeof unaccounted !== "number" || Math.abs(unaccounted) >= 0.1) return result

  const sourceFields: Array<keyof T> = [
    "finalConflictStrengthSourcesCommanderSkills" as keyof T,
    "finalConflictStrengthSourcesIntrigue" as keyof T,
    "finalConflictStrengthSourcesImperium" as keyof T,
    "finalConflictStrengthSourcesTech" as keyof T,
  ]

  const next = { ...result }
  for (const field of sourceFields) {
    if (isBlankValue(next[field])) next[field] = 0 as T[keyof T]
  }
  return next
}

function calculateUnaccountedStrength(result: Record<string, any>): number | undefined {
  return typeof result.finalConflictStrength === "number" && Number.isFinite(result.finalConflictStrength)
    ? result.finalConflictStrength - calculateFinalConflictKnownStrength(result)
    : undefined
}

function calculateUnaccountedVp(result: Record<string, any>): number | undefined {
  return typeof result.score === "number" && Number.isFinite(result.score)
    ? result.score - calculateKnownVp(result)
    : undefined
}

function applyAutoAllianceForFaction<T extends Record<string, any>>(results: T[], factionKey: FactionKey): T[] {
  const faction = getFactionConfig(factionKey)
  const influenceField = faction.influenceField as keyof T
  const allianceField = faction.allianceField as keyof T

  const maxInfluence = Math.max(
    -Infinity,
    ...results.map((result) => {
      const influence = result[influenceField]
      return typeof influence === "number" && Number.isFinite(influence) ? influence : -Infinity
    }),
  )

  const winners = maxInfluence >= 4
    ? results
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => result[influenceField] === maxInfluence)
        .map(({ index }) => index)
    : []

  return results.map((result, index) => {
    let nextAlliance: boolean | undefined

    if (winners.length === 0) nextAlliance = false
    else if (winners.length === 1) nextAlliance = index === winners[0]
    else nextAlliance = winners.includes(index) ? undefined : false

    return { ...result, [allianceField]: nextAlliance }
  })
}

function applyFinalConflictVpLogic<T extends Record<string, any>>(results: T[]): T[] {
  const maxStrength = Math.max(
    -Infinity,
    ...results.map((result) => {
      const strength = result.finalConflictStrength
      return typeof strength === "number" && Number.isFinite(strength) ? strength : -Infinity
    }),
  )

  if (!Number.isFinite(maxStrength) || maxStrength <= 0) return results

  return results.map((result) => {
    const strength = result.finalConflictStrength
    if (typeof strength !== "number" || !Number.isFinite(strength)) return result

    if (strength < maxStrength && result.vpSourcesFinalConflict !== 0) {
      const adjusted = { ...result, vpSourcesFinalConflict: 0 }
      return enforceFinalConflictWithinTotal(
        wasConflictVpDerivedFromFinalConflict(result)
          ? { ...adjusted, vpSourcesConflictCards: undefined }
          : adjusted,
      )
    }

    if (strength === maxStrength && result.vpSourcesFinalConflict === 0) {
      return enforceFinalConflictWithinTotal({ ...result, vpSourcesFinalConflict: undefined })
    }

    return enforceFinalConflictWithinTotal(result)
  })
}

function zeroBlankVpSourcesWhenBalanced<T extends Record<string, any>>(result: T, unaccounted: number | undefined): T {
  if (typeof unaccounted !== "number" || Math.abs(unaccounted) >= 0.1) return result

  const sourceFields: Array<keyof T> = [
    "vpSourcesConflictCards" as keyof T,
    "vpSourcesBattleIconMatches" as keyof T,
    "vpSourcesSpiceMustFlow" as keyof T,
    "vpSourcesIntrigueCards" as keyof T,
    "vpSourcesTechTiles" as keyof T,
    "vpSourcesImperiumCards" as keyof T,
    "vpSourcesLeaderAbilities" as keyof T,
  ]

  const next = { ...result }
  for (const field of sourceFields) {
    if (next[field] === undefined || next[field] === null || next[field] === "") {
      next[field] = 0 as T[keyof T]
    }
  }
  return next
}

function withDerivedStats<T extends Record<string, any>>(result: T, allResults: T[], resultIndex: number): T {
  const countAdjusted = applyCountImpliedZeroes(result)
  const conflictAdjusted = enforceFinalConflictWithinTotal(countAdjusted)
  const vpSourcesFactions = calculateFactionVp(conflictAdjusted)
  const finalConflictPlace = calculateConflictPlace(allResults, resultIndex)

  const resultForKnownVp = { ...conflictAdjusted, vpSourcesFactions }
  const preliminaryVpUnaccounted = calculateUnaccountedVp(resultForKnownVp)
  const preliminaryStrengthUnaccounted = calculateUnaccountedStrength(resultForKnownVp)

  let zeroedIfBalanced = zeroBlankVpSourcesWhenBalanced(resultForKnownVp, preliminaryVpUnaccounted)
  zeroedIfBalanced = zeroBlankStrengthSourcesWhenBalanced(zeroedIfBalanced, preliminaryStrengthUnaccounted)

  const finalConflictStrengthSourcesUnaccounted = calculateUnaccountedStrength(zeroedIfBalanced)
  const vpSourcesUnaccounted = calculateUnaccountedVp({ ...zeroedIfBalanced, vpSourcesFactions })

  return {
    ...zeroedIfBalanced,
    vpSourcesFactions,
    vpSourcesUnaccounted,
    finalConflictPlace,
    finalConflictStrengthSourcesUnaccounted,
  }
}

function deriveResultSet<T extends Record<string, any>>(
  results: T[],
  options: { changedInfluenceFaction?: FactionKey; defaultBaseVp?: number } = {},
): T[] {
  let next = results.map((result) => {
    const withBase =
      result.vpSourcesBase === undefined && options.defaultBaseVp !== undefined
        ? { ...result, vpSourcesBase: options.defaultBaseVp }
        : result
    return withBase as T
  })

  if (options.changedInfluenceFaction) {
    next = applyAutoAllianceForFaction(next, options.changedInfluenceFaction)
  }

  next = applyFinalConflictVpLogic(next)
  return next.map((result, index) => withDerivedStats(result, next, index))
}

function StatSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-amber-600" />
        <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
      </div>
      {children}
    </div>
  )
}

function StatSubsection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`self-start h-fit min-h-0 rounded-lg border bg-white/70 p-3 ${className ?? ""}`}>
      <h6 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h6>
      {children}
    </div>
  )
}

function SummaryChips({ items }: { items: Array<{ label: string; value: unknown; tone?: "default" | "good" | "warn" }> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2.5 rounded-xl border bg-white/80 p-3 text-sm text-slate-700">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3.5 py-1.5 ${
            item.tone === "good"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : item.tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <span className="text-slate-500">{item.label}</span>
          <strong className="font-bold tabular-nums">{displayMetric(item.value)}</strong>
        </span>
      ))}
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
  lockedReason,
}: {
  id: string
  label: string
  value?: number
  placeholder?: string
  onChange: (value: number | undefined) => void
  disabled?: boolean
  lockedReason?: string
}) {
  const isLocked = Boolean(lockedReason)

  return (
    <div className="grid gap-1.5" title={lockedReason}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs font-medium text-slate-700">
          {label}
        </Label>
        {isLocked && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Locked</span>}
      </div>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(parseNumberInput(event.target.value))}
        placeholder={placeholder}
        disabled={disabled || isLocked}
        className={`h-8 text-sm tabular-nums ${isLocked ? "bg-slate-100 text-slate-500" : ""}`}
      />
    </div>
  )
}

function NumberStepperField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
  min = 0,
}: {
  id: string
  label: string
  value?: number
  placeholder?: string
  onChange: (value: number | undefined) => void
  disabled?: boolean
  min?: number
}) {
  const step = (delta: number) => {
    const base = typeof value === "number" && Number.isFinite(value) ? value : delta > 0 ? min : min + 1
    const next = Math.max(min, base + delta)
    onChange(next)
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
      </Label>
      <div className="inline-flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-amber-500/25">
        <button
          type="button"
          className="flex w-9 items-center justify-center border-r border-slate-200 text-base font-semibold text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => step(-1)}
          disabled={disabled}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(event) => onChange(parseNumberInput(event.target.value))}
          placeholder={placeholder ?? "Unset"}
          disabled={disabled}
          className="h-9 min-w-0 flex-1 rounded-none border-0 bg-transparent text-center text-sm font-medium tabular-nums shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className="flex w-9 items-center justify-center border-l border-slate-200 text-base font-semibold text-slate-500 transition hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => step(1)}
          disabled={disabled}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function ObjectiveSelect({
  value,
  onChange,
  disabled,
}: {
  value?: string
  onChange: (value: string | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-slate-700">Objective</Label>
      <Select value={value || "none"} onValueChange={(next) => onChange(next === "none" ? undefined : next)} disabled={disabled}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select objective" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not set</SelectItem>
          {OBJECTIVE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value?: string
  placeholder?: string
  onChange: (value: string | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value.trim() === "" ? undefined : event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9"
      />
    </div>
  )
}

function BooleanSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value?: boolean
  onChange: (value: boolean | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <Select
        value={value === true ? "yes" : value === false ? "no" : "unknown"}
        onValueChange={(next) => onChange(next === "unknown" ? undefined : next === "yes")}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unknown">Unknown</SelectItem>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function CouncilSeatSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value?: number
  onChange: (value: number | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <Select
        value={typeof value === "number" ? String(value) : "unknown"}
        onValueChange={(next) => onChange(next === "unknown" ? undefined : Number(next))}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unknown">Unknown</SelectItem>
          <SelectItem value="1">1st</SelectItem>
          <SelectItem value="2">2nd</SelectItem>
          <SelectItem value="3">3rd</SelectItem>
          <SelectItem value="4">4th</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

}

export const EnhancedAddPlaythroughForm = ({ game, players, onSubmit, onCancel }: EnhancedAddPlaythroughFormProps) => {
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [results, setResults] = useState<PlayerResult[]>([{ playerName: "", rank: 1 }])
  const [gameDate, setGameDate] = useState<string>(getTodayDate())
  const [roundCount, setRoundCount] = useState<number | undefined>(undefined)
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [archetypes, setArchetypes] = useState<StrategicArchetype[]>([])
  const [loading, setLoading] = useState(false)
  const [leadersLoading, setLeadersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState<Record<string, boolean>>({})
  const [expandedPlayerIndex, setExpandedPlayerIndex] = useState<number | null>(0)
  const [advancedEditorIndex, setAdvancedEditorIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const timestamp = Date.now()
        const [leadersRes, archetypesRes] = await Promise.all([
          fetch(`/api/leaders?t=${timestamp}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
          fetch("/api/strategic-archetypes"),
        ])

        if (leadersRes.ok) {
          const leadersData = await leadersRes.json()
          setLeaders(leadersData.data || [])
        }

        if (archetypesRes.ok) {
          const archetypesData = await archetypesRes.json()
          setArchetypes(archetypesData.data || [])
        }
      } catch (error) {
        console.error("Failed to load leaders/archetypes:", error)
      } finally {
        setLeadersLoading(false)
      }
    }

    loadData()
  }, [])

  const leadersByFaction = useMemo(() => {
    return leaders.reduce<Record<string, Leader[]>>((acc, leader) => {
      const faction = leader.faction || "Other"
      if (!acc[faction]) acc[faction] = []
      acc[faction].push(leader)
      return acc
    }, {})
  }, [leaders])

  const updatePlayer = <K extends keyof PlayerResult>(index: number, field: K, value: PlayerResult[K]) => {
    setResults((current) => {
      const next = [...current]
      const previous = next[index]
      let updated = { ...previous, [field]: value }


      if (field === "highCouncilSeatPosition" && typeof value === "number") {
        updated.hasHighCouncil = true
      }

      if (field === "hasHighCouncil" && value === false) {
        updated.highCouncilSeatPosition = undefined
      }

      if (field === "vpSourcesFinalConflict") {
        updated = syncConflictVpForFinalConflictChange(previous, updated)
      }

      next[index] = updated

      return deriveResultSet(next, {
        changedInfluenceFaction: getFactionForInfluenceField(String(field)),
        defaultBaseVp: next.length === 4 ? 1 : 0,
      })
    })
  }

  const updateLeader = (index: number, leaderId: string | undefined) => {
    setResults((current) => {
      const next = [...current]
      const leader = leaderId ? leaders.find((candidate) => candidate.id === leaderId) : undefined
      next[index] = {
        ...next[index],
        leaderId,
        leaderName: leader?.name,
      }

      return deriveResultSet(next, { defaultBaseVp: next.length === 4 ? 1 : 0 })
    })
  }

  const selectExistingPlayer = (index: number, player: any) => {
    updatePlayer(index, "playerName", player.name)
    setShowPlayerSuggestions((prev) => ({ ...prev, [`player-${index}`]: false }))
  }

  const getFilteredPlayerSuggestions = (currentName: string) => {
    if (!currentName.trim()) return players
    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(currentName.toLowerCase()) &&
        !results.some((result) => result.playerName.toLowerCase() === player.name.toLowerCase()),
    )
  }

  const addPlayer = () => {
    setResults((current) => {
      const next = [...current, { playerName: "", rank: current.length + 1 }]
      setExpandedPlayerIndex(next.length - 1)
      return deriveResultSet(next, { defaultBaseVp: next.length === 4 ? 1 : 0 })
    })
  }

  const removePlayer = (index: number) => {
    setResults((current) => {
      const next = current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((result, currentIndex) => ({ ...result, rank: currentIndex + 1 }))
      setExpandedPlayerIndex((currentExpanded) => {
        if (next.length === 0) return null
        if (currentExpanded === null) return 0
        if (currentExpanded === index) return Math.min(index, next.length - 1)
        if (currentExpanded > index) return currentExpanded - 1
        return currentExpanded
      })
      return deriveResultSet(next, { defaultBaseVp: next.length === 4 ? 1 : 0 })
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (results.some((result) => !result.playerName.trim())) {
      alert("Please fill in all player names")
      return
    }

    setLoading(true)
    try {
      const derivedResults = deriveResultSet(results, { defaultBaseVp: results.length === 4 ? 1 : 0 })
      const resultsWithPlayerIds = derivedResults.map((result, index) => {
        const existingPlayer = players.find((player) => player.name.toLowerCase() === result.playerName.trim().toLowerCase())
        const derivedResult = withDerivedStats(result, derivedResults, index)

        return {
          ...derivedResult,
          rank: index + 1,
          playerId: existingPlayer?.id || result.playerName.trim(),
          playerName: result.playerName.trim(),
        }
      })

      await onSubmit(resultsWithPlayerIds, gameDate, roundCount)
      setResults([{ playerName: "", rank: 1 }])
      setGameDate(getTodayDate())
      setRoundCount(undefined)
      setActiveTab("basic")
      setExpandedPlayerIndex(0)
    } catch (error) {
      console.error("Failed to submit playthrough:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderLeaderSelect = (result: PlayerResult, index: number) => {
    if (leadersLoading) {
      return (
        <div className="flex h-10 items-center justify-center">
          <Spinner size="sm" />
        </div>
      )
    }

    return (
      <Select value={result.leaderId || "none"} onValueChange={(value) => updateLeader(index, normaliseSelectId(value))}>
        <SelectTrigger>
          <SelectValue placeholder="Select leader" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No leader</SelectItem>
          {Object.entries(leadersByFaction).map(([faction, factionLeaders]) => (
            <div key={faction}>
              <div className="flex items-center px-2 py-1 text-sm font-semibold text-muted-foreground">
                <span className="mr-2">{factionIcons[faction] || "•"}</span>
                {faction}
              </div>
              {factionLeaders.map((leader) => (
                <SelectItem key={leader.id} value={leader.id}>
                  {leader.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const renderNumber = (index: number, result: PlayerResult, field: PlayerResultField, label: string, placeholder?: string) => (
    <NumberField
      id={`${String(field)}-${index}`}
      label={label}
      value={result[field] as number | undefined}
      placeholder={placeholder}
      onChange={(value) => updatePlayer(index, field, value as any)}
      disabled={loading}
      lockedReason={getNumericLockReason(result, String(field))}
    />
  )

  const renderBoolean = (index: number, result: PlayerResult, field: PlayerResultField, label: string) => (
    <BooleanSelect label={label} value={result[field] as boolean | undefined} onChange={(value) => updatePlayer(index, field, value as any)} disabled={loading} />
  )

  const renderAdvancedPlayer = (result: PlayerResult, index: number) => (
    <div key={index} className="rounded-2xl border bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {result.rank}
          </div>
          <div>
            <h4 className="font-semibold text-slate-950">{result.playerName || `Player ${index + 1}`}</h4>
          </div>
        </div>
        {hasAdvancedData(result) && <Badge variant="secondary">Has data</Badge>}
      </div>

      <div className="grid gap-4">
        <StatSection title="Outcome" icon={Trophy}>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField id={`score-${index}`} label="Final VP" value={result.score} placeholder="e.g. 10" onChange={(value) => updatePlayer(index, "score", value)} disabled={loading} />
            <NumberField id={`turn-order-${index}`} label="Turn order" value={result.turnOrderPosition} placeholder="1–4" onChange={(value) => updatePlayer(index, "turnOrderPosition", value)} disabled={loading} />
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-slate-700">Strategic archetype</Label>
              <Select value={result.strategicArchetypeId || "none"} onValueChange={(value) => updatePlayer(index, "strategicArchetypeId", normaliseSelectId(value))} disabled={loading}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No strategy</SelectItem>
                  {archetypes.map((archetype) => (
                    <SelectItem key={archetype.id} value={archetype.id}>
                      {archetype.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </StatSection>

        <StatSection title="Scoring breakdown" icon={Flag}>
          <div className="grid gap-3 sm:grid-cols-3">
            {renderNumber(index, result, "vpSourcesBase", "Base VP", "Usually 1")}
            <NumberStepperField id={`vp-conflict-${index}`} label="Conflict VP" value={result.vpSourcesConflictCards} onChange={(value) => updatePlayer(index, "vpSourcesConflictCards", value)} disabled={loading} />
            {renderNumber(index, result, "vpSourcesBattleIconMatches", "Battle icon VP")}
            {renderNumber(index, result, "vpSourcesSpiceMustFlow", "Spice Must Flow VP")}
            {renderNumber(index, result, "vpSourcesIntrigueCards", "Intrigue VP")}
            {renderNumber(index, result, "vpSourcesTechTiles", "Tech tile VP")}
            {renderNumber(index, result, "vpSourcesImperiumCards", "Imperium card VP")}
            {renderNumber(index, result, "vpSourcesLeaderAbilities", "Leader ability VP")}
          </div>
          <SummaryChips
            items={[
              { label: "Faction VP", value: calculateFactionVp(result) },
              { label: "Known VP", value: calculateKnownVp(result) },
              { label: "Unaccounted", value: typeof result.score === "number" ? result.score - calculateKnownVp(result) : undefined, tone: typeof result.score === "number" && result.score - calculateKnownVp(result) === 0 ? "good" : "warn" },
            ]}
          />
        </StatSection>

        <StatSection title="Economy" icon={Gem}>
          <div className="grid gap-3 sm:grid-cols-3">
            {renderNumber(index, result, "endgameSpiceCount", "Spice", "Final spice")}
            {renderNumber(index, result, "endgameSolariCount", "Solari", "Final solari")}
            {renderNumber(index, result, "endgameWaterCount", "Water", "Final water")}
          </div>
        </StatSection>

        <StatSection title="Influence and alliances" icon={Landmark}>
          <div className="grid gap-3 lg:grid-cols-4">
            <StatSubsection title="Emperor">
              <div className="grid gap-3">
                {renderNumber(index, result, "influenceEmperor", "Influence")}
                {renderBoolean(index, result, "hasAllianceEmperor", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Guild">
              <div className="grid gap-3">
                {renderNumber(index, result, "influenceSpacingGuild", "Influence")}
                {renderBoolean(index, result, "hasAllianceSpacingGuild", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Bene Gesserit">
              <div className="grid gap-3">
                {renderNumber(index, result, "influenceBeneGesserit", "Influence")}
                {renderBoolean(index, result, "hasAllianceBeneGesserit", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Fremen">
              <div className="grid gap-3">
                {renderNumber(index, result, "influenceFremen", "Influence")}
                {renderBoolean(index, result, "hasAllianceFremen", "Alliance")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Final conflict" icon={Swords}>
          <div className="grid gap-3">
            <StatSubsection title="Combat result">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,1.25fr)]">
                {renderNumber(index, result, "finalConflictStrength", "Final strength")}
                <NumberField id={`final-conflict-place-${index}`} label="Place" value={calculateConflictPlace(results, index)} onChange={() => {}} disabled lockedReason="derived from final strengths" />
                <NumberStepperField id={`vp-final-conflict-${index}`} label="Final Conflict VP" value={result.vpSourcesFinalConflict} onChange={(value) => updatePlayer(index, "vpSourcesFinalConflict", value)} disabled={loading} />
              </div>
              <SummaryChips
                items={[
                  { label: "Known strength", value: calculateFinalConflictKnownStrength(result) },
                  { label: "Unaccounted", value: typeof result.finalConflictStrength === "number" ? result.finalConflictStrength - calculateFinalConflictKnownStrength(result) : undefined, tone: typeof result.finalConflictStrength === "number" && result.finalConflictStrength - calculateFinalConflictKnownStrength(result) === 0 ? "good" : "warn" },
                ]}
              />
            </StatSubsection>
              <StatSubsection title="Deployed units">
                <div className="grid gap-3 sm:grid-cols-3">
                  {renderNumber(index, result, "finalConflictDeployedTroops", "Troops")}
                  {renderNumber(index, result, "finalConflictDeployedCommanders", "Commanders")}
                  {renderNumber(index, result, "finalConflictDeployedSandworms", "Sandworms")}
                </div>
              </StatSubsection>
            <StatSubsection title="Garrison">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, result, "finalConflictGarrisonTroops", "Troops")}
                {renderNumber(index, result, "finalConflictGarrisonCommanders", "Commanders")}
              </div>
            </StatSubsection>
              <StatSubsection title="Bonuses">
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderNumber(index, result, "finalConflictStrengthSourcesCommanderSkills", "Cmdr Skills")}
                  {renderNumber(index, result, "finalConflictStrengthSourcesIntrigue", "Intrigue")}
                  {renderNumber(index, result, "finalConflictStrengthSourcesImperium", "Imperium")}
                  {renderNumber(index, result, "finalConflictStrengthSourcesTech", "Tech Tiles")}
                </div>
              </StatSubsection>
            <div className="grid auto-rows-min items-start gap-3 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            </div>
          </div>
        </StatSection>

        <StatSection title="Board state and assets" icon={Shield}>
          <div className="grid gap-4 lg:grid-cols-2">
            <StatSubsection title="Presence">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, result, "spiesOnBoardEndgame", "Spies")}
                {renderNumber(index, result, "controlMarkerCount", "Control")}
              </div>
            </StatSubsection>
            <StatSubsection title="Board upgrades" className="lg:col-span-2">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {renderBoolean(index, result, "hasHighCouncil", "High Council")}
                <CouncilSeatSelect label="Council seat" value={result.highCouncilSeatPosition} onChange={(value) => updatePlayer(index, "highCouncilSeatPosition", value)} disabled={loading || result.hasHighCouncil === false} />
                {renderBoolean(index, result, "hasSwordmaster", "Swordmaster")}
                {renderBoolean(index, result, "hasMakerHooks", "Maker Hooks")}
              </div>
            </StatSubsection>
            <StatSubsection title="Contracts">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, result, "contractsCompletedCount", "Completed")}
                {renderNumber(index, result, "contractsHeldIncomplete", "Held")}
              </div>
            </StatSubsection>
            <StatSubsection title="Tableau">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, result, "techTilesCount", "Tech Tiles")}
                {renderNumber(index, result, "commanderSkillsCount", "Cmdr Skills")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Cards" icon={ScrollText}>
          <div className="grid gap-3 lg:grid-cols-3">
            <StatSubsection title="Deck composition">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {renderNumber(index, result, "finalDeckSize", "Size")}
                {renderNumber(index, result, "cardsTrashedCount", "Trashed")}
              </div>
            </StatSubsection>
            <StatSubsection title="Special cards">
              <div className="grid gap-3">
                {renderNumber(index, result, "conflictCardsWonCount", "Conflicts won")}
                <ObjectiveSelect value={result.objectiveCard} onChange={(value) => updatePlayer(index, "objectiveCard", value)} disabled={loading} />
              </div>
            </StatSubsection>
            <StatSubsection title="Intrigue">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {renderNumber(index, result, "intrigueCardsPlayed", "Played")}
                {renderNumber(index, result, "intrigueCardsHeldEndgame", "Held")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Notes" icon={NotebookText}>
          <TextField id={`notes-${index}`} label="Player notes" value={result.notes} placeholder="e.g. 1 influence from Panopticon" onChange={(value) => updatePlayer(index, "notes", value)} disabled={loading} />
        </StatSection>
      </div>
    </div>
  )

  return (
    <>
      <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Crown className="mr-2 h-5 w-5 text-amber-500" />
          Add Dune: Imperium Playthrough
        </CardTitle>
        <CardDescription>Record a game with analytics-compatible fields and leader tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="grid gap-1.5">
              <Label htmlFor="game-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Game Date
              </Label>
              <Input id="game-date" type="date" value={gameDate} onChange={(event) => setGameDate(event.target.value)} disabled={loading} className="w-full" required />
            </div>
            <NumberField id="round-count" label="Rounds" value={roundCount} placeholder="e.g. 6" onChange={setRoundCount} disabled={loading} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Advanced Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                {results.map((result, index) => {
                  const suggestions = getFilteredPlayerSuggestions(result.playerName)
                  return (
                    <div key={index} className="flex items-center space-x-4 rounded-lg border p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {result.rank}
                      </div>

                      <div className="relative flex-1">
                        <Label htmlFor={`player-${index}`}>Player Name</Label>
                        <Input
                          id={`player-${index}`}
                          value={result.playerName}
                          onChange={(event) => updatePlayer(index, "playerName", event.target.value)}
                          onFocus={() => setShowPlayerSuggestions((prev) => ({ ...prev, [`player-${index}`]: true }))}
                          onBlur={() => setTimeout(() => setShowPlayerSuggestions((prev) => ({ ...prev, [`player-${index}`]: false })), 200)}
                          placeholder="e.g. Alice"
                          required
                          disabled={loading}
                        />

                        {showPlayerSuggestions[`player-${index}`] && suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full z-10 max-h-32 overflow-y-auto rounded-md border bg-white shadow-lg">
                            {suggestions.slice(0, 5).map((player) => (
                              <button key={player.id} type="button" className="w-full border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50" onMouseDown={() => selectExistingPlayer(index, player)}>
                                <div className="flex items-center justify-between">
                                  <span>{player.name}</span>
                                  <Badge variant="secondary" className="text-xs">Existing</Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <Label htmlFor={`leader-${index}`}>Leader</Label>
                        {renderLeaderSelect(result, index)}
                      </div>

                      {results.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removePlayer(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <Button type="button" variant="outline" onClick={addPlayer} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {result.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-950">{result.playerName || `Player ${index + 1}`}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[result.leaderName, typeof result.score === "number" ? `${result.score} VP` : undefined]
                          .filter(Boolean)
                          .join(" • ") || "No advanced stats yet"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {hasAdvancedData(result) && <Badge variant="secondary">Has data</Badge>}
                    <Button type="button" variant="outline" size="sm" onClick={() => setAdvancedEditorIndex(index)} disabled={loading}>
                      Open full editor
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Recording...
                </>
              ) : (
                "Record Playthrough"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      </Card>
      {advancedEditorIndex !== null && results[advancedEditorIndex] && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:p-6">
          <div className="w-full max-w-6xl rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-900/10">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b bg-white/95 px-4 py-3 backdrop-blur">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-950">
                  Advanced stats — {results[advancedEditorIndex].playerName || `Player ${advancedEditorIndex + 1}`}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdvancedEditorIndex(null)}>
                Close
              </Button>
            </div>
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4 sm:p-5">
              {renderAdvancedPlayer(results[advancedEditorIndex], advancedEditorIndex)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
