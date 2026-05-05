"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Crown,
  Trophy,
  Coins,
  Droplets,
  Users,
  Sword,
  Target,
  WalletCardsIcon as Cards,
  Zap,
  TrendingUp,
  Star,
  Shield,
  Flame,
  Landmark,
  Swords,
  Flag,
} from "lucide-react"

interface PlaythroughDetailsProps {
  playthrough: any
  gameType?: string
}

function pick(result: any, ...keys: string[]) {
  for (const key of keys) {
    const value = result?.[key]
    if (value !== undefined && value !== null && value !== "") return value
  }
  return null
}

function hasAny(...values: any[]) {
  return values.some((value) => value !== null && value !== undefined && value !== "")
}

function formatStatValue(value: any) {
  return value !== null && value !== undefined && value !== "" ? String(value) : "—"
}

function StatLine({ icon: Icon, label, value, className = "" }: { icon?: any; label: string; value: any; className?: string }) {
  const isMissing = value === null || value === undefined || value === ""

  return (
    <div className="flex items-center text-xs">
      {Icon && <Icon className={`mr-1 h-3 w-3 ${className}`} />}
      <span className={isMissing ? "text-muted-foreground" : undefined}>
        {label}: <span className={isMissing ? "text-slate-400" : undefined}>{formatStatValue(value)}</span>
      </span>
    </div>
  )
}

function MiniSection({ title, icon: Icon, children }: { title: string; icon: any; children: any }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center text-sm font-semibold text-slate-700">
        <Icon className="mr-2 h-4 w-4" />
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">{children}</div>
    </div>
  )
}

export const PlaythroughDetails = ({ playthrough, gameType }: PlaythroughDetailsProps) => {
  const isDuneGame = gameType === "dune"

  const getLeaderIcon = (leaderName: string) => {
    const leaderIcons: Record<string, any> = {
      "Paul Atreides": Crown,
      "Lady Jessica": Star,
      "Gurney Halleck": Sword,
      "Duncan Idaho": Shield,
      Stilgar: Droplets,
      Chani: Target,
      "Liet Kynes": TrendingUp,
      "Count Fenring": Coins,
    }
    return leaderIcons[leaderName] || Crown
  }

  const formatAdvancedStats = (result: any) => {
    if (!result) return null

    const victoryPoints = pick(result, "score", "victory_points", "finalVp", "final_vp")
    const spice = pick(result, "endgameSpiceCount", "endgame_spice_count", "spice", "finalResourcesSpice")
    const solari = pick(result, "endgameSolariCount", "endgame_solari_count", "solari", "finalResourcesSolari")
    const water = pick(result, "endgameWaterCount", "endgame_water_count", "water", "finalResourcesWater")
    const cardsTrashed = pick(result, "cardsTrashedCount", "cards_trashed_count", "cardsTrashed", "cards_trashed")
    const finalDeckSize = pick(result, "finalDeckSize", "final_deck_size", "cards_in_deck")
    const archetype = pick(result, "strategicArchetypeName", "strategic_archetype", "strategic_archetype_name")

    const influence = [
      pick(result, "influence_emperor", "influenceEmperor"),
      pick(result, "influence_spacing_guild", "influenceSpacingGuild"),
      pick(result, "influence_bene_gesserit", "influenceBeneGesserit"),
      pick(result, "influence_fremen", "influenceFremen"),
    ]

    const finalConflict = [
      pick(result, "final_conflict_strength", "finalConflictStrength"),
      pick(result, "final_conflict_place", "finalConflictPlace"),
      pick(result, "vp_sources_final_conflict", "vpSourcesFinalConflict"),
      pick(result, "final_conflict_strength_sources_unaccounted", "finalConflictStrengthSourcesUnaccounted"),
      pick(result, "final_conflict_deployed_troops", "finalConflictDeployedTroops"),
      pick(result, "final_conflict_deployed_commanders", "finalConflictDeployedCommanders"),
      pick(result, "final_conflict_deployed_sandworms", "finalConflictDeployedSandworms"),
      pick(result, "final_conflict_garrison_troops", "finalConflictGarrisonTroops"),
      pick(result, "final_conflict_garrison_commanders", "finalConflictGarrisonCommanders"),
    ]

    const vpSources = [
      pick(result, "vp_sources_base", "vpSourcesBase"),
      pick(result, "vp_sources_factions", "vpSourcesFactions"),
      pick(result, "vp_sources_conflict_cards", "vpSourcesConflictCards"),
      pick(result, "vp_sources_spice_must_flow", "vpSourcesSpiceMustFlow"),
      pick(result, "vp_sources_intrigue_cards", "vpSourcesIntrigueCards"),
      pick(result, "vp_sources_tech_tiles", "vpSourcesTechTiles"),
      pick(result, "vp_sources_imperium_cards", "vpSourcesImperiumCards"),
      pick(result, "vp_sources_leader_abilities", "vpSourcesLeaderAbilities"),
      pick(result, "vp_sources_unaccounted", "vpSourcesUnaccounted"),
    ]

    const modules = [
      pick(result, "conflict_cards_won_count", "conflictCardsWonCount"),
      pick(result, "high_council_seat_position", "highCouncilSeatPosition"),
      pick(result, "contracts_completed_count", "contractsCompletedCount"),
      pick(result, "tech_tiles_count", "techTilesCount"),
      pick(result, "control_marker_count", "controlMarkerCount"),
      pick(result, "commander_skills_count", "commanderSkillsCount"),
      pick(result, "spies_on_board_endgame", "spiesOnBoardEndgame"),
    ]

    const hasAnyStats = hasAny(victoryPoints, spice, solari, water, cardsTrashed, finalDeckSize, archetype, ...influence, ...finalConflict, ...vpSources, ...modules)

    if (!hasAnyStats) {
      return <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-600">No advanced stats recorded for this player</div>
    }

    return (
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="flex items-center text-sm font-semibold text-amber-700">
            <Trophy className="mr-2 h-4 w-4" />
            {victoryPoints !== null ? `${victoryPoints} VP` : "VP: —"}
          </h4>
        </div>

        <MiniSection title="Resources" icon={Coins}>
          <StatLine icon={Flame} className="text-orange-500" label="Spice" value={spice} />
          <StatLine icon={Coins} className="text-yellow-500" label="Solari" value={solari} />
          <StatLine icon={Droplets} className="text-blue-500" label="Water" value={water} />
        </MiniSection>

        <MiniSection title="Deck Stats" icon={Cards}>
          <StatLine label="Cards Trashed" value={cardsTrashed} />
          <StatLine label="Final Deck Size" value={finalDeckSize} />
        </MiniSection>

        <MiniSection title="Strategy" icon={Zap}>
          <div className="col-span-2">
            {archetype ? <Badge variant="outline" className="text-xs">{archetype}</Badge> : <span className="text-xs text-muted-foreground">Strategy: —</span>}
          </div>
        </MiniSection>

        {hasAny(...vpSources) && (
          <MiniSection title="VP Sources" icon={Flag}>
            <StatLine label="Base" value={vpSources[0]} />
            <StatLine label="Factions" value={vpSources[1]} />
            <StatLine label="Conflict" value={vpSources[2]} />
            <StatLine label="SMF" value={vpSources[3]} />
            <StatLine label="Intrigue" value={vpSources[4]} />
            <StatLine label="Tech" value={vpSources[5]} />
            <StatLine label="Imperium" value={vpSources[6]} />
            <StatLine label="Leader" value={vpSources[7]} />
            <StatLine label="Unaccounted" value={vpSources[8]} />
          </MiniSection>
        )}

        {hasAny(...influence) && (
          <MiniSection title="Influence" icon={Landmark}>
            <StatLine label="Emperor" value={influence[0]} />
            <StatLine label="Spacing Guild" value={influence[1]} />
            <StatLine label="Bene Gesserit" value={influence[2]} />
            <StatLine label="Fremen" value={influence[3]} />
          </MiniSection>
        )}

        {hasAny(...finalConflict) && (
          <MiniSection title="Final Conflict" icon={Swords}>
            <StatLine label="Strength" value={finalConflict[0]} />
            <StatLine label="Place" value={finalConflict[1]} />
            <StatLine label="Final conflict VP" value={finalConflict[2]} />
            <StatLine label="Unaccounted strength" value={finalConflict[3]} />
            <StatLine label="Deployed troops" value={finalConflict[4]} />
            <StatLine label="Deployed commanders" value={finalConflict[5]} />
            <StatLine label="Sandworms" value={finalConflict[6]} />
            <StatLine label="Garrison troops" value={finalConflict[7]} />
            <StatLine label="Garrison commanders" value={finalConflict[8]} />
          </MiniSection>
        )}

        {hasAny(...modules) && (
          <MiniSection title="Modules" icon={Shield}>
            <StatLine label="Conflicts won" value={modules[0]} />
            <StatLine label="Council seat" value={modules[1]} />
            <StatLine label="Contracts" value={modules[2]} />
            <StatLine label="Tech tiles" value={modules[3]} />
            <StatLine label="Control markers" value={modules[4]} />
            <StatLine label="Commander skills" value={modules[5]} />
            <StatLine label="Spies" value={modules[6]} />
          </MiniSection>
        )}
      </div>
    )
  }

  return (
    <Card className="mt-3 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 flex items-center text-base font-semibold">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              Game Summary
            </h3>
            <div className="text-sm text-muted-foreground">
              <div>Players: {playthrough.results.length}</div>
              <div>Date: {new Date(playthrough.timestamp).toLocaleDateString()}</div>
              <div>Time: {new Date(playthrough.timestamp).toLocaleTimeString([], { timeStyle: "short" })}</div>
              {(playthrough.round_count ?? playthrough.roundCount) != null && <div>Rounds: {playthrough.round_count ?? playthrough.roundCount}</div>}
              {isDuneGame && <div className="font-medium text-blue-600">Dune: Imperium (Enhanced Stats)</div>}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center text-base font-semibold">
              <Users className="mr-2 h-5 w-5 text-slate-600" />
              Player Results
            </h3>
            <div className="space-y-3">
              {playthrough.results
                .slice()
                .sort((a: any, b: any) => a.rank - b.rank)
                .map((result: any, index: number) => {
                  const leaderName = result.leader || result.leader_name || result.leaderName
                  const LeaderIcon = leaderName ? getLeaderIcon(leaderName) : Crown
                  const victoryPoints = pick(result, "score", "victory_points", "finalVp", "final_vp")

                  return (
                    <div
                      key={`${playthrough.id}-${result.playerId || result.playerName}-${index}`}
                      className={`rounded-lg border p-3 ${
                        result.rank === 1
                          ? "border-amber-200 bg-amber-50"
                          : result.rank === 2
                            ? "border-slate-200 bg-slate-50"
                            : result.rank === 3
                              ? "border-orange-200 bg-orange-50"
                              : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant={result.rank === 1 ? "default" : "outline"} className={result.rank === 1 ? "bg-amber-500 hover:bg-amber-600" : result.rank === 2 ? "border-gray-400 text-gray-700" : result.rank === 3 ? "border-orange-400 text-orange-700" : ""}>
                            #{result.rank}
                          </Badge>
                          <span className="font-medium">{result.playerName}</span>
                          {leaderName && (
                            <div className="flex items-center text-sm text-slate-600">
                              <LeaderIcon className="mr-1 h-4 w-4" />
                              {leaderName}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-sm font-semibold text-amber-700">
                          <Trophy className="mr-1 h-4 w-4" />
                          {victoryPoints !== null ? <span>{victoryPoints} VP</span> : <span className="text-xs text-muted-foreground">VP: —</span>}
                        </div>
                      </div>

                      {isDuneGame && formatAdvancedStats(result)}
                      {!isDuneGame && result.score && <div className="text-sm text-muted-foreground">Score: {result.score}</div>}
                    </div>
                  )
                })}
            </div>
          </div>

          {playthrough.notes && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 text-base font-semibold">Notes</h3>
                <p className="text-sm text-muted-foreground">{playthrough.notes}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
