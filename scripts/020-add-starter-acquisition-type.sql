-- Add starter-deck acquisitions to the generic acquisition table.
-- Safe to run more than once.

ALTER TABLE playthrough_result_acquisitions
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_item_type;

ALTER TABLE playthrough_result_acquisitions
  ADD CONSTRAINT chk_playthrough_result_acquisitions_item_type
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

ALTER TABLE playthrough_result_acquisitions
  DROP CONSTRAINT IF EXISTS chk_playthrough_result_acquisitions_deck_id;

ALTER TABLE playthrough_result_acquisitions
  ADD CONSTRAINT chk_playthrough_result_acquisitions_deck_id
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
