import { sql } from "@/lib/db"
import { normaliseAcquisitionInput } from "@/lib/dune-acquisition-inventory"
import type {
  PlaythroughResultAcquisition,
  PlaythroughResultAcquisitionInput,
  PlaythroughResultTrackedItem,
  PlaythroughResultTrackedItemInput,
} from "@/types/dune-acquisitions"

type Row = Record<string, any>

type PlaythroughWithResults = Row & {
  id?: string | null
  results?: Row[] | string | null
}

function firstDefined<T = unknown>(source: Row, keys: string[]): T | undefined {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key] as T
  }

  return undefined
}

function resultIdFor(result: Row): string | null {
  const raw = firstDefined(result, ["resultId", "id", "playthroughResultId", "playthrough_result_id"])
  return typeof raw === "string" && raw.length > 0 ? raw : null
}

function parseResults(results: PlaythroughWithResults["results"]): Row[] {
  if (Array.isArray(results)) return results
  if (typeof results !== "string") return []

  try {
    const parsed = JSON.parse(results)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getSubmittedTrackedItems(source: Row): PlaythroughResultTrackedItemInput[] {
  const raw = firstDefined(source, [
    "trackedItems",
    "playthroughResultItems",
    "playthrough_result_items",
    "items",
    "acquisitions",
    "playthroughResultAcquisitions",
    "playthrough_result_acquisitions",
    "cardAcquisitions",
    "card_acquisitions",
  ])

  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => (item && typeof item === "object" ? normaliseAcquisitionInput(item as Row) : null))
    .filter((item): item is PlaythroughResultTrackedItemInput => item !== null)
}

export function getSubmittedAcquisitions(source: Row): PlaythroughResultAcquisitionInput[] {
  return getSubmittedTrackedItems(source)
}

export function mapTrackedItemRow(row: Row): PlaythroughResultTrackedItem {
  return {
    id: row.id,

    playthroughId: row.playthrough_id,
    playthrough_id: row.playthrough_id,

    playthroughResultId: row.playthrough_result_id,
    playthrough_result_id: row.playthrough_result_id,

    playerId: row.player_id,
    player_id: row.player_id,

    itemKey: row.item_key,
    item_key: row.item_key,

    itemName: row.item_name,
    item_name: row.item_name,

    itemType: row.item_type,
    item_type: row.item_type,

    deckId: row.deck_id,
    deck_id: row.deck_id,

    source: row.source,

    acquisitionCount: Number(row.acquisition_count ?? 1),
    acquisition_count: Number(row.acquisition_count ?? 1),

    itemStatus: row.item_status,
    item_status: row.item_status,

    vpCount: Number(row.vp_count ?? 0),
    vp_count: Number(row.vp_count ?? 0),

    strengthCount: Number(row.strength_count ?? 0),
    strength_count: Number(row.strength_count ?? 0),

    entrySource: row.entry_source,
    entry_source: row.entry_source,

    acquisitionMethod: row.acquisition_method,
    acquisition_method: row.acquisition_method,

    notes: row.notes,

    createdAt: row.created_at,
    created_at: row.created_at,
  }
}

export function mapAcquisitionRow(row: Row): PlaythroughResultAcquisition {
  return mapTrackedItemRow(row)
}

export async function replacePlaythroughResultItems(args: {
  playthroughId: string
  playthroughResultId: string
  playerId?: string | null
  items?: PlaythroughResultTrackedItemInput[]
  acquisitions?: PlaythroughResultAcquisitionInput[]
}): Promise<void> {
  const { playthroughId, playthroughResultId, playerId } = args
  const items = args.items ?? args.acquisitions ?? []

  await sql`
    DELETE FROM playthrough_result_items
    WHERE playthrough_result_id = ${playthroughResultId}
  `

  for (const item of items) {
    const normalised = normaliseAcquisitionInput(item as unknown as Row)
    if (!normalised) continue

    await sql`
      INSERT INTO playthrough_result_items (
        playthrough_id,
        playthrough_result_id,
        player_id,
        item_key,
        item_name,
        item_type,
        deck_id,
        source,
        acquisition_count,
        item_status,
        vp_count,
        strength_count,
        entry_source,
        acquisition_method,
        notes
      )
      VALUES (
        ${playthroughId},
        ${playthroughResultId},
        ${playerId ?? null},
        ${normalised.itemKey},
        ${normalised.itemName},
        ${normalised.itemType},
        ${normalised.deckId},
        ${normalised.source ?? null},
        ${normalised.acquisitionCount},
        ${normalised.itemStatus ?? normalised.item_status ?? null},
        ${normalised.vpCount ?? normalised.vp_count ?? 0},
        ${normalised.strengthCount ?? normalised.strength_count ?? 0},
        ${normalised.entrySource ?? normalised.entry_source ?? null},
        ${normalised.acquisitionMethod ?? null},
        ${normalised.notes ?? null}
      )
      ON CONFLICT (playthrough_result_id, item_key)
      DO UPDATE SET
        item_name = EXCLUDED.item_name,
        item_type = EXCLUDED.item_type,
        deck_id = EXCLUDED.deck_id,
        source = EXCLUDED.source,
        acquisition_count = EXCLUDED.acquisition_count,
        item_status = EXCLUDED.item_status,
        vp_count = EXCLUDED.vp_count,
        strength_count = EXCLUDED.strength_count,
        entry_source = EXCLUDED.entry_source,
        acquisition_method = EXCLUDED.acquisition_method,
        notes = EXCLUDED.notes
    `
  }
}

export async function replacePlaythroughResultAcquisitions(args: {
  playthroughId: string
  playthroughResultId: string
  playerId?: string | null
  acquisitions: PlaythroughResultAcquisitionInput[]
}): Promise<void> {
  return replacePlaythroughResultItems({
    playthroughId: args.playthroughId,
    playthroughResultId: args.playthroughResultId,
    playerId: args.playerId,
    items: args.acquisitions,
  })
}

export async function fetchPlaythroughResultItemsByPlaythroughId(
  playthroughId: string,
): Promise<Map<string, PlaythroughResultTrackedItem[]>> {
  const rows = await sql`
    SELECT *
    FROM playthrough_result_items
    WHERE playthrough_id = ${playthroughId}
    ORDER BY deck_id, item_name, item_key
  `

  const byResultId = new Map<string, PlaythroughResultTrackedItem[]>()

  for (const row of rows) {
    const item = mapTrackedItemRow(row)
    const resultId = item.playthroughResultId
    if (!resultId) continue

    const existing = byResultId.get(resultId) ?? []
    existing.push(item)
    byResultId.set(resultId, existing)
  }

  return byResultId
}

export async function fetchPlaythroughResultAcquisitionsByPlaythroughId(
  playthroughId: string,
): Promise<Map<string, PlaythroughResultAcquisition[]>> {
  return fetchPlaythroughResultItemsByPlaythroughId(playthroughId)
}

export async function attachTrackedItemsToPlaythrough<T extends PlaythroughWithResults>(playthrough: T | null): Promise<T | null> {
  if (!playthrough?.id) return playthrough

  const byResultId = await fetchPlaythroughResultItemsByPlaythroughId(playthrough.id)
  const results = parseResults(playthrough.results)

  return {
    ...playthrough,
    results: results.map((result) => {
      const resultId = resultIdFor(result)
      const items = resultId ? byResultId.get(resultId) ?? [] : []

      return {
        ...result,
        trackedItems: items,
        playthroughResultItems: items,
        playthrough_result_items: items,
        acquisitions: items,
        playthroughResultAcquisitions: items,
        playthrough_result_acquisitions: items,
      }
    }),
  }
}

export async function attachAcquisitionsToPlaythrough<T extends PlaythroughWithResults>(playthrough: T | null): Promise<T | null> {
  return attachTrackedItemsToPlaythrough(playthrough)
}

export async function attachTrackedItemsToPlaythroughs<T extends PlaythroughWithResults>(playthroughs: T[]): Promise<T[]> {
  const next: T[] = []

  for (const playthrough of playthroughs) {
    const hydrated = await attachTrackedItemsToPlaythrough(playthrough)
    if (hydrated) next.push(hydrated)
  }

  return next
}

export async function attachAcquisitionsToPlaythroughs<T extends PlaythroughWithResults>(playthroughs: T[]): Promise<T[]> {
  return attachTrackedItemsToPlaythroughs(playthroughs)
}
