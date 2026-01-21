BEGIN;

/* * 1. Staging
 * Define the authoritative master list and correction mappings.
 */
CREATE TEMP TABLE master_leaders (name text, faction text);
CREATE TEMP TABLE leader_fixes (old_name text, old_faction text, new_name text, new_faction text);

INSERT INTO master_leaders (name, faction) VALUES
                                               ('Duke Leto Atreides', 'House Atreides'), ('Paul Atreides', 'House Atreides'),
                                               ('Muad''Dib', 'House Atreides'), ('Gurney Halleck', 'House Atreides'),
                                               ('Lady Jessica', 'House Atreides'), ('Duncan Idaho', 'House Atreides'),
                                               ('Shaddam Corrino IV', 'House Corrino'), ('Princess Irulan', 'House Corrino'),
                                               ('Archduke Armand Ecaz', 'House Ecaz'), ('Ilesa Ecaz', 'House Ecaz'),
                                               ('Lady Margot Fenring', 'House Fenring'), ('Count Hasimir Fenring', 'House Fenring'),
                                               ('Baron Vladimir Harkonnen', 'House Harkonnen'), ('Glossu “The Beast” Rabban', 'House Harkonnen'),
                                               ('Feyd-Rautha Harkonnen', 'House Harkonnen'), ('Piter de Vries', 'House Harkonnen'),
                                               ('Lady Amber Metulli', 'House Metulli'),
                                               ('Princess Yuna Moritani', 'House Moritani'), ('Viscount Hundro Moritani', 'House Moritani'),
                                               ('Helena Richese', 'House Richese'), ('Count Ilban Richese', 'House Richese'),
                                               ('Countess Ariana Thorvald', 'House Thorvald'), ('Earl Memnon Thorvald', 'House Thorvald'),
                                               ('Tessia Vernius', 'House Vernius'), ('Prince Rhombur Vernius', 'House Vernius'),
                                               ('Gaius Helen Mohiam', 'Bene Gesserit'),
                                               ('Chani', 'Fremen'), ('Liet Kynes', 'Fremen'),
                                               ('Kota Odax of Ix', 'Ixian'),
                                               ('Staban Tuek', 'Smugglers'), ('Esmar Tuek', 'Smugglers'),
                                               ('Steersman Y''rkoon', 'Spacing Guild');

INSERT INTO leader_fixes VALUES
                             -- Standard corrections
                             ('Margot Fenring', 'Bene Gesserit', 'Lady Margot Fenring', 'House Fenring'),
                             ('Emperor Shaddam IV', 'Emperor', 'Shaddam Corrino IV', 'House Corrino'),
                             ('Lord Yuna Corrino', 'House Corrino', 'Princess Yuna Moritani', 'House Moritani'),
                             ('Amber Metelli', 'House Metelli', 'Lady Amber Metulli', 'House Metulli'),
                             ('Archduke Armand Thorvald', 'House Thorvald', 'Archduke Armand Ecaz', 'House Ecaz'),
                             ('Count Hasimir Fenring', 'Emperor', 'Count Hasimir Fenring', 'House Fenring'),
                             ('Glossu "Beast" Rabban', 'House Harkonnen', 'Glossu “The Beast” Rabban', 'House Harkonnen'),
                             -- Merge targets
                             ('Piter', 'House Harkonnen', 'Piter de Vries', 'House Harkonnen'),
                             ('Piter De Vries', 'House Harkonnen', 'Piter de Vries', 'House Harkonnen');

/*
 * 2. Deduplication and merge
 * Handles cases where renaming a leader would violate a unique constraint.
 * Moves historical data from the old ID to the new ID, then removes the old record.
 */
DO $$
    DECLARE
        fix RECORD;
        target_id UUID;
        source_id UUID;
    BEGIN
        FOR fix IN SELECT * FROM leader_fixes LOOP
                -- Check if the target (correct) leader already exists
                SELECT id INTO target_id FROM leaders
                WHERE name = fix.new_name AND faction = fix.new_faction;

                -- Check if the source (incorrect) leader exists
                SELECT id INTO source_id FROM leaders
                WHERE name = fix.old_name AND faction = fix.old_faction;

                -- Conflict resolution: If both exist, merge them
                IF target_id IS NOT NULL AND source_id IS NOT NULL AND target_id != source_id THEN
                    -- Reassign match history
                    -- UPDATE "playthrough_results" SET leader_id = target_id WHERE leader_id = source_id;

                    -- Delete the now-redundant source leader
                    DELETE FROM leaders WHERE id = source_id;

                    -- Standard update: If only source exists, simply rename it
                ELSIF source_id IS NOT NULL AND target_id IS NULL THEN
                    UPDATE leaders SET name = fix.new_name, faction = fix.new_faction WHERE id = source_id;
                END IF;
            END LOOP;
    END $$;

/*
 * 3. Faction alignment
 * Ensures leaders have the correct faction as per the master list.
 */
UPDATE leaders l
SET faction = m.faction
FROM master_leaders m
WHERE l.name = m.name AND l.faction != m.faction;

/*
 * 4. Insert missing records
 * Adds any canonical leaders that do not currently exist.
 */
INSERT INTO leaders (name, faction)
SELECT m.name, m.faction
FROM master_leaders m
WHERE NOT EXISTS (SELECT 1 FROM leaders l WHERE l.name = m.name AND l.faction = m.faction);

/*
 * 5. Cleanup
 * Removes unauthorised records not present in the master list.
 */
DELETE FROM leaders l
WHERE NOT EXISTS (
    SELECT 1 FROM master_leaders m WHERE m.name = l.name AND m.faction = l.faction
);

COMMIT;

-- Verification
SELECT faction, name FROM leaders ORDER BY faction, name;