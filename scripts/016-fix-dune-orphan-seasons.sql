-- Relink active season 3 to the correct game_id
UPDATE seasons
SET game_id = '11b45ecc-9487-4003-bb3f-01142f370afc'
WHERE status = 'active'
  AND game_id IS NULL
  AND season_number = 3;

-- Delete orphaned active season 1 entries created by the fallback logic
-- to prevent unique constraint violations on game_id and season_number
DELETE FROM seasons
WHERE status = 'active'
  AND game_id IS NULL
  AND season_number = 1;

-- Verify the current active season for the game
SELECT id, game_id, season_number, status
FROM seasons
WHERE game_id = '11b45ecc-9487-4003-bb3f-01142f370afc'
  AND status = 'active';