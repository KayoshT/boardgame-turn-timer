-- 018-add-playthrough-result-acquisitions
--
-- Adds a generic child table for detailed Dune acquisition tracking.
-- This intentionally covers more than cards: Imperium/Reserve cards,
-- Intrigues, Tech tiles, Sardaukar Commander Skills, Contracts,
-- Conflict cards, and Navigation cards.

BEGIN;

CREATE TABLE IF NOT EXISTS playthrough_result_acquisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  playthrough_id UUID NOT NULL REFERENCES playthroughs(id) ON DELETE CASCADE,
  playthrough_result_id UUID NOT NULL REFERENCES playthrough_results(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,

  item_key TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  deck_id TEXT NOT NULL,
  source TEXT,

  acquisition_count INTEGER NOT NULL DEFAULT 1,
  acquisition_method TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_playthrough_result_acquisitions_count_positive
    CHECK (acquisition_count > 0),
  CONSTRAINT uq_playthrough_result_acquisitions_result_item
    UNIQUE (playthrough_result_id, item_key)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_item_key_not_blank'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_item_key_not_blank
      CHECK (length(trim(item_key)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_item_name_not_blank'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_item_name_not_blank
      CHECK (length(trim(item_name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_item_type'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_item_type
      CHECK (
        item_type IN (
          'imperium_card',
          'reserve_card',
          'intrigue_card',
          'tech_tile',
          'sardaukar_skill',
          'contract',
          'conflict_card',
          'navigation_card'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_deck_id'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_deck_id
      CHECK (
        deck_id IN (
          'Imperium',
          'Reserve',
          'Intrigue',
          'Tech',
          'Sardaukar',
          'Contracts',
          'Conflict',
          'Navigation'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_playthrough_id
  ON playthrough_result_acquisitions(playthrough_id);

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_result_id
  ON playthrough_result_acquisitions(playthrough_result_id);

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_player_id
  ON playthrough_result_acquisitions(player_id);

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_item_key
  ON playthrough_result_acquisitions(item_key);

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_item_type
  ON playthrough_result_acquisitions(item_type);

CREATE INDEX IF NOT EXISTS idx_playthrough_result_acquisitions_deck_id
  ON playthrough_result_acquisitions(deck_id);

CREATE OR REPLACE VIEW playthrough_result_acquisition_summary AS
SELECT
  playthrough_id,
  playthrough_result_id,
  player_id,
  COUNT(*) AS distinct_items_acquired,
  COALESCE(SUM(acquisition_count), 0) AS total_items_acquired,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type IN ('imperium_card', 'reserve_card')), 0) AS deck_cards_acquired,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'intrigue_card'), 0) AS intrigue_cards_recorded,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'tech_tile'), 0) AS tech_tiles_recorded,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'sardaukar_skill'), 0) AS commander_skills_recorded
FROM playthrough_result_acquisitions
GROUP BY playthrough_id, playthrough_result_id, player_id;

COMMIT;
