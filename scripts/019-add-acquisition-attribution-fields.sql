-- 019-add-acquisition-attribution-fields
--
-- Persists source attribution fields used by the Dune acquisition UI.
-- The original acquisition table stored only the item identity/count, which
-- meant VP and strength source selections could update totals but disappear
-- after reload.

BEGIN;

ALTER TABLE playthrough_result_acquisitions
  ADD COLUMN IF NOT EXISTS item_status TEXT,
  ADD COLUMN IF NOT EXISTS vp_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_source TEXT;

UPDATE playthrough_result_acquisitions
SET item_status = acquisition_method
WHERE item_status IS NULL
  AND acquisition_method IN ('not_set', 'in_final_deck', 'trashed', 'played', 'held', 'completed', 'won');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_item_status'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_item_status
      CHECK (
        item_status IS NULL OR item_status IN (
          'not_set',
          'in_final_deck',
          'trashed',
          'played',
          'held',
          'completed',
          'won'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_vp_count_nonnegative'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_vp_count_nonnegative
      CHECK (vp_count >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_strength_count_nonnegative'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_strength_count_nonnegative
      CHECK (strength_count >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_playthrough_result_acquisitions_entry_source'
  ) THEN
    ALTER TABLE playthrough_result_acquisitions
      ADD CONSTRAINT chk_playthrough_result_acquisitions_entry_source
      CHECK (
        entry_source IS NULL OR entry_source IN (
          'manual',
          'auto',
          'vp_source',
          'strength_source'
        )
      );
  END IF;
END $$;

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
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'sardaukar_skill'), 0) AS commander_skills_recorded,
  COALESCE(SUM(vp_count), 0) AS vp_sources_recorded,
  COALESCE(SUM(strength_count), 0) AS strength_sources_recorded
FROM playthrough_result_acquisitions
GROUP BY playthrough_id, playthrough_result_id, player_id;

COMMIT;
