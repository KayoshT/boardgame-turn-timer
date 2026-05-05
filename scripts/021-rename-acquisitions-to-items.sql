-- 021-rename-acquisitions-to-items
--
-- The tracked Dune item table now stores more than acquisitions: starter cards,
-- conflict cards won, Intrigues, Tech tiles, contracts, commander skills, and
-- source attribution. Rename the table to match that broader model while keeping
-- the old summary view name as a compatibility alias.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.playthrough_result_items') IS NULL
     AND to_regclass('public.playthrough_result_acquisitions') IS NOT NULL THEN
    ALTER TABLE public.playthrough_result_acquisitions RENAME TO playthrough_result_items;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.playthrough_result_items
  ADD COLUMN IF NOT EXISTS item_status TEXT,
  ADD COLUMN IF NOT EXISTS vp_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strength_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_source TEXT;

UPDATE public.playthrough_result_items
SET item_status = acquisition_method
WHERE item_status IS NULL
  AND acquisition_method IN ('not_set', 'in_final_deck', 'trashed', 'played', 'held', 'completed', 'won');

UPDATE public.playthrough_result_items SET vp_count = 0 WHERE vp_count IS NULL;
UPDATE public.playthrough_result_items SET strength_count = 0 WHERE strength_count IS NULL;

ALTER TABLE IF EXISTS public.playthrough_result_items
  ALTER COLUMN vp_count SET DEFAULT 0,
  ALTER COLUMN vp_count SET NOT NULL,
  ALTER COLUMN strength_count SET DEFAULT 0,
  ALTER COLUMN strength_count SET NOT NULL;

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_item_key_not_blank,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_item_key_not_blank,
  ADD CONSTRAINT chk_playthrough_result_items_item_key_not_blank
    CHECK (length(TRIM(BOTH FROM item_key)) > 0);

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_item_name_not_blank,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_item_name_not_blank,
  ADD CONSTRAINT chk_playthrough_result_items_item_name_not_blank
    CHECK (length(TRIM(BOTH FROM item_name)) > 0);

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_item_type,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_item_type,
  ADD CONSTRAINT chk_playthrough_result_items_item_type
    CHECK (item_type = ANY (ARRAY[
      'imperium_card'::text,
      'reserve_card'::text,
      'intrigue_card'::text,
      'tech_tile'::text,
      'sardaukar_skill'::text,
      'contract'::text,
      'conflict_card'::text,
      'navigation_card'::text,
      'starter_card'::text
    ]));

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_deck_id,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_deck_id,
  ADD CONSTRAINT chk_playthrough_result_items_deck_id
    CHECK (deck_id = ANY (ARRAY[
      'Imperium'::text,
      'Reserve'::text,
      'Intrigue'::text,
      'Tech'::text,
      'Sardaukar'::text,
      'Contracts'::text,
      'Conflict'::text,
      'Navigation'::text,
      'Starter'::text
    ]));

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_count_positive,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_count_positive,
  ADD CONSTRAINT chk_playthrough_result_items_count_positive
    CHECK (acquisition_count > 0);

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_item_status,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_item_status,
  ADD CONSTRAINT chk_playthrough_result_items_item_status
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

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_vp_count_nonnegative,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_vp_count_nonnegative,
  ADD CONSTRAINT chk_playthrough_result_items_vp_count_nonnegative
    CHECK (vp_count >= 0);

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_strength_count_nonnegative,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_strength_count_nonnegative,
  ADD CONSTRAINT chk_playthrough_result_items_strength_count_nonnegative
    CHECK (strength_count >= 0);

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_entry_source,
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_items_entry_source,
  ADD CONSTRAINT chk_playthrough_result_items_entry_source
    CHECK (
      entry_source IS NULL OR entry_source IN (
        'manual',
        'auto',
        'vp_source',
        'strength_source'
      )
    );

ALTER TABLE IF EXISTS public.playthrough_result_items
  DROP CONSTRAINT IF EXISTS uq_playthrough_result_acquisitions_result_item,
  DROP CONSTRAINT IF EXISTS uq_playthrough_result_items_result_item,
  ADD CONSTRAINT uq_playthrough_result_items_result_item
    UNIQUE (playthrough_result_id, item_key);

DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_playthrough_id;
DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_result_id;
DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_player_id;
DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_item_key;
DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_item_type;
DROP INDEX IF EXISTS public.idx_playthrough_result_acquisitions_deck_id;

CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_playthrough_id
  ON public.playthrough_result_items (playthrough_id);
CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_result_id
  ON public.playthrough_result_items (playthrough_result_id);
CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_player_id
  ON public.playthrough_result_items (player_id);
CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_item_key
  ON public.playthrough_result_items (item_key);
CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_item_type
  ON public.playthrough_result_items (item_type);
CREATE INDEX IF NOT EXISTS idx_playthrough_result_items_deck_id
  ON public.playthrough_result_items (deck_id);

CREATE OR REPLACE VIEW public.playthrough_result_item_summary AS
SELECT
  playthrough_id,
  playthrough_result_id,
  player_id,
  COUNT(*) AS distinct_items_tracked,
  COALESCE(SUM(acquisition_count), 0) AS total_items_tracked,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type IN ('imperium_card', 'reserve_card', 'starter_card')), 0) AS deck_cards_tracked,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'intrigue_card'), 0) AS intrigues_tracked,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'tech_tile'), 0) AS tech_tiles_tracked,
  COALESCE(SUM(acquisition_count) FILTER (WHERE item_type = 'sardaukar_skill'), 0) AS commander_skills_tracked,
  COALESCE(SUM(vp_count), 0) AS vp_sources_tracked,
  COALESCE(SUM(strength_count), 0) AS strength_sources_tracked
FROM public.playthrough_result_items
GROUP BY playthrough_id, playthrough_result_id, player_id;

CREATE OR REPLACE VIEW public.playthrough_result_acquisition_summary AS
SELECT
  playthrough_id,
  playthrough_result_id,
  player_id,
  distinct_items_tracked AS distinct_items_acquired,
  total_items_tracked AS total_items_acquired,
  deck_cards_tracked AS deck_cards_acquired,
  intrigues_tracked AS intrigue_cards_recorded,
  tech_tiles_tracked AS tech_tiles_recorded,
  commander_skills_tracked AS commander_skills_recorded,
  vp_sources_tracked AS vp_sources_recorded,
  strength_sources_tracked AS strength_sources_recorded
FROM public.playthrough_result_item_summary;

COMMENT ON TABLE public.playthrough_result_items IS
  'Per-player tracked Dune items for a playthrough result: starter/deck cards, conflicts, Intrigues, Tech, contracts, commander skills, navigation cards, and source attribution.';

COMMIT;
