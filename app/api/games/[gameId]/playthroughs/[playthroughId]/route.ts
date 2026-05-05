import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"
import {
  getSubmittedTrackedItems,
  replacePlaythroughResultItems,
} from "@/lib/playthrough-result-items"

function firstDefined<T = unknown>(source: Record<string, any>, keys: string[]): T | undefined {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key] as T
  }
  return undefined
}

function nullableText(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function nullableBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1
  const text = String(value).trim().toLowerCase()
  if (["true", "1", "yes", "y"].includes(text)) return true
  if (["false", "0", "no", "n"].includes(text)) return false
  return null
}

function parseDateToIso(value: unknown): string | null {
  const text = nullableText(value)
  if (!text) return null

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function normaliseHighCouncilSeatPosition(result: Record<string, any>, hasHighCouncil: boolean | null): number | null {
  const raw = nullableNumber(firstDefined(result, ["highCouncilSeatPosition", "high_council_seat_position"]))
  if (hasHighCouncil === false) return null
  if (raw === null) return null
  return raw >= 1 && raw <= 4 ? raw : null
}

function normaliseHasHighCouncil(result: Record<string, any>): boolean | null {
  const seat = nullableNumber(firstDefined(result, ["highCouncilSeatPosition", "high_council_seat_position"]))
  const hasHighCouncil = nullableBoolean(firstDefined(result, ["hasHighCouncil", "has_high_council"]))
  if (seat !== null && seat >= 1 && seat <= 4) return true
  return hasHighCouncil
}

function getResultFields(result: Record<string, any>) {
  return {
    score: nullableNumber(firstDefined(result, ["score", "finalVp", "final_vp", "victory_points"])),

    turnOrderPosition: nullableNumber(
        firstDefined(result, ["turnOrderPosition", "turn_order_position", "turnOrder"]),
    ),

    endgameSpiceCount: nullableNumber(
        firstDefined(result, ["endgameSpiceCount", "endgame_spice_count", "finalResourcesSpice", "final_resources_spice", "spice"]),
    ),
    endgameSolariCount: nullableNumber(
        firstDefined(result, [
          "endgameSolariCount",
          "endgame_solari_count",
          "finalResourcesSolari",
          "final_resources_solari",
          "solari",
        ]),
    ),
    endgameWaterCount: nullableNumber(
        firstDefined(result, ["endgameWaterCount", "endgame_water_count", "finalResourcesWater", "final_resources_water", "water"]),
    ),

    cardsTrashedCount: nullableNumber(
        firstDefined(result, ["cardsTrashedCount", "cards_trashed_count", "cardsTrashed", "cards_trashed"]),
    ),
    finalDeckSize: nullableNumber(firstDefined(result, ["finalDeckSize", "final_deck_size", "cards_in_deck"])),

    finalConflictStrength: nullableNumber(firstDefined(result, ["finalConflictStrength", "final_conflict_strength"])),
    finalConflictPlace: nullableNumber(firstDefined(result, ["finalConflictPlace", "final_conflict_place"])),
    finalConflictGarrisonTroops: nullableNumber(
        firstDefined(result, ["finalConflictGarrisonTroops", "final_conflict_garrison_troops"]),
    ),
    finalConflictGarrisonCommanders: nullableNumber(
        firstDefined(result, ["finalConflictGarrisonCommanders", "final_conflict_garrison_commanders"]),
    ),
    finalConflictDeployedTroops: nullableNumber(
        firstDefined(result, ["finalConflictDeployedTroops", "final_conflict_deployed_troops"]),
    ),
    finalConflictDeployedCommanders: nullableNumber(
        firstDefined(result, ["finalConflictDeployedCommanders", "final_conflict_deployed_commanders"]),
    ),
    finalConflictDeployedSandworms: nullableNumber(
        firstDefined(result, ["finalConflictDeployedSandworms", "final_conflict_deployed_sandworms"]),
    ),

    finalConflictStrengthSourcesCommanderSkills: nullableNumber(
        firstDefined(result, [
          "finalConflictStrengthSourcesCommanderSkills",
          "final_conflict_strength_sources_commander_skills",
        ]),
    ),
    finalConflictStrengthSourcesIntrigue: nullableNumber(
        firstDefined(result, ["finalConflictStrengthSourcesIntrigue", "final_conflict_strength_sources_intrigue"]),
    ),
    finalConflictStrengthSourcesImperium: nullableNumber(
        firstDefined(result, ["finalConflictStrengthSourcesImperium", "final_conflict_strength_sources_imperium"]),
    ),
    finalConflictStrengthSourcesTech: nullableNumber(
        firstDefined(result, ["finalConflictStrengthSourcesTech", "final_conflict_strength_sources_tech"]),
    ),
    finalConflictStrengthSourcesUnaccounted: nullableNumber(
        firstDefined(result, ["finalConflictStrengthSourcesUnaccounted", "final_conflict_strength_sources_unaccounted"]),
    ),

    influenceEmperor: nullableNumber(firstDefined(result, ["influenceEmperor", "influence_emperor"])),
    influenceSpacingGuild: nullableNumber(firstDefined(result, ["influenceSpacingGuild", "influence_spacing_guild"])),
    influenceBeneGesserit: nullableNumber(firstDefined(result, ["influenceBeneGesserit", "influence_bene_gesserit"])),
    influenceFremen: nullableNumber(firstDefined(result, ["influenceFremen", "influence_fremen"])),

    hasAllianceEmperor: nullableBoolean(firstDefined(result, ["hasAllianceEmperor", "has_alliance_emperor"])),
    hasAllianceSpacingGuild: nullableBoolean(
        firstDefined(result, ["hasAllianceSpacingGuild", "has_alliance_spacing_guild"]),
    ),
    hasAllianceBeneGesserit: nullableBoolean(
        firstDefined(result, ["hasAllianceBeneGesserit", "has_alliance_bene_gesserit"]),
    ),
    hasAllianceFremen: nullableBoolean(firstDefined(result, ["hasAllianceFremen", "has_alliance_fremen"])),

    vpSourcesBase: nullableNumber(firstDefined(result, ["vpSourcesBase", "vp_sources_base"])),
    vpSourcesFactions: nullableNumber(firstDefined(result, ["vpSourcesFactions", "vp_sources_factions"])),
    vpSourcesConflictCards: nullableNumber(firstDefined(result, ["vpSourcesConflictCards", "vp_sources_conflict_cards"])),
    vpSourcesFinalConflict: nullableNumber(firstDefined(result, ["vpSourcesFinalConflict", "vp_sources_final_conflict"])),
    vpSourcesBattleIconMatches: nullableNumber(
        firstDefined(result, ["vpSourcesBattleIconMatches", "vp_sources_battle_icon_matches"]),
    ),
    vpSourcesSpiceMustFlow: nullableNumber(
        firstDefined(result, ["vpSourcesSpiceMustFlow", "vp_sources_spice_must_flow"]),
    ),
    vpSourcesIntrigueCards: nullableNumber(firstDefined(result, ["vpSourcesIntrigueCards", "vp_sources_intrigue_cards"])),
    vpSourcesTechTiles: nullableNumber(firstDefined(result, ["vpSourcesTechTiles", "vp_sources_tech_tiles"])),
    vpSourcesImperiumCards: nullableNumber(firstDefined(result, ["vpSourcesImperiumCards", "vp_sources_imperium_cards"])),
    vpSourcesLeaderAbilities: nullableNumber(
        firstDefined(result, ["vpSourcesLeaderAbilities", "vp_sources_leader_abilities"]),
    ),
    vpSourcesUnaccounted: nullableNumber(firstDefined(result, ["vpSourcesUnaccounted", "vp_sources_unaccounted"])),
    finalRoundVpDelta: nullableNumber(firstDefined(result, ["finalRoundVpDelta", "final_round_vp_delta"])),

    intrigueCardsPlayed: nullableNumber(firstDefined(result, ["intrigueCardsPlayed", "intrigue_cards_played"])),
    intrigueCardsHeldEndgame: nullableNumber(
        firstDefined(result, ["intrigueCardsHeldEndgame", "intrigue_cards_held_endgame"]),
    ),
    conflictCardsWonCount: nullableNumber(firstDefined(result, ["conflictCardsWonCount", "conflict_cards_won_count"])),
    objectiveCard: nullableText(firstDefined(result, ["objectiveCard", "objective_card"])),

    contractsCompletedCount: nullableNumber(firstDefined(result, ["contractsCompletedCount", "contracts_completed_count"])),
    contractsHeldIncomplete: nullableNumber(firstDefined(result, ["contractsHeldIncomplete", "contracts_held_incomplete"])),
    techTilesCount: nullableNumber(firstDefined(result, ["techTilesCount", "tech_tiles_count"])),
    controlMarkerCount: nullableNumber(firstDefined(result, ["controlMarkerCount", "control_marker_count"])),
    commanderSkillsCount: nullableNumber(firstDefined(result, ["commanderSkillsCount", "commander_skills_count"])),
    spiesOnBoardEndgame: nullableNumber(firstDefined(result, ["spiesOnBoardEndgame", "spies_on_board_endgame"])),

    hasHighCouncil: normaliseHasHighCouncil(result),
    highCouncilSeatPosition: normaliseHighCouncilSeatPosition(result, normaliseHasHighCouncil(result)),
    hasSwordmaster: nullableBoolean(firstDefined(result, ["hasSwordmaster", "has_swordmaster"])),
    hasMakerHooks: nullableBoolean(firstDefined(result, ["hasMakerHooks", "has_maker_hooks"])),

    notes: nullableText(firstDefined(result, ["notes"])),
  }
}

type DuneResultFields = ReturnType<typeof getResultFields>
type MutableDuneResultFields = DuneResultFields & Record<string, any>

const SERVER_FACTIONS = [
  { influenceField: "influenceEmperor", allianceField: "hasAllianceEmperor" },
  { influenceField: "influenceSpacingGuild", allianceField: "hasAllianceSpacingGuild" },
  { influenceField: "influenceBeneGesserit", allianceField: "hasAllianceBeneGesserit" },
  { influenceField: "influenceFremen", allianceField: "hasAllianceFremen" },
] as const

function isBlankServerValue(value: unknown): boolean {
  return value === undefined || value === null || value === ""
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function influenceVp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 2 ? 1 : 0
}

function allianceVp(value: unknown): number {
  return value === true ? 1 : 0
}

function isSteersmanLeader(leaderName: string | null): boolean {
  return /steersman|y['’]?rkoon|yrkoon/i.test(leaderName ?? "")
}

function applyCountImpliedZeroesServer(fields: MutableDuneResultFields): MutableDuneResultFields {
  const next = { ...fields }

  if (next.techTilesCount === 0) {
    if (isBlankServerValue(next.vpSourcesTechTiles)) next.vpSourcesTechTiles = 0
    if (isBlankServerValue(next.finalConflictStrengthSourcesTech)) next.finalConflictStrengthSourcesTech = 0
  }

  if (next.commanderSkillsCount === 0 && isBlankServerValue(next.finalConflictStrengthSourcesCommanderSkills)) {
    next.finalConflictStrengthSourcesCommanderSkills = 0
  }

  if (next.intrigueCardsPlayed === 0 && next.intrigueCardsHeldEndgame === 0 && isBlankServerValue(next.vpSourcesIntrigueCards)) {
    next.vpSourcesIntrigueCards = 0
  }

  return next
}

function inferServerAlliances(rows: MutableDuneResultFields[]): MutableDuneResultFields[] {
  const nextRows = rows.map((row) => ({ ...row }))

  for (const faction of SERVER_FACTIONS) {
    const values = nextRows.map((row) => row[faction.influenceField])
    const numericValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    const maxInfluence = numericValues.length > 0 ? Math.max(...numericValues) : -Infinity

    if (maxInfluence < 4) {
      for (const row of nextRows) row[faction.allianceField] = false
      continue
    }

    const winners = nextRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row[faction.influenceField] === maxInfluence)

    for (const row of nextRows) row[faction.allianceField] = false

    if (winners.length === 1) {
      winners[0].row[faction.allianceField] = true
    } else {
      for (const winner of winners) winner.row[faction.allianceField] = null
    }
  }

  return nextRows
}

function calculateServerFactionVp(fields: MutableDuneResultFields): number {
  return (
    influenceVp(fields.influenceEmperor) +
    influenceVp(fields.influenceSpacingGuild) +
    influenceVp(fields.influenceBeneGesserit) +
    influenceVp(fields.influenceFremen) +
    allianceVp(fields.hasAllianceEmperor) +
    allianceVp(fields.hasAllianceSpacingGuild) +
    allianceVp(fields.hasAllianceBeneGesserit) +
    allianceVp(fields.hasAllianceFremen)
  )
}

function enforceServerFinalConflictWithinTotal(fields: MutableDuneResultFields): MutableDuneResultFields {
  const finalVp = fields.vpSourcesFinalConflict
  if (typeof finalVp !== "number" || !Number.isFinite(finalVp) || finalVp <= 0) return fields

  const totalVp = fields.vpSourcesConflictCards
  if (typeof totalVp === "number" && Number.isFinite(totalVp) && totalVp >= finalVp) return fields

  return { ...fields, vpSourcesConflictCards: finalVp }
}

function calculateServerKnownVp(fields: MutableDuneResultFields): number {
  return (
    asNumber(fields.vpSourcesBase) +
    calculateServerFactionVp(fields) +
    asNumber(fields.vpSourcesConflictCards) +
    asNumber(fields.vpSourcesBattleIconMatches) +
    asNumber(fields.vpSourcesSpiceMustFlow) +
    asNumber(fields.vpSourcesIntrigueCards) +
    asNumber(fields.vpSourcesTechTiles) +
    asNumber(fields.vpSourcesImperiumCards) +
    asNumber(fields.vpSourcesLeaderAbilities)
  )
}

function calculateServerKnownStrength(fields: MutableDuneResultFields): number {
  return (
    asNumber(fields.finalConflictDeployedTroops) * 2 +
    asNumber(fields.finalConflictDeployedCommanders) * 2 +
    asNumber(fields.finalConflictDeployedSandworms) * 3 +
    asNumber(fields.finalConflictStrengthSourcesCommanderSkills) +
    asNumber(fields.finalConflictStrengthSourcesIntrigue) +
    asNumber(fields.finalConflictStrengthSourcesImperium) +
    asNumber(fields.finalConflictStrengthSourcesTech)
  )
}

function calculateServerConflictPlace(rows: MutableDuneResultFields[], index: number): number | null {
  const strength = rows[index]?.finalConflictStrength
  if (typeof strength !== "number" || !Number.isFinite(strength)) return null

  const strongerPlayers = rows.filter((row) => {
    const otherStrength = row.finalConflictStrength
    return typeof otherStrength === "number" && Number.isFinite(otherStrength) && otherStrength > strength
  }).length

  return strongerPlayers + 1
}

function zeroBlankServerVpSourcesWhenBalanced(fields: MutableDuneResultFields): MutableDuneResultFields {
  if (typeof fields.score !== "number" || !Number.isFinite(fields.score)) return fields
  if (fields.score - calculateServerKnownVp(fields) !== 0) return fields

  const next = { ...fields }
  for (const field of [
    "vpSourcesBase",
    "vpSourcesConflictCards",
    "vpSourcesBattleIconMatches",
    "vpSourcesSpiceMustFlow",
    "vpSourcesIntrigueCards",
    "vpSourcesTechTiles",
    "vpSourcesImperiumCards",
    "vpSourcesLeaderAbilities",
  ]) {
    if (isBlankServerValue(next[field])) next[field] = 0
  }

  return next
}

function zeroBlankServerStrengthSourcesWhenBalanced(fields: MutableDuneResultFields): MutableDuneResultFields {
  if (typeof fields.finalConflictStrength !== "number" || !Number.isFinite(fields.finalConflictStrength)) return fields
  if (fields.finalConflictStrength - calculateServerKnownStrength(fields) !== 0) return fields

  const next = { ...fields }
  for (const field of [
    "finalConflictStrengthSourcesCommanderSkills",
    "finalConflictStrengthSourcesIntrigue",
    "finalConflictStrengthSourcesImperium",
    "finalConflictStrengthSourcesTech",
  ]) {
    if (isBlankServerValue(next[field])) next[field] = 0
  }

  return next
}

function deriveServerResultFields(rawFields: DuneResultFields[]): MutableDuneResultFields[] {
  let rows = rawFields.map((fields) => applyCountImpliedZeroesServer(fields as MutableDuneResultFields))
  rows = inferServerAlliances(rows)
  rows = rows.map(enforceServerFinalConflictWithinTotal)

  return rows.map((row, index) => {
    let next = { ...row, finalConflictPlace: calculateServerConflictPlace(rows, index) }
    next.vpSourcesFactions = calculateServerFactionVp(next)
    next.finalConflictStrengthSourcesUnaccounted =
      typeof next.finalConflictStrength === "number" && Number.isFinite(next.finalConflictStrength)
        ? next.finalConflictStrength - calculateServerKnownStrength(next)
        : null
    next.vpSourcesUnaccounted =
      typeof next.score === "number" && Number.isFinite(next.score) ? next.score - calculateServerKnownVp(next) : null
    next = zeroBlankServerVpSourcesWhenBalanced(next)
    next = zeroBlankServerStrengthSourcesWhenBalanced(next)
    next.vpSourcesFactions = calculateServerFactionVp(next)
    next.finalConflictStrengthSourcesUnaccounted =
      typeof next.finalConflictStrength === "number" && Number.isFinite(next.finalConflictStrength)
        ? next.finalConflictStrength - calculateServerKnownStrength(next)
        : null
    next.vpSourcesUnaccounted =
      typeof next.score === "number" && Number.isFinite(next.score) ? next.score - calculateServerKnownVp(next) : null
    return next
  })
}

function finaliseServerResultFieldsForLeader(fields: MutableDuneResultFields, leaderName: string | null): MutableDuneResultFields {
  let next = { ...fields }
  if (!isSteersmanLeader(leaderName) && isBlankServerValue(next.vpSourcesLeaderAbilities)) {
    next.vpSourcesLeaderAbilities = 0
  }
  next = zeroBlankServerVpSourcesWhenBalanced(next)
  next.vpSourcesFactions = calculateServerFactionVp(next)
  next.vpSourcesUnaccounted =
    typeof next.score === "number" && Number.isFinite(next.score) ? next.score - calculateServerKnownVp(next) : null
  return next
}

function toResponseResult(row: any) {
  return {
    resultId: row.id,
    id: row.id,
    playerId: row.player_id,
    playerName: row.player_name,
    rank: row.rank,

    leader: row.leader_name,
    leader_name: row.leader_name,
    leaderName: row.leader_name,
    leaderId: row.leader_id,

    score: row.score,
    victory_points: row.score,
    finalVp: row.score,
    final_vp: row.score,

    spice: row.endgame_spice_count,
    endgameSpiceCount: row.endgame_spice_count,
    endgame_spice_count: row.endgame_spice_count,
    finalResourcesSpice: row.endgame_spice_count,
    final_resources_spice: row.endgame_spice_count,

    solari: row.endgame_solari_count,
    endgameSolariCount: row.endgame_solari_count,
    endgame_solari_count: row.endgame_solari_count,
    finalResourcesSolari: row.endgame_solari_count,
    final_resources_solari: row.endgame_solari_count,

    water: row.endgame_water_count,
    endgameWaterCount: row.endgame_water_count,
    endgame_water_count: row.endgame_water_count,
    finalResourcesWater: row.endgame_water_count,
    final_resources_water: row.endgame_water_count,

    troops: null,
    finalResourcesTroops: null,
    final_resources_troops: null,

    cardsTrashedCount: row.cards_trashed_count,
    cards_trashed_count: row.cards_trashed_count,
    cardsTrashed: row.cards_trashed_count,
    cards_trashed: row.cards_trashed_count,

    cards_in_deck: row.final_deck_size,
    finalDeckSize: row.final_deck_size,
    final_deck_size: row.final_deck_size,

    turnOrderPosition: row.turn_order_position,
    turn_order_position: row.turn_order_position,

    strategic_archetype: row.strategic_archetype_name,
    strategic_archetype_name: row.strategic_archetype_name,
    strategicArchetypeName: row.strategic_archetype_name,
    strategicArchetypeId: row.strategic_archetype_id,

    final_conflict_strength: row.final_conflict_strength,
    final_conflict_place: row.final_conflict_place,
    final_conflict_garrison_troops: row.final_conflict_garrison_troops,
    final_conflict_garrison_commanders: row.final_conflict_garrison_commanders,
    final_conflict_deployed_troops: row.final_conflict_deployed_troops,
    final_conflict_deployed_commanders: row.final_conflict_deployed_commanders,
    final_conflict_deployed_sandworms: row.final_conflict_deployed_sandworms,
    final_conflict_strength_sources_commander_skills: row.final_conflict_strength_sources_commander_skills,
    final_conflict_strength_sources_intrigue: row.final_conflict_strength_sources_intrigue,
    final_conflict_strength_sources_imperium: row.final_conflict_strength_sources_imperium,
    final_conflict_strength_sources_tech: row.final_conflict_strength_sources_tech,
    final_conflict_strength_sources_unaccounted: row.final_conflict_strength_sources_unaccounted,

    influence_emperor: row.influence_emperor,
    influence_spacing_guild: row.influence_spacing_guild,
    influence_bene_gesserit: row.influence_bene_gesserit,
    influence_fremen: row.influence_fremen,

    has_alliance_emperor: row.has_alliance_emperor,
    has_alliance_spacing_guild: row.has_alliance_spacing_guild,
    has_alliance_bene_gesserit: row.has_alliance_bene_gesserit,
    has_alliance_fremen: row.has_alliance_fremen,

    vp_sources_base: row.vp_sources_base,
    vp_sources_factions: row.vp_sources_factions,
    vp_sources_conflict_cards: row.vp_sources_conflict_cards,
    vp_sources_final_conflict: row.vp_sources_final_conflict,
    vp_sources_battle_icon_matches: row.vp_sources_battle_icon_matches,
    vp_sources_spice_must_flow: row.vp_sources_spice_must_flow,
    vp_sources_intrigue_cards: row.vp_sources_intrigue_cards,
    vp_sources_tech_tiles: row.vp_sources_tech_tiles,
    vp_sources_imperium_cards: row.vp_sources_imperium_cards,
    vp_sources_leader_abilities: row.vp_sources_leader_abilities,
    vp_sources_unaccounted: row.vp_sources_unaccounted,
    final_round_vp_delta: row.final_round_vp_delta,

    intrigue_cards_played: row.intrigue_cards_played,
    intrigue_cards_held_endgame: row.intrigue_cards_held_endgame,
    conflict_cards_won_count: row.conflict_cards_won_count,
    objective_card: row.objective_card,

    contracts_completed_count: row.contracts_completed_count,
    contracts_held_incomplete: row.contracts_held_incomplete,
    tech_tiles_count: row.tech_tiles_count,
    control_marker_count: row.control_marker_count,
    commander_skills_count: row.commander_skills_count,
    spies_on_board_endgame: row.spies_on_board_endgame,

    has_high_council: row.has_high_council,
    highCouncilSeatPosition: row.high_council_seat_position,
    high_council_seat_position: row.high_council_seat_position,
    has_swordmaster: row.has_swordmaster,
    has_maker_hooks: row.has_maker_hooks,

    notes: row.notes,
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { gameId: string; playthroughId: string } }) {
  try {
    const userId = getUserId(request)
    const { gameId, playthroughId } = params

    const [game] = await sql`
      SELECT g.id, g.group_id
      FROM games g
      INNER JOIN group_access ga ON g.group_id = ga.group_id
      WHERE g.id = ${gameId} AND ga.user_id = ${userId}
      LIMIT 1
    `

    if (!game) {
      return NextResponse.json({ success: false, error: "Game not found or access denied" }, { status: 404 })
    }

    const [playthrough] = await sql`
      SELECT id FROM playthroughs
      WHERE id = ${playthroughId} AND game_id = ${gameId}
      LIMIT 1
    `

    if (!playthrough) {
      return NextResponse.json({ success: false, error: "Playthrough not found" }, { status: 404 })
    }

    await sql`
      DELETE FROM playthroughs
      WHERE id = ${playthroughId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playthrough:", error)
    return NextResponse.json({ success: false, error: "Failed to delete playthrough" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { gameId: string; playthroughId: string } }) {
  try {
    const userId = getUserId(request)
    const { gameId, playthroughId } = params
    const body = await request.json()
    const { results, date } = body

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ success: false, error: "Results are required" }, { status: 400 })
    }

    const [game] = await sql`
      SELECT g.id, g.group_id, g.game_type
      FROM games g
      INNER JOIN group_access ga ON g.group_id = ga.group_id
      WHERE g.id = ${gameId} AND ga.user_id = ${userId}
      LIMIT 1
    `

    if (!game) {
      return NextResponse.json({ success: false, error: "Game not found or access denied" }, { status: 404 })
    }

    const [playthrough] = await sql`
      SELECT id, game_id, group_id, timestamp, recorded_by, season_id, round_count, notes
      FROM playthroughs
      WHERE id = ${playthroughId} AND game_id = ${gameId}
      LIMIT 1
    `

    if (!playthrough) {
      return NextResponse.json({ success: false, error: "Playthrough not found" }, { status: 404 })
    }

    const ranks = results.map((r: any) => nullableNumber(r.rank))
    if (ranks.some((rank: number | null) => rank === null)) {
      return NextResponse.json({ success: false, error: "Each result must include a valid rank" }, { status: 400 })
    }

    const uniqueRanks = new Set(ranks)
    if (ranks.length !== uniqueRanks.size) {
      return NextResponse.json({ success: false, error: "Each player must have a unique rank" }, { status: 400 })
    }

    const sortedRanks = [...ranks].sort((a, b) => Number(a) - Number(b))
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return NextResponse.json(
            { success: false, error: "Ranks must be consecutive starting from 1st place" },
            { status: 400 },
        )
      }
    }

    const timestampIso = parseDateToIso(date)
    const roundCount = nullableNumber(firstDefined(body, ["roundCount", "round_count"]))
    const notes = body.notes === undefined ? undefined : nullableText(body.notes)

    await sql`
      UPDATE playthroughs
      SET
        timestamp = COALESCE(${timestampIso}, timestamp),
        round_count = COALESCE(${roundCount}, round_count),
        notes = CASE WHEN ${body.notes === undefined} THEN notes ELSE ${notes} END
      WHERE id = ${playthroughId}
    `

    await sql`
      DELETE FROM playthrough_results
      WHERE playthrough_id = ${playthroughId}
    `

    const playthroughResults = []

    const derivedFieldsByIndex = deriveServerResultFields(results.map((result: Record<string, any>) => getResultFields(result)))

    for (const [index, result] of results.entries()) {
      const playerName = nullableText(result.playerName)
      const rank = nullableNumber(result.rank)

      if (!playerName || rank === null) {
        throw new Error("Each result must include playerName and rank")
      }

      let [player] = await sql`
        SELECT id FROM players
        WHERE group_id = ${game.group_id} AND LOWER(name) = LOWER(${playerName})
        LIMIT 1
      `

      if (!player) {
        ;[player] = await sql`
          INSERT INTO players (name, group_id)
          VALUES (${playerName}, ${game.group_id})
          RETURNING id
        `
      }

      let leaderName = nullableText(firstDefined(result, ["leaderName", "leader_name", "leader"]))
      let archetypeName = nullableText(
          firstDefined(result, ["strategicArchetypeName", "strategic_archetype_name", "strategic_archetype"]),
      )

      if (game.game_type === "dune") {
        if (result.leaderId) {
          const [leader] = await sql`
            SELECT name FROM leaders WHERE id = ${result.leaderId} LIMIT 1
          `
          leaderName = leader?.name ?? leaderName
        }

        if (result.strategicArchetypeId) {
          const [archetype] = await sql`
            SELECT name FROM strategic_archetypes WHERE id = ${result.strategicArchetypeId} LIMIT 1
          `
          archetypeName = archetype?.name ?? archetypeName
        }
      }

      const fields = finaliseServerResultFieldsForLeader(derivedFieldsByIndex[index], leaderName)

      const [playthroughResult] = await sql`
        INSERT INTO playthrough_results (
          playthrough_id,
          player_id,
          player_name,
          rank,
          leader_id,
          leader_name,
          score,
          turn_order_position,
          endgame_spice_count,
          endgame_solari_count,
          endgame_water_count,
          cards_trashed_count,
          final_deck_size,
          strategic_archetype_id,
          strategic_archetype_name,
          final_conflict_strength,
          final_conflict_place,
          final_conflict_garrison_troops,
          final_conflict_garrison_commanders,
          final_conflict_deployed_troops,
          final_conflict_deployed_commanders,
          final_conflict_deployed_sandworms,
          final_conflict_strength_sources_commander_skills,
          final_conflict_strength_sources_intrigue,
          final_conflict_strength_sources_imperium,
          final_conflict_strength_sources_tech,
          final_conflict_strength_sources_unaccounted,
          influence_emperor,
          influence_spacing_guild,
          influence_bene_gesserit,
          influence_fremen,
          has_alliance_emperor,
          has_alliance_spacing_guild,
          has_alliance_bene_gesserit,
          has_alliance_fremen,
          vp_sources_base,
          vp_sources_factions,
          vp_sources_conflict_cards,
          vp_sources_final_conflict,
          vp_sources_battle_icon_matches,
          vp_sources_spice_must_flow,
          vp_sources_intrigue_cards,
          vp_sources_tech_tiles,
          vp_sources_imperium_cards,
          vp_sources_leader_abilities,
          vp_sources_unaccounted,
          final_round_vp_delta,
          intrigue_cards_played,
          intrigue_cards_held_endgame,
          conflict_cards_won_count,
          objective_card,
          contracts_completed_count,
          contracts_held_incomplete,
          tech_tiles_count,
          control_marker_count,
          commander_skills_count,
          spies_on_board_endgame,
          has_high_council,
              high_council_seat_position,
          has_swordmaster,
          has_maker_hooks,
          notes
        )
        VALUES (
          ${playthroughId},
          ${player.id},
          ${playerName},
          ${rank},
          ${result.leaderId || null},
          ${leaderName},
          ${fields.score},
          ${fields.turnOrderPosition},
          ${fields.endgameSpiceCount},
          ${fields.endgameSolariCount},
          ${fields.endgameWaterCount},
          ${fields.cardsTrashedCount},
          ${fields.finalDeckSize},
          ${result.strategicArchetypeId || null},
          ${archetypeName},
          ${fields.finalConflictStrength},
          ${fields.finalConflictPlace},
          ${fields.finalConflictGarrisonTroops},
          ${fields.finalConflictGarrisonCommanders},
          ${fields.finalConflictDeployedTroops},
          ${fields.finalConflictDeployedCommanders},
          ${fields.finalConflictDeployedSandworms},
          ${fields.finalConflictStrengthSourcesCommanderSkills},
          ${fields.finalConflictStrengthSourcesIntrigue},
          ${fields.finalConflictStrengthSourcesImperium},
          ${fields.finalConflictStrengthSourcesTech},
          ${fields.finalConflictStrengthSourcesUnaccounted},
          ${fields.influenceEmperor},
          ${fields.influenceSpacingGuild},
          ${fields.influenceBeneGesserit},
          ${fields.influenceFremen},
          ${fields.hasAllianceEmperor},
          ${fields.hasAllianceSpacingGuild},
          ${fields.hasAllianceBeneGesserit},
          ${fields.hasAllianceFremen},
          ${fields.vpSourcesBase},
          ${fields.vpSourcesFactions},
          ${fields.vpSourcesConflictCards},
          ${fields.vpSourcesFinalConflict},
          ${fields.vpSourcesBattleIconMatches},
          ${fields.vpSourcesSpiceMustFlow},
          ${fields.vpSourcesIntrigueCards},
          ${fields.vpSourcesTechTiles},
          ${fields.vpSourcesImperiumCards},
          ${fields.vpSourcesLeaderAbilities},
          ${fields.vpSourcesUnaccounted},
          ${fields.finalRoundVpDelta},
          ${fields.intrigueCardsPlayed},
          ${fields.intrigueCardsHeldEndgame},
          ${fields.conflictCardsWonCount},
          ${fields.objectiveCard},
          ${fields.contractsCompletedCount},
          ${fields.contractsHeldIncomplete},
          ${fields.techTilesCount},
          ${fields.controlMarkerCount},
          ${fields.commanderSkillsCount},
          ${fields.spiesOnBoardEndgame},
          ${fields.hasHighCouncil},
          ${fields.highCouncilSeatPosition},
          ${fields.hasSwordmaster},
          ${fields.hasMakerHooks},
          ${fields.notes}
        )
        RETURNING *
      `

      const trackedItems = getSubmittedTrackedItems(result)

      await replacePlaythroughResultItems({
        playthroughId,
        playthroughResultId: playthroughResult.id,
        playerId: player.id,
        items: trackedItems,
      })

      playthroughResults.push({
        ...toResponseResult(playthroughResult),
        trackedItems,
        playthroughResultItems: trackedItems,
        playthrough_result_items: trackedItems,
        acquisitions: trackedItems,
        playthroughResultAcquisitions: trackedItems,
        playthrough_result_acquisitions: trackedItems,
      })
    }

    const [updatedPlaythrough] = await sql`
      SELECT id, game_id, group_id, timestamp, recorded_by, season_id, round_count, notes
      FROM playthroughs
      WHERE id = ${playthroughId}
      LIMIT 1
    `

    const response = {
      ...updatedPlaythrough,
      results: playthroughResults,
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error("Error updating playthrough:", error)
    return NextResponse.json(
        {
          success: false,
          error: "Failed to update playthrough",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
    )
  }
}