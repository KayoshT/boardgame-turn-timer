import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

function firstRow<T>(rows: T[]): T | null {
  return rows[0] ?? null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const userId = getUserId(request)
    const { groupId } = await params
    let body: { gameId?: string } = {}

    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const gameId = body.gameId ?? request.nextUrl.searchParams.get("gameId") ?? null

    const access = firstRow(
      await sql`
        SELECT id
        FROM group_access
        WHERE group_id = ${groupId}
          AND user_id = ${userId}
        LIMIT 1
      `,
    )

    if (!access) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    if (gameId) {
      const game = firstRow(
        await sql`
          SELECT id
          FROM games
          WHERE id = ${gameId}
            AND group_id = ${groupId}
          LIMIT 1
        `,
      )

      if (!game) {
        return NextResponse.json({ success: false, error: "Game not found for this group" }, { status: 404 })
      }
    }

    const currentSeason = firstRow(
      gameId
        ? await sql`
            SELECT *
            FROM seasons
            WHERE group_id = ${groupId}
              AND game_id = ${gameId}
              AND status = 'active'
            ORDER BY season_number DESC
            LIMIT 1
          `
        : await sql`
            SELECT *
            FROM seasons
            WHERE group_id = ${groupId}
              AND game_id IS NULL
              AND status = 'active'
            ORDER BY season_number DESC
            LIMIT 1
          `,
    )

    if (!currentSeason) {
      return NextResponse.json({ success: false, error: "No active season found" }, { status: 404 })
    }

    const [playthroughCount] = await sql`
      SELECT COUNT(*)::int AS total
      FROM playthroughs
      WHERE season_id = ${currentSeason.id}
    `

    if (Number(playthroughCount.total) < Number(currentSeason.min_games_threshold)) {
      return NextResponse.json(
        {
          success: false,
          error: `Season needs at least ${currentSeason.min_games_threshold} games to conclude. Currently has ${playthroughCount.total}.`,
        },
        { status: 400 },
      )
    }

    const topPlayers = await sql`
      SELECT 
        pr.player_id,
        pr.player_name,
        COUNT(*)::int AS total_games,
        COUNT(CASE WHEN pr.rank = 1 THEN 1 END)::int AS first_places,
        ROUND((COUNT(CASE WHEN pr.rank = 1 THEN 1 END)::decimal / COUNT(*)) * 100, 2)::float AS win_rate,
        ROUND(AVG(pr.rank::decimal), 2)::float AS average_rank
      FROM playthrough_results pr
      INNER JOIN playthroughs p ON pr.playthrough_id = p.id
      WHERE p.season_id = ${currentSeason.id}
      GROUP BY pr.player_id, pr.player_name
      HAVING COUNT(*) >= 3
      ORDER BY win_rate DESC, total_games DESC, average_rank ASC
      LIMIT 4
    `

    await sql`
      UPDATE seasons 
      SET 
        status = 'concluded',
        end_date = NOW(),
        total_playthroughs = ${playthroughCount.total}
      WHERE id = ${currentSeason.id}
    `

    const badgeTypes = ["champion", "runner_up", "bronze", "fourth"]

    for (let i = 0; i < Math.min(topPlayers.length, 4); i++) {
      const player = topPlayers[i]
      await sql`
        INSERT INTO season_badges (
          season_id,
          player_id,
          player_name,
          rank,
          badge_type,
          total_games,
          win_rate
        )
        VALUES (
          ${currentSeason.id},
          ${player.player_id},
          ${player.player_name},
          ${i + 1},
          ${badgeTypes[i]},
          ${player.total_games},
          ${player.win_rate}
        )
        ON CONFLICT (season_id, player_id)
        DO UPDATE SET
          rank = EXCLUDED.rank,
          badge_type = EXCLUDED.badge_type,
          total_games = EXCLUDED.total_games,
          win_rate = EXCLUDED.win_rate
      `
    }

    const newSeason = firstRow(
      await sql`
        INSERT INTO seasons (group_id, game_id, season_number, status, min_games_threshold, total_playthroughs)
        VALUES (
          ${groupId},
          ${gameId},
          ${Number(currentSeason.season_number) + 1},
          'active',
          ${currentSeason.min_games_threshold},
          0
        )
        ON CONFLICT (game_id, season_number)
        DO UPDATE SET
          status = 'active',
          end_date = NULL
        RETURNING *
      `,
    )


    return NextResponse.json({
      success: true,
      message: `Season ${currentSeason.season_number} concluded! Season ${Number(currentSeason.season_number) + 1} has begun.`,
      data: {
        seasonNumber: currentSeason.season_number,
        newSeason,
      },
    })
  } catch (error) {
    console.error("Error concluding season:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to conclude season",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
