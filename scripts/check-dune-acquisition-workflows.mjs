#!/usr/bin/env node

import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const repoRoot = process.cwd()
const buildDir = join(repoRoot, ".tmp-dune-acquisition-workflow-tests")

rmSync(buildDir, { recursive: true, force: true })
mkdirSync(buildDir, { recursive: true })

function transpile(sourcePath, outputName, replacements = []) {
  let source = readFileSync(join(repoRoot, sourcePath), "utf8")
  for (const [from, to] of replacements) source = source.replaceAll(from, to)

  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
      skipLibCheck: true,
    },
  })

  writeFileSync(join(buildDir, outputName), result.outputText)
}

transpile("lib/dune-acquisition-inventory.ts", "dune-acquisition-inventory.js", [
  ["@/data/dune_inventory.json", "./dune_inventory.json"],
  ["@/types/dune-acquisitions", "./types-dune-acquisitions"],
])
writeFileSync(join(buildDir, "types-dune-acquisitions.js"), `module.exports = {\n  DUNE_ACQUISITION_DECK_IDS: ["Imperium", "Reserve", "Intrigue", "Tech", "Sardaukar", "Contracts", "Conflict", "Navigation", "Starter"],\n  ACQUISITION_ITEM_TYPES: ["imperium_card", "reserve_card", "intrigue_card", "tech_tile", "sardaukar_skill", "contract", "conflict_card", "navigation_card", "starter_card"],\n}\n`)
copyFileSync(join(repoRoot, "data/dune_inventory.json"), join(buildDir, "dune_inventory.json"))

const { DUNE_ACQUISITION_OPTIONS } = require(join(buildDir, "dune-acquisition-inventory.js"))
const editorSource = readFileSync(join(repoRoot, "components/leaderboard/acquisitions-editor.tsx"), "utf8")
const addFormSource = readFileSync(join(repoRoot, "components/leaderboard/enhanced-add-playthrough-form.tsx"), "utf8")
const editFormSource = readFileSync(join(repoRoot, "components/leaderboard/edit-playthrough-form.tsx"), "utf8")
const typeSource = readFileSync(join(repoRoot, "types/dune-acquisitions.ts"), "utf8")

const starterOptions = DUNE_ACQUISITION_OPTIONS.filter((option) => option.itemType === "starter_card")
assert.ok(starterOptions.length >= 7, "Starter deck options should be loaded from the inventory")
assert.ok(starterOptions.some((option) => /signet\s*ring/i.test(option.itemName)), "Starter deck should include Signet Ring")
assert.ok(starterOptions.some((option) => /diplomacy/i.test(option.itemName)), "Starter deck should include Diplomacy")
assert.equal(
  starterOptions.reduce((total, option) => total + (option.copyCount ?? 1), 0),
  10,
  "Default starter deck should contain 10 cards per player",
)

assert.match(typeSource, /"starter_card"/, "starter_card must be a supported acquisition item type")
assert.match(typeSource, /"Starter"/, "Starter must be a supported acquisition deck id")

assert.match(editorSource, /const existing = normalisedValue\.find\(\(item\) => item\.itemKey === option\.itemKey\)/, "Picker should see preserved zero-VP or zero-STR rows so they can be reactivated")
assert.match(editorSource, /isSourceReactivation/, "Picker should distinguish source reactivation from copy-limit exhaustion")
assert.match(editorSource, /isSourceReactivation \? "Use"/, "Reactivating an existing source should show Use rather than Full")
assert.match(editorSource, /vpOnly\) \{\n\s+emitSectionChange\(selected\.map\(\(item\) => \(\{ \.\.\.item, vpCount: 0, entrySource: "manual" \}\)\)\)/, "Clearing VP sources should zero attribution while preserving acquired cards")
assert.match(editorSource, /strengthOnly\) \{\n\s+emitSectionChange\(selected\.map\(\(item\) => \(\{ \.\.\.item, strengthCount: 0, entrySource: "manual" \}\)\)\)/, "Clearing strength sources should zero attribution while preserving acquired cards")

for (const [name, source] of [["add form", addFormSource], ["edit form", editFormSource]]) {
  assert.match(source, /withStarterDeckDefaults/, `${name}: starter deck defaults should be wired`)
  assert.match(source, /isSteersmanLeader\(result\) && \/signet\\s\*ring\/i/, `${name}: Steersman Y'rkoon should omit Signet Ring`)
  assert.match(source, /isStabanLeader\(result\) && \/diplomacy\/i/, `${name}: Staban Tuek should omit Diplomacy`)
  assert.match(source, /allowedItemTypes=\{\["imperium_card", "reserve_card", "starter_card"\]\}/, `${name}: deck pickers should include starter cards`)
}

rmSync(buildDir, { recursive: true, force: true })
console.log("✓ Dune acquisition workflow checks passed")
