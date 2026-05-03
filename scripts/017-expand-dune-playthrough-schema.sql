-- 016-expand-dune-playthrough-schema
--
-- Expands Dune result storage for advanced playthrough entry.
-- Run before deploying code that reads the new result fields.
--
-- Renames legacy result columns and removes final_resources_troops.

BEGIN;


DROP VIEW IF EXISTS playthrough_detailed_stats CASCADE;
DROP VIEW IF EXISTS player_signature_leaders CASCADE;
DROP VIEW IF EXISTS leader_performance_stats CASCADE;
DROP VIEW IF EXISTS archetype_performance_stats CASCADE;

-- Playthrough-level additions

ALTER TABLE playthroughs
  ADD COLUMN IF NOT EXISTS round_count integer,
  ADD COLUMN IF NOT EXISTS notes text;

-- Rename legacy result columns.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_vp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'score'
  ) THEN
    ALTER TABLE playthrough_results RENAME COLUMN final_vp TO score;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_vp'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'score'
  ) THEN
    UPDATE playthrough_results
    SET score = COALESCE(score, final_vp)
    WHERE score IS NULL;
    ALTER TABLE playthrough_results DROP COLUMN final_vp;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_spice'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_spice_count'
  ) THEN
    ALTER TABLE playthrough_results RENAME COLUMN final_resources_spice TO endgame_spice_count;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_spice'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_spice_count'
  ) THEN
    UPDATE playthrough_results
    SET endgame_spice_count = COALESCE(endgame_spice_count, final_resources_spice)
    WHERE endgame_spice_count IS NULL;
    ALTER TABLE playthrough_results DROP COLUMN final_resources_spice;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_solari'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_solari_count'
  ) THEN
    ALTER TABLE playthrough_results RENAME COLUMN final_resources_solari TO endgame_solari_count;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_solari'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_solari_count'
  ) THEN
    UPDATE playthrough_results
    SET endgame_solari_count = COALESCE(endgame_solari_count, final_resources_solari)
    WHERE endgame_solari_count IS NULL;
    ALTER TABLE playthrough_results DROP COLUMN final_resources_solari;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_water'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_water_count'
  ) THEN
    ALTER TABLE playthrough_results RENAME COLUMN final_resources_water TO endgame_water_count;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'final_resources_water'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'endgame_water_count'
  ) THEN
    UPDATE playthrough_results
    SET endgame_water_count = COALESCE(endgame_water_count, final_resources_water)
    WHERE endgame_water_count IS NULL;
    ALTER TABLE playthrough_results DROP COLUMN final_resources_water;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'cards_trashed'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'cards_trashed_count'
  ) THEN
    ALTER TABLE playthrough_results RENAME COLUMN cards_trashed TO cards_trashed_count;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'cards_trashed'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playthrough_results' AND column_name = 'cards_trashed_count'
  ) THEN
    UPDATE playthrough_results
    SET cards_trashed_count = COALESCE(cards_trashed_count, cards_trashed)
    WHERE cards_trashed_count IS NULL;
    ALTER TABLE playthrough_results DROP COLUMN cards_trashed;
  END IF;
END $$;

ALTER TABLE playthrough_results
  DROP COLUMN IF EXISTS final_resources_troops;

-- Cast score to numeric.
ALTER TABLE playthrough_results
  ALTER COLUMN score TYPE numeric USING NULLIF(score::text, '')::numeric;

ALTER TABLE playthrough_results
  ALTER COLUMN endgame_spice_count DROP DEFAULT,
  ALTER COLUMN endgame_solari_count DROP DEFAULT,
  ALTER COLUMN endgame_water_count DROP DEFAULT,
  ALTER COLUMN cards_trashed_count DROP DEFAULT;

-- Add advanced result fields.

ALTER TABLE playthrough_results
  ADD COLUMN IF NOT EXISTS turn_order_position integer,

  ADD COLUMN IF NOT EXISTS final_conflict_strength integer,
  ADD COLUMN IF NOT EXISTS final_conflict_place integer,
  ADD COLUMN IF NOT EXISTS final_conflict_garrison_troops integer,
  ADD COLUMN IF NOT EXISTS final_conflict_garrison_commanders integer,
  ADD COLUMN IF NOT EXISTS final_conflict_deployed_troops integer,
  ADD COLUMN IF NOT EXISTS final_conflict_deployed_commanders integer,
  ADD COLUMN IF NOT EXISTS final_conflict_deployed_sandworms integer,

  ADD COLUMN IF NOT EXISTS final_conflict_strength_sources_intrigue integer,
  ADD COLUMN IF NOT EXISTS final_conflict_strength_sources_unaccounted integer,
  ADD COLUMN IF NOT EXISTS final_conflict_strength_sources_commander_skills integer,
  ADD COLUMN IF NOT EXISTS final_conflict_strength_sources_imperium integer,
  ADD COLUMN IF NOT EXISTS final_conflict_strength_sources_tech integer,

  ADD COLUMN IF NOT EXISTS influence_emperor integer,
  ADD COLUMN IF NOT EXISTS influence_spacing_guild integer,
  ADD COLUMN IF NOT EXISTS influence_bene_gesserit integer,
  ADD COLUMN IF NOT EXISTS influence_fremen integer,

  ADD COLUMN IF NOT EXISTS has_alliance_emperor boolean,
  ADD COLUMN IF NOT EXISTS has_alliance_spacing_guild boolean,
  ADD COLUMN IF NOT EXISTS has_alliance_bene_gesserit boolean,
  ADD COLUMN IF NOT EXISTS has_alliance_fremen boolean,

  ADD COLUMN IF NOT EXISTS vp_sources_base numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vp_sources_factions numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_conflict_cards numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_battle_icon_matches numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_intrigue_cards numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_tech_tiles numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_final_conflict numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_spice_must_flow numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_imperium_cards numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_leader_abilities numeric,
  ADD COLUMN IF NOT EXISTS vp_sources_unaccounted numeric,
  ADD COLUMN IF NOT EXISTS final_round_vp_delta integer,

  ADD COLUMN IF NOT EXISTS conflict_cards_won_count integer,
  ADD COLUMN IF NOT EXISTS objective_card text,
  ADD COLUMN IF NOT EXISTS cards_trashed_count integer,
  ADD COLUMN IF NOT EXISTS final_deck_size integer,
  ADD COLUMN IF NOT EXISTS intrigue_cards_played integer,
  ADD COLUMN IF NOT EXISTS intrigue_cards_held_endgame integer,

  ADD COLUMN IF NOT EXISTS contracts_completed_count integer,
  ADD COLUMN IF NOT EXISTS contracts_held_incomplete integer,
  ADD COLUMN IF NOT EXISTS tech_tiles_count integer,
  ADD COLUMN IF NOT EXISTS control_marker_count integer,
  ADD COLUMN IF NOT EXISTS commander_skills_count integer,
  ADD COLUMN IF NOT EXISTS spies_on_board_endgame integer,
  ADD COLUMN IF NOT EXISTS has_high_council boolean,
  ADD COLUMN IF NOT EXISTS high_council_seat_position integer,
  ADD COLUMN IF NOT EXISTS has_swordmaster boolean,
  ADD COLUMN IF NOT EXISTS has_maker_hooks boolean,

  ADD COLUMN IF NOT EXISTS notes text;

-- Add High Council seat position and turn order constraints.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_results_high_council_seat_position'
  ) THEN
    ALTER TABLE playthrough_results
      ADD CONSTRAINT chk_playthrough_results_high_council_seat_position
      CHECK (
        high_council_seat_position IS NULL
        OR high_council_seat_position BETWEEN 1 AND 4
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_results_turn_order_position'
  ) THEN
    ALTER TABLE playthrough_results
      ADD CONSTRAINT chk_playthrough_results_turn_order_position
      CHECK (
        turn_order_position IS NULL
        OR turn_order_position BETWEEN 1 AND 6
      );
  END IF;
END $$;

-- Indexes.

CREATE INDEX IF NOT EXISTS idx_playthrough_results_score
  ON playthrough_results(score);

CREATE INDEX IF NOT EXISTS idx_playthrough_results_turn_order
  ON playthrough_results(turn_order_position);

CREATE INDEX IF NOT EXISTS idx_playthrough_results_leader
  ON playthrough_results(leader_id);

CREATE INDEX IF NOT EXISTS idx_playthrough_results_archetype
  ON playthrough_results(strategic_archetype_id);

CREATE INDEX IF NOT EXISTS idx_playthrough_results_final_conflict_strength
  ON playthrough_results(final_conflict_strength);

-- Recreate views.

CREATE VIEW leader_performance_stats AS
SELECT
  pr.leader_id,
  COALESCE(l.name, pr.leader_name) AS leader_name,
  l.faction AS leader_faction,
  p.group_id,
  COUNT(*)::integer AS games_played,
  COUNT(*) FILTER (WHERE pr.rank = 1)::integer AS wins,
  ROUND(
    (COUNT(*) FILTER (WHERE pr.rank = 1)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    1
  ) AS win_rate,
  ROUND(AVG(pr.rank)::numeric, 2) AS avg_rank,
  ROUND(AVG(pr.score)::numeric, 2) AS avg_score,
  MIN(pr.rank) AS best_rank,
  MAX(pr.score) AS best_score
FROM playthrough_results pr
JOIN playthroughs p ON p.id = pr.playthrough_id
LEFT JOIN leaders l ON l.id = pr.leader_id
WHERE COALESCE(l.name, pr.leader_name) IS NOT NULL
GROUP BY pr.leader_id, COALESCE(l.name, pr.leader_name), l.faction, p.group_id;

CREATE VIEW archetype_performance_stats AS
SELECT
  pr.strategic_archetype_id AS archetype_id,
  COALESCE(sa.name, pr.strategic_archetype_name) AS archetype_name,
  p.group_id,
  COUNT(*)::integer AS games_played,
  COUNT(*) FILTER (WHERE pr.rank = 1)::integer AS wins,
  ROUND(
    (COUNT(*) FILTER (WHERE pr.rank = 1)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    1
  ) AS win_rate,
  ROUND(AVG(pr.rank)::numeric, 2) AS avg_rank,
  ROUND(AVG(pr.score)::numeric, 2) AS avg_score,
  MIN(pr.rank) AS best_rank,
  MAX(pr.score) AS best_score
FROM playthrough_results pr
JOIN playthroughs p ON p.id = pr.playthrough_id
LEFT JOIN strategic_archetypes sa ON sa.id = pr.strategic_archetype_id
WHERE COALESCE(sa.name, pr.strategic_archetype_name) IS NOT NULL
GROUP BY pr.strategic_archetype_id, COALESCE(sa.name, pr.strategic_archetype_name), p.group_id;

CREATE VIEW player_signature_leaders AS
WITH player_leader_counts AS (
  SELECT
    pr.player_id,
    pr.player_name,
    p.group_id,
    pr.leader_id,
    COALESCE(l.name, pr.leader_name) AS leader_name,
    l.faction AS leader_faction,
    COUNT(*)::integer AS games_played,
    COUNT(*) FILTER (WHERE pr.rank = 1)::integer AS wins,
    ROUND(AVG(pr.rank)::numeric, 2) AS avg_rank,
    ROUND(AVG(pr.score)::numeric, 2) AS avg_score
  FROM playthrough_results pr
  JOIN playthroughs p ON p.id = pr.playthrough_id
  LEFT JOIN leaders l ON l.id = pr.leader_id
  WHERE COALESCE(l.name, pr.leader_name) IS NOT NULL
  GROUP BY
    pr.player_id,
    pr.player_name,
    p.group_id,
    pr.leader_id,
    COALESCE(l.name, pr.leader_name),
    l.faction
), ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY player_id, group_id
      ORDER BY games_played DESC, wins DESC, avg_score DESC, leader_name ASC
    ) AS signature_rank
  FROM player_leader_counts
)
SELECT *
FROM ranked
WHERE signature_rank = 1;

CREATE VIEW playthrough_detailed_stats AS
SELECT
  pr.id,
  pr.playthrough_id,
  p.game_id,
  p.group_id,
  p.season_id,
  p.timestamp,
  p.round_count,
  p.notes AS playthrough_notes,

  pr.player_id,
  pr.player_name,
  pr.rank,
  pr.turn_order_position,

  pr.leader_id,
  COALESCE(l.name, pr.leader_name) AS leader_name,
  l.faction AS leader_faction,

  pr.strategic_archetype_id,
  COALESCE(sa.name, pr.strategic_archetype_name) AS strategic_archetype_name,

  pr.score,
  pr.endgame_spice_count,
  pr.endgame_solari_count,
  pr.endgame_water_count,

  pr.final_conflict_strength,
  pr.final_conflict_place,
  pr.final_conflict_garrison_troops,
  pr.final_conflict_garrison_commanders,
  pr.final_conflict_deployed_troops,
  pr.final_conflict_deployed_commanders,
  pr.final_conflict_deployed_sandworms,
  pr.final_conflict_strength_sources_commander_skills,
  pr.final_conflict_strength_sources_intrigue,
  pr.final_conflict_strength_sources_imperium,
  pr.final_conflict_strength_sources_tech,
  pr.final_conflict_strength_sources_unaccounted,

  pr.influence_emperor,
  pr.influence_spacing_guild,
  pr.influence_bene_gesserit,
  pr.influence_fremen,
  pr.has_alliance_emperor,
  pr.has_alliance_spacing_guild,
  pr.has_alliance_bene_gesserit,
  pr.has_alliance_fremen,

  pr.vp_sources_base,
  pr.vp_sources_factions,
  pr.vp_sources_conflict_cards,
  pr.vp_sources_final_conflict,
  pr.vp_sources_battle_icon_matches,
  pr.vp_sources_spice_must_flow,
  pr.vp_sources_intrigue_cards,
  pr.vp_sources_tech_tiles,
  pr.vp_sources_imperium_cards,
  pr.vp_sources_leader_abilities,
  pr.vp_sources_unaccounted,
  pr.final_round_vp_delta,

  pr.cards_trashed_count,
  pr.final_deck_size,
  pr.intrigue_cards_played,
  pr.intrigue_cards_held_endgame,
  pr.conflict_cards_won_count,
  pr.objective_card,

  pr.contracts_completed_count,
  pr.contracts_held_incomplete,
  pr.tech_tiles_count,
  pr.control_marker_count,
  pr.commander_skills_count,
  pr.spies_on_board_endgame,
  pr.has_high_council,
  pr.high_council_seat_position,
  pr.has_swordmaster,
  pr.has_maker_hooks,

  pr.notes
FROM playthrough_results pr
JOIN playthroughs p ON p.id = pr.playthrough_id
LEFT JOIN leaders l ON l.id = pr.leader_id
LEFT JOIN strategic_archetypes sa ON sa.id = pr.strategic_archetype_id;

COMMIT;
