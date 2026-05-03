"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronDown, ChevronRight, Edit, Flag, Gem, Landmark, Loader2, NotebookText, PlusCircle, ScrollText, Shield, Swords, Trash2, Trophy, Zap } from "lucide-react"
import type { Player } from "@/types/leaderboard"
import { getOrdinalSuffix } from "@/utils/leaderboard-utils"

interface EditPlaythroughFormProps {
  playthrough: any
  existingPlayers: Player[]
  onSubmit: (results: PlaythroughSubmitResult[], date?: string, roundCount?: number) => Promise<void>
  onCancel: () => void
}

interface PlayerRankInput {
  id: string
  playerName: string
  rank: string
  isNewPlayer: boolean
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


type PlaythroughSubmitResult = Omit<PlayerRankInput, "id" | "isNewPlayer" | "rank"> & {
  playerName: string
  rank: number
}

type PlayerField = keyof PlayerRankInput

const numberFields: PlayerField[] = [
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

const boolFields: PlayerField[] = [
  "hasAllianceEmperor",
  "hasAllianceSpacingGuild",
  "hasAllianceBeneGesserit",
  "hasAllianceFremen",
  "hasHighCouncil",
  "hasSwordmaster",
  "hasMakerHooks",
]


function hasAdvancedData(result: PlayerRankInput) {
  const advancedFields: PlayerField[] = [
    ...numberFields,
    ...boolFields,
    "leaderName",
    "strategicArchetypeId",
    "objectiveCard",
    "notes",
  ]

  return advancedFields.some((field) => {
    const value = result[field]
    return value !== undefined && value !== null && value !== ""
  })
}

function getNumber(result: any, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = result?.[key]
    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }
  }
  return undefined
}

function getText(result: any, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = result?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value)
  }
  return undefined
}

function getBoolean(result: any, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = result?.[key]
    if (value === true || value === false) return value
    if (value === 1 || value === "1" || value === "true") return true
    if (value === 0 || value === "0" || value === "false") return false
  }
  return undefined
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
      <Input id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value.trim() === "" ? undefined : event.target.value)} placeholder={placeholder} disabled={disabled} className="h-8 text-sm" />
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
      <Select value={value === true ? "yes" : value === false ? "no" : "unknown"} onValueChange={(next) => onChange(next === "unknown" ? undefined : next === "yes")} disabled={disabled}>
        <SelectTrigger className="h-8">
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

export const EditPlaythroughForm = ({ playthrough, existingPlayers, onSubmit, onCancel }: EditPlaythroughFormProps) => {
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [playerRanks, setPlayerRanks] = useState<PlayerRankInput[]>([])
  const [gameDate, setGameDate] = useState<string>("")
  const [roundCount, setRoundCount] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [leaders, setLeaders] = useState<any[]>([])
  const [archetypes, setArchetypes] = useState<any[]>([])
  const [leadersLoading, setLeadersLoading] = useState(true)
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null)

  useEffect(() => {
    if (!playthrough?.results) return

    if (playthrough.timestamp) setGameDate(formatDateForInput(playthrough.timestamp))
    setRoundCount(getNumber(playthrough, "roundCount", "round_count") ?? undefined)

    const initialRanks = playthrough.results
      .slice()
      .sort((a: any, b: any) => a.rank - b.rank)
      .map((result: any) => ({
        id: crypto.randomUUID(),
        playerName: result.playerName,
        rank: result.rank.toString(),
        isNewPlayer: !existingPlayers.some((player) => player.name.toLowerCase() === result.playerName.toLowerCase()),
        leaderId: getText(result, "leaderId", "leader_id"),
        leaderName: getText(result, "leaderName", "leader_name", "leader"),
        strategicArchetypeId: getText(result, "strategicArchetypeId", "strategic_archetype_id"),
        score: getNumber(result, "score", "finalVp", "final_vp", "victory_points"),
        turnOrderPosition: getNumber(result, "turnOrderPosition", "turn_order_position", "turnOrder"),
        vpSourcesBase: getNumber(result, "vpSourcesBase", "vp_sources_base"),
        vpSourcesConflictCards: getNumber(result, "vpSourcesConflictCards", "vp_sources_conflict_cards"),
        vpSourcesFinalConflict: getNumber(result, "vpSourcesFinalConflict", "vp_sources_final_conflict"),
        vpSourcesBattleIconMatches: getNumber(result, "vpSourcesBattleIconMatches", "vp_sources_battle_icon_matches"),
        vpSourcesSpiceMustFlow: getNumber(result, "vpSourcesSpiceMustFlow", "vp_sources_spice_must_flow"),
        vpSourcesIntrigueCards: getNumber(result, "vpSourcesIntrigueCards", "vp_sources_intrigue_cards"),
        vpSourcesTechTiles: getNumber(result, "vpSourcesTechTiles", "vp_sources_tech_tiles"),
        vpSourcesImperiumCards: getNumber(result, "vpSourcesImperiumCards", "vp_sources_imperium_cards"),
        vpSourcesLeaderAbilities: getNumber(result, "vpSourcesLeaderAbilities", "vp_sources_leader_abilities"),
        endgameSpiceCount: getNumber(result, "endgameSpiceCount", "endgame_spice_count", "finalResourcesSpice", "spice"),
        endgameSolariCount: getNumber(result, "endgameSolariCount", "endgame_solari_count", "finalResourcesSolari", "solari"),
        endgameWaterCount: getNumber(result, "endgameWaterCount", "endgame_water_count", "finalResourcesWater", "water"),
        influenceEmperor: getNumber(result, "influenceEmperor", "influence_emperor"),
        influenceSpacingGuild: getNumber(result, "influenceSpacingGuild", "influence_spacing_guild"),
        influenceBeneGesserit: getNumber(result, "influenceBeneGesserit", "influence_bene_gesserit"),
        influenceFremen: getNumber(result, "influenceFremen", "influence_fremen"),
        hasAllianceEmperor: getBoolean(result, "hasAllianceEmperor", "has_alliance_emperor"),
        hasAllianceSpacingGuild: getBoolean(result, "hasAllianceSpacingGuild", "has_alliance_spacing_guild"),
        hasAllianceBeneGesserit: getBoolean(result, "hasAllianceBeneGesserit", "has_alliance_bene_gesserit"),
        hasAllianceFremen: getBoolean(result, "hasAllianceFremen", "has_alliance_fremen"),
        finalConflictStrength: getNumber(result, "finalConflictStrength", "final_conflict_strength"),
        finalConflictGarrisonTroops: getNumber(result, "finalConflictGarrisonTroops", "final_conflict_garrison_troops"),
        finalConflictGarrisonCommanders: getNumber(result, "finalConflictGarrisonCommanders", "final_conflict_garrison_commanders"),
        finalConflictDeployedTroops: getNumber(result, "finalConflictDeployedTroops", "final_conflict_deployed_troops"),
        finalConflictDeployedCommanders: getNumber(result, "finalConflictDeployedCommanders", "final_conflict_deployed_commanders"),
        finalConflictDeployedSandworms: getNumber(result, "finalConflictDeployedSandworms", "final_conflict_deployed_sandworms"),
        finalConflictStrengthSourcesCommanderSkills: getNumber(result, "finalConflictStrengthSourcesCommanderSkills", "final_conflict_strength_sources_commander_skills"),
        finalConflictStrengthSourcesIntrigue: getNumber(result, "finalConflictStrengthSourcesIntrigue", "final_conflict_strength_sources_intrigue"),
        finalConflictStrengthSourcesImperium: getNumber(result, "finalConflictStrengthSourcesImperium", "final_conflict_strength_sources_imperium"),
        finalConflictStrengthSourcesTech: getNumber(result, "finalConflictStrengthSourcesTech", "final_conflict_strength_sources_tech"),
        cardsTrashedCount: getNumber(result, "cardsTrashedCount", "cards_trashed_count", "cardsTrashed", "cards_trashed"),
        finalDeckSize: getNumber(result, "finalDeckSize", "final_deck_size", "cards_in_deck"),
        intrigueCardsPlayed: getNumber(result, "intrigueCardsPlayed", "intrigue_cards_played"),
        intrigueCardsHeldEndgame: getNumber(result, "intrigueCardsHeldEndgame", "intrigue_cards_held_endgame"),
        conflictCardsWonCount: getNumber(result, "conflictCardsWonCount", "conflict_cards_won_count"),
        objectiveCard: getText(result, "objectiveCard", "objective_card"),
        contractsCompletedCount: getNumber(result, "contractsCompletedCount", "contracts_completed_count"),
        contractsHeldIncomplete: getNumber(result, "contractsHeldIncomplete", "contracts_held_incomplete"),
        techTilesCount: getNumber(result, "techTilesCount", "tech_tiles_count"),
        controlMarkerCount: getNumber(result, "controlMarkerCount", "control_marker_count"),
        commanderSkillsCount: getNumber(result, "commanderSkillsCount", "commander_skills_count"),
        spiesOnBoardEndgame: getNumber(result, "spiesOnBoardEndgame", "spies_on_board_endgame"),
        hasHighCouncil: getBoolean(result, "hasHighCouncil", "has_high_council"),
        highCouncilSeatPosition: getNumber(result, "highCouncilSeatPosition", "high_council_seat_position"),
        hasSwordmaster: getBoolean(result, "hasSwordmaster", "has_swordmaster"),
        hasMakerHooks: getBoolean(result, "hasMakerHooks", "has_maker_hooks"),
        notes: getText(result, "notes"),
      }))

    const derivedInitialRanks = deriveResultSet(initialRanks, { defaultBaseVp: initialRanks.length === 4 ? 1 : 0 }) as PlayerRankInput[]
    setPlayerRanks(derivedInitialRanks)
    setExpandedPlayerId((current) => current ?? derivedInitialRanks[0]?.id ?? null)
  }, [playthrough, existingPlayers])

  useEffect(() => {
    const loadData = async () => {
      if (playthrough?.game_type !== "dune") {
        setLeadersLoading(false)
        return
      }

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
  }, [playthrough])

  const updateField = <K extends keyof PlayerRankInput>(index: number, field: K, value: PlayerRankInput[K]) => {
    const updatedRanks = [...playerRanks]
    const previous = updatedRanks[index]
    let updated = {
      ...previous,
      [field]: value,
      isNewPlayer:
        field === "playerName"
          ? !existingPlayers.some((player) => player.name.toLowerCase() === String(value).toLowerCase())
          : previous.isNewPlayer,
    }


    if (field === "highCouncilSeatPosition" && typeof value === "number") {
      updated.hasHighCouncil = true
    }

    if (field === "hasHighCouncil" && value === false) {
      updated.highCouncilSeatPosition = undefined
    }

    if (field === "vpSourcesFinalConflict") {
      updated = syncConflictVpForFinalConflictChange(previous, updated) as PlayerRankInput
    }

    updatedRanks[index] = updated

    setPlayerRanks(
      deriveResultSet(updatedRanks, {
        changedInfluenceFaction: getFactionForInfluenceField(String(field)),
        defaultBaseVp: updatedRanks.length === 4 ? 1 : 0,
      }) as PlayerRankInput[],
    )
    setError(null)
  }

  const updateLeader = (index: number, leaderId: string | undefined) => {
    const leader = leaderId ? leaders.find((candidate) => candidate.id === leaderId) : undefined
    const updatedRanks = [...playerRanks]
    updatedRanks[index] = {
      ...updatedRanks[index],
      leaderId,
      leaderName: leader?.name,
    }

    setPlayerRanks(deriveResultSet(updatedRanks, { defaultBaseVp: updatedRanks.length === 4 ? 1 : 0 }) as PlayerRankInput[])
    setError(null)
  }

  const selectExistingPlayer = (index: number, player: Player) => {
    updateField(index, "playerName", player.name)
    setShowPlayerSuggestions((prev) => ({ ...prev, [playerRanks[index].id]: false }))
  }

  const addPlayerField = () => {
    setPlayerRanks([
      ...playerRanks,
      {
        id: crypto.randomUUID(),
        playerName: "",
        rank: String(playerRanks.length + 1),
        isNewPlayer: true,
      },
    ])
  }

  const removePlayerField = (index: number) => {
    if (playerRanks.length <= 1) {
      setError("Must have at least one player.")
      return
    }

    const next = playerRanks
      .filter((_, currentIndex) => currentIndex !== index)
      .map((player, currentIndex) => ({ ...player, rank: String(currentIndex + 1) }))

    setPlayerRanks(deriveResultSet(next, { defaultBaseVp: next.length === 4 ? 1 : 0 }) as PlayerRankInput[])
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitSuccess(false)

    const results: PlayerRankInput[] = []
    const playerNames = new Set<string>()
    const ranks = new Set<number>()

    for (const playerRank of playerRanks) {
      if (!playerRank.playerName.trim()) {
        setError("All player names must be filled.")
        return
      }
      if (playerNames.has(playerRank.playerName.trim().toLowerCase())) {
        setError("Player names must be unique for a single playthrough.")
        return
      }
      playerNames.add(playerRank.playerName.trim().toLowerCase())

      const rank = Number.parseInt(playerRank.rank, 10)
      if (Number.isNaN(rank) || rank < 1) {
        setError(`Invalid rank for ${playerRank.playerName}. Must be a positive number.`)
        return
      }
      if (ranks.has(rank)) {
        setError(`Rank ${getOrdinalSuffix(rank)} is assigned to multiple players. Each rank must be unique.`)
        return
      }
      ranks.add(rank)

      results.push({ ...playerRank, playerName: playerRank.playerName.trim(), rank: String(rank) })
    }

    const sortedRanks = [...ranks].sort((a, b) => a - b)
    for (let index = 0; index < sortedRanks.length; index++) {
      if (sortedRanks[index] !== index + 1) {
        setError("Ranks must be consecutive starting from 1st place.")
        return
      }
    }

    setSubmitting(true)
    try {
      const derivedResults = deriveResultSet(results, { defaultBaseVp: results.length === 4 ? 1 : 0 }) as PlayerRankInput[]

      await onSubmit(
        derivedResults.map((result, index) => {
          const derivedResult = withDerivedStats(result, derivedResults, index)
          return { ...derivedResult, rank: Number.parseInt(result.rank, 10) }
        }),
        gameDate,
        roundCount,
      )
      setSubmitSuccess(true)
    } catch (error) {
      console.error("Error updating playthrough:", error)
      setError(error instanceof Error ? error.message : "Failed to update playthrough")
    } finally {
      setSubmitting(false)
    }
  }

  const renderNumber = (index: number, player: PlayerRankInput, field: PlayerField, label: string, placeholder?: string) => (
    <NumberField
      id={`${String(field)}-${index}`}
      label={label}
      value={player[field] as number | undefined}
      placeholder={placeholder}
      onChange={(value) => updateField(index, field, value as any)}
      disabled={submitting}
      lockedReason={getNumericLockReason(player, String(field))}
    />
  )

  const renderBoolean = (index: number, player: PlayerRankInput, field: PlayerField, label: string) => (
    <BooleanSelect label={label} value={player[field] as boolean | undefined} onChange={(value) => updateField(index, field, value as any)} disabled={submitting} />
  )

  const renderAdvanced = (player: PlayerRankInput, index: number) => {
    return (
      <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Advanced Stats</h4>
          </div>
          {hasAdvancedData(player) && <Badge variant="secondary">Has data</Badge>}
        </div>

        <StatSection title="Outcome" icon={Trophy}>
          <div className="grid gap-3 sm:grid-cols-3">
            {renderNumber(index, player, "score", "Final VP")}
            {renderNumber(index, player, "turnOrderPosition", "Turn order")}
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-slate-700">Strategic archetype</Label>
              <Select value={player.strategicArchetypeId || "none"} onValueChange={(value) => updateField(index, "strategicArchetypeId", normaliseSelectId(value))} disabled={submitting}>
                <SelectTrigger className="h-8">
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
            {renderNumber(index, player, "vpSourcesBase", "Base VP")}
            <NumberStepperField id={`vp-conflict-${index}`} label="Conflict VP" value={player.vpSourcesConflictCards} onChange={(value) => updateField(index, "vpSourcesConflictCards", value as any)} disabled={submitting} />
            {renderNumber(index, player, "vpSourcesBattleIconMatches", "Battle icon VP")}
            {renderNumber(index, player, "vpSourcesSpiceMustFlow", "Spice Must Flow VP")}
            {renderNumber(index, player, "vpSourcesIntrigueCards", "Intrigue VP")}
            {renderNumber(index, player, "vpSourcesTechTiles", "Tech tile VP")}
            {renderNumber(index, player, "vpSourcesImperiumCards", "Imperium card VP")}
            {renderNumber(index, player, "vpSourcesLeaderAbilities", "Leader ability VP")}
          </div>
          <SummaryChips
            items={[
              { label: "Faction VP", value: calculateFactionVp(player) },
              { label: "Known VP", value: calculateKnownVp(player) },
              { label: "Unaccounted", value: typeof player.score === "number" ? player.score - calculateKnownVp(player) : undefined, tone: typeof player.score === "number" && player.score - calculateKnownVp(player) === 0 ? "good" : "warn" },
            ]}
          />
        </StatSection>

        <StatSection title="Economy" icon={Gem}>
          <div className="grid gap-3 sm:grid-cols-3">
            {renderNumber(index, player, "endgameSpiceCount", "Spice")}
            {renderNumber(index, player, "endgameSolariCount", "Solari")}
            {renderNumber(index, player, "endgameWaterCount", "Water")}
          </div>
        </StatSection>

        <StatSection title="Influence and alliances" icon={Landmark}>
          <div className="grid gap-3 lg:grid-cols-4">
            <StatSubsection title="Emperor">
              <div className="grid gap-3">
                {renderNumber(index, player, "influenceEmperor", "Influence")}
                {renderBoolean(index, player, "hasAllianceEmperor", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Guild">
              <div className="grid gap-3">
                {renderNumber(index, player, "influenceSpacingGuild", "Influence")}
                {renderBoolean(index, player, "hasAllianceSpacingGuild", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Bene Gesserit">
              <div className="grid gap-3">
                {renderNumber(index, player, "influenceBeneGesserit", "Influence")}
                {renderBoolean(index, player, "hasAllianceBeneGesserit", "Alliance")}
              </div>
            </StatSubsection>
            <StatSubsection title="Fremen">
              <div className="grid gap-3">
                {renderNumber(index, player, "influenceFremen", "Influence")}
                {renderBoolean(index, player, "hasAllianceFremen", "Alliance")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Final conflict" icon={Swords}>
          <div className="grid gap-3">
            <StatSubsection title="Combat result">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(16rem,1.25fr)]">
                {renderNumber(index, player, "finalConflictStrength", "Final strength")}
                <NumberField id={`final-conflict-place-${index}`} label="Place" value={calculateConflictPlace(playerRanks, index)} onChange={() => {}} disabled lockedReason="derived from final strengths" />
                <NumberStepperField id={`vp-final-conflict-${index}`} label="Final Conflict VP" value={player.vpSourcesFinalConflict} onChange={(value) => updateField(index, "vpSourcesFinalConflict", value as any)} disabled={submitting} />
              </div>
              <SummaryChips
                items={[
                  { label: "Known strength", value: calculateFinalConflictKnownStrength(player) },
                  { label: "Unaccounted", value: typeof player.finalConflictStrength === "number" ? player.finalConflictStrength - calculateFinalConflictKnownStrength(player) : undefined, tone: typeof player.finalConflictStrength === "number" && player.finalConflictStrength - calculateFinalConflictKnownStrength(player) === 0 ? "good" : "warn" },
                ]}
              />
            </StatSubsection>
              <StatSubsection title="Deployed units">
                <div className="grid gap-3 sm:grid-cols-3">
                  {renderNumber(index, player, "finalConflictDeployedTroops", "Troops")}
                  {renderNumber(index, player, "finalConflictDeployedCommanders", "Commanders")}
                  {renderNumber(index, player, "finalConflictDeployedSandworms", "Sandworms")}
                </div>
              </StatSubsection>
            <StatSubsection title="Garrison">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, player, "finalConflictGarrisonTroops", "Troops")}
                {renderNumber(index, player, "finalConflictGarrisonCommanders", "Commanders")}
              </div>
            </StatSubsection>
              <StatSubsection title="Bonuses">
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderNumber(index, player, "finalConflictStrengthSourcesCommanderSkills", "Cmdr Skills")}
                  {renderNumber(index, player, "finalConflictStrengthSourcesIntrigue", "Intrigue")}
                  {renderNumber(index, player, "finalConflictStrengthSourcesImperium", "Imperium")}
                  {renderNumber(index, player, "finalConflictStrengthSourcesTech", "Tech Tiles")}
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
                {renderNumber(index, player, "spiesOnBoardEndgame", "Spies")}
                {renderNumber(index, player, "controlMarkerCount", "Control")}
              </div>
            </StatSubsection>
            <StatSubsection title="Board upgrades" className="lg:col-span-2">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {renderBoolean(index, player, "hasHighCouncil", "High Council")}
                <CouncilSeatSelect label="Council seat" value={player.highCouncilSeatPosition} onChange={(value) => updateField(index, "highCouncilSeatPosition", value as any)} disabled={submitting || player.hasHighCouncil === false} />
                {renderBoolean(index, player, "hasSwordmaster", "Swordmaster")}
                {renderBoolean(index, player, "hasMakerHooks", "Maker Hooks")}
              </div>
            </StatSubsection>
            <StatSubsection title="Contracts">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, player, "contractsCompletedCount", "Completed")}
                {renderNumber(index, player, "contractsHeldIncomplete", "Held")}
              </div>
            </StatSubsection>
            <StatSubsection title="Tableau">
              <div className="grid gap-3 sm:grid-cols-2">
                {renderNumber(index, player, "techTilesCount", "Tech Tiles")}
                {renderNumber(index, player, "commanderSkillsCount", "Cmdr Skills")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Cards" icon={ScrollText}>
          <div className="grid gap-3 lg:grid-cols-3">
            <StatSubsection title="Deck composition">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {renderNumber(index, player, "finalDeckSize", "Size")}
                {renderNumber(index, player, "cardsTrashedCount", "Trashed")}
              </div>
            </StatSubsection>
            <StatSubsection title="Special cards">
              <div className="grid gap-3">
                {renderNumber(index, player, "conflictCardsWonCount", "Conflicts won")}
                <ObjectiveSelect value={player.objectiveCard} onChange={(value) => updateField(index, "objectiveCard", value as any)} disabled={submitting} />
              </div>
            </StatSubsection>
            <StatSubsection title="Intrigue">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {renderNumber(index, player, "intrigueCardsPlayed", "Played")}
                {renderNumber(index, player, "intrigueCardsHeldEndgame", "Held")}
              </div>
            </StatSubsection>
          </div>
        </StatSection>

        <StatSection title="Notes" icon={NotebookText}>
          <TextField id={`notes-${index}`} label="Player notes" value={player.notes} placeholder="e.g. 1 influence from Panopticon" onChange={(value) => updateField(index, "notes", value)} disabled={submitting} />
        </StatSection>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit Playthrough
        </CardTitle>
        <CardDescription>Update player names, rankings, leaders, and analytics-compatible Dune stats.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-game-date">Game Date</Label>
              <Input id="edit-game-date" type="date" value={gameDate} onChange={(event) => setGameDate(event.target.value)} disabled={submitting} className="w-full" />
            </div>
            <NumberField id="edit-round-count" label="Rounds" value={roundCount} placeholder="e.g. 6" onChange={setRoundCount} disabled={submitting} />
          </div>

          <div className="space-y-4">
            {playerRanks.map((playerRank, index) => {
              const suggestions = existingPlayers.filter((player) => player.name.toLowerCase().includes(playerRank.playerName.toLowerCase()) && player.name.toLowerCase() !== playerRank.playerName.toLowerCase())
              const showSuggestions = showPlayerSuggestions[playerRank.id] && suggestions.length > 0
              const isExpanded = expandedPlayerId === playerRank.id

              return (
                <div key={playerRank.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-[minmax(120px,1fr)_120px_minmax(160px,220px)_auto] md:items-end">
                    <div className="relative">
                      <Label htmlFor={`player-name-${playerRank.id}`}>Player Name</Label>
                      <Input
                        id={`player-name-${playerRank.id}`}
                        value={playerRank.playerName}
                        onChange={(event) => updateField(index, "playerName", event.target.value)}
                        onFocus={() => setShowPlayerSuggestions((prev) => ({ ...prev, [playerRank.id]: true }))}
                        onBlur={() => setTimeout(() => setShowPlayerSuggestions((prev) => ({ ...prev, [playerRank.id]: false })), 200)}
                        disabled={submitting}
                      />
                      {showSuggestions && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-32 overflow-y-auto rounded-md border bg-white shadow-lg">
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

                    <div>
                      <Label htmlFor={`rank-${playerRank.id}`}>Final Rank</Label>
                      <Input id={`rank-${playerRank.id}`} type="number" min={1} value={playerRank.rank} onChange={(event) => updateField(index, "rank", event.target.value)} disabled={submitting} />
                    </div>

                    {playthrough?.game_type === "dune" && (
                      <div>
                        <Label>Leader</Label>
                        {leadersLoading ? (
                          <div className="flex h-10 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                        ) : (
                          <Select value={playerRank.leaderId || "none"} onValueChange={(value) => updateLeader(index, normaliseSelectId(value))} disabled={submitting}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select leader" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No leader</SelectItem>
                              {leaders.map((leader) => (
                                <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    <Button type="button" variant="ghost" size="sm" onClick={() => removePlayerField(index)} disabled={playerRanks.length <= 1 || submitting} aria-label="Remove player">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  {playthrough?.game_type === "dune" && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-between rounded-lg border-slate-200 bg-white/80 hover:bg-amber-50"
                        onClick={() => setExpandedPlayerId(isExpanded ? null : playerRank.id)}
                        disabled={submitting}
                      >
                        <span className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {isExpanded ? "Close editor" : "Open full editor"}
                        </span>
                        {hasAdvancedData(playerRank) && <Badge variant="secondary">Has data</Badge>}
                      </Button>
                      {isExpanded && renderAdvanced(playerRank, index)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={addPlayerField} disabled={submitting}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Player
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting || submitSuccess}>
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                ) : submitSuccess ? (
                  <><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Updated!</>
                ) : (
                  "Update Playthrough"
                )}
              </Button>
            </div>
          </div>

          {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        </form>
      </CardContent>
    </Card>
  )
}
