import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

function firstRow<T>(rows: T[]): T | null {
  return rows[0] ?? null
}

async function verifyGroupAccess(groupId: string, userId: string) {
  return firstRow(
    await sql`
      SELECT id
      FROM group_access
      WHERE group_id = ${groupId}
        AND user_id = ${userId}
      LIMIT 1
    `,
  )
}

async function verifyGameBelongsToGroup(gameId: string, groupId: string) {
  return firstRow(
    await sql`
      SELECT id, group_id
      FROM games
      WHERE id = ${gameId}
        AND group_id = ${groupId}
      LIMIT 1
    `,
  )
}

async function getOrCreateActiveSeason(groupId: string, gameId?: string | null) {
  if (gameId) {
    const existingGameSeason = firstRow(
      await sql`
        SELECT *
        FROM seasons
        WHERE group_id = ${groupId}
          AND game_id = ${gameId}
          AND status = 'active'
        ORDER BY season_number DESC
        LIMIT 1
      `,
    )

    if (existingGameSeason) return existingGameSeason

    const groupSeason = firstRow(
      await sql`
        SELECT *
        FROM seasons
        WHERE group_id = ${groupId}
          AND game_id IS NULL
          AND status = 'active'
        ORDER BY season_number DESC
        LIMIT 1
      `,
    )

    const maxSeason = firstRow(
      await sql`
        SELECT COALESCE(MAX(season_number), 0) AS max_season_number
        FROM seasons
        WHERE group_id = ${groupId}
          AND game_id = ${gameId}
      `,
    )

    const seasonNumber = groupSeason?.season_number ?? Number(maxSeason?.max_season_number ?? 0) + 1
    const minGamesThreshold = groupSeason?.min_games_threshold ?? 10
    const startDate = groupSeason?.start_date ?? null

    const created = firstRow(
      await sql`
        INSERT INTO seasons (
          group_id,
          game_id,
          season_number,
          start_date,
          status,
          min_games_threshold,
          total_playthroughs
        )
        VALUES (
          ${groupId},
          ${gameId},
          ${seasonNumber},
          COALESCE(${startDate}, NOW()),
          'active',
          ${minGamesThreshold},
          0
        )
        ON CONFLICT (game_id, season_number)
        DO UPDATE SET
          status = 'active',
          end_date = NULL
        RETURNING *
      `,
    )

    if (!created) throw new Error("Failed to create active season")
    return created
  }

  const groupSeason = firstRow(
    await sql`
      SELECT *
      FROM seasons
      WHERE group_id = ${groupId}
        AND game_id IS NULL
        AND status = 'active'
      ORDER BY season_number DESC
      LIMIT 1
    `,
  )

  if (groupSeason) return groupSeason

  const maxSeason = firstRow(
    await sql`
      SELECT COALESCE(MAX(season_number), 0) AS max_season_number
      FROM seasons
      WHERE group_id = ${groupId}
        AND game_id IS NULL
    `,
  )

  const created = firstRow(
    await sql`
      INSERT INTO seasons (group_id, season_number, status, min_games_threshold, total_playthroughs)
      VALUES (${groupId}, ${Number(maxSeason?.max_season_number ?? 0) + 1}, 'active', 10, 0)
      RETURNING *
    `,
  )

  if (!created) throw new Error("Failed to create active season")
  return created
}

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const userId = getUserId(request)
    const { groupId } = params
    const gameId = request.nextUrl.searchParams.get("gameId")

    const access = await verifyGroupAccess(groupId, userId)
    if (!access) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    if (gameId) {
      const game = await verifyGameBelongsToGroup(gameId, groupId)
      if (!game) {
        return NextResponse.json({ success: false, error: "Game not found for this group" }, { status: 404 })
      }
    }

    const season = await getOrCreateActiveSeason(groupId, gameId)

    const [playthroughCount] = await sql`
      SELECT COUNT(*)::int AS total
      FROM playthroughs
      WHERE season_id = ${season.id}
    `

    const playerStats = await sql`
      SELECT
        pr.player_id AS "playerId",
        pr.player_name AS "playerName",
        COUNT(*)::int AS "totalGames",
        COUNT(CASE WHEN pr.rank = 1 THEN 1 END)::int AS "firstPlaces",
        ROUND((COUNT(CASE WHEN pr.rank = 1 THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 2)::float AS "winRate",
        ROUND(AVG(pr.rank::decimal), 2)::float AS "averageRank"
      FROM playthrough_results pr
      INNER JOIN playthroughs p ON pr.playthrough_id = p.id
      WHERE p.season_id = ${season.id}
      GROUP BY pr.player_id, pr.player_name
      ORDER BY "firstPlaces" DESC, "winRate" DESC, "averageRank" ASC, "playerName" ASC
    `

    const totalPlaythroughs = Number(playthroughCount?.total ?? 0)

    return NextResponse.json({
      success: true,
      data: {
        season,
        totalPlaythroughs,
        playerStats,
        canConclude: totalPlaythroughs >= Number(season.min_games_threshold ?? 10),
      },
    })
  } catch (error) {
    console.error("Error fetching current season:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch current season",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
