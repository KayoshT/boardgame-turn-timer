import { DUNE_ACQUISITION_OPTIONS_BY_KEY } from "@/lib/dune-acquisition-inventory";
import type {
  BattleIcon,
  PlaythroughResultAcquisitionInput,
} from "@/types/dune-acquisitions";

type StandardBattleIcon = Exclude<BattleIcon, "Wild">;

type BattleCounts = Record<BattleIcon, number>;

type BattleIconRequirement =
  | { kind: "icon"; icon: StandardBattleIcon; label: string; itemKey: string }
  | { kind: "grasp"; label: string; itemKey: string };

type BattleIconUnit = {
  id: string;
  itemKey: string;
  icon: BattleIcon;
  source: "conflict" | "objective";
};

export interface BattleIconItemUsage {
  forced?: number;
  intrigue?: number;
  wild?: number;
  remaining?: number;
}

export interface BattleIconIntrigueUsage {
  used?: number;
  unsupported?: number;
}

export interface BattleIconVpBreakdown {
  hasInputs: boolean;
  battleIconVp: number;
  forcedVp: number;
  endgameWildVp: number;
  iconIntrigueVp: number;
  unresolvedIntrigueVp: number;
  supportedIntrigueVpByItemKey: Record<string, number>;
  unresolvedIntrigueVpByItemKey: Record<string, number>;
  conflictUsageByItemKey: Record<string, BattleIconItemUsage>;
  intrigueUsageByItemKey: Record<string, BattleIconIntrigueUsage>;
  hasOrnithopterFleet: boolean;
  remainingConflictIcons: BattleCounts;
  notes: string[];
}

interface BattleIconResultLike {
  objectiveCard?: string | null;
  objective_card?: string | null;
  acquisitions?: PlaythroughResultAcquisitionInput[] | null;
}

const EMPTY_COUNTS: BattleCounts = {
  Crysknife: 0,
  "Desert Mouse": 0,
  Ornithopter: 0,
  Wild: 0,
};

const STANDARD_ICONS: StandardBattleIcon[] = [
  "Crysknife",
  "Desert Mouse",
  "Ornithopter",
];

function cloneCounts(counts: BattleCounts): BattleCounts {
  return { ...counts };
}

function countOf(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 1;
  return Math.max(1, Math.trunc(number));
}

function positiveCount(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.trunc(number);
}

function acquisitionStatus(
  item: PlaythroughResultAcquisitionInput,
): string | undefined {
  return (
    item.itemStatus ??
    item.item_status ??
    item.acquisitionMethod ??
    item.acquisition_method ??
    undefined
  );
}

function isTrashed(item: PlaythroughResultAcquisitionInput): boolean {
  return acquisitionStatus(item) === "trashed";
}

function isOrnithopterFleet(item: PlaythroughResultAcquisitionInput): boolean {
  return (
    item.itemType === "tech_tile" &&
    /ornithopter\s+fleet/i.test(item.itemName) &&
    !isTrashed(item)
  );
}

function objectiveBattleIcon(value: unknown): StandardBattleIcon | null {
  const text = String(value ?? "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
  if (!text) return null;
  if (text.includes("crysknife")) return "Crysknife";
  if (text.includes("desert mouse")) return "Desert Mouse";
  if (text.includes("ornithopter")) return "Ornithopter";
  return null;
}

function objectiveUnit(icon: StandardBattleIcon | null): BattleIconUnit | null {
  if (!icon) return null;
  return {
    id: `objective:${icon}`,
    itemKey: "__objective__",
    icon,
    source: "objective",
  };
}

function getCatalogBattleIcon(
  item: PlaythroughResultAcquisitionInput,
): BattleIcon | null {
  const option = DUNE_ACQUISITION_OPTIONS_BY_KEY.get(item.itemKey);
  return option?.battleIcon ?? null;
}

function getConflictUnits(
  acquisitions: PlaythroughResultAcquisitionInput[] = [],
): BattleIconUnit[] {
  const units: BattleIconUnit[] = [];

  for (const item of acquisitions) {
    if (item.itemType !== "conflict_card") continue;
    if (acquisitionStatus(item) && acquisitionStatus(item) !== "won") continue;

    const icon = getCatalogBattleIcon(item);
    if (!icon) continue;

    const count = countOf(item.acquisitionCount);
    for (let index = 0; index < count; index += 1) {
      units.push({
        id: `${item.itemKey}#${index}`,
        itemKey: item.itemKey,
        icon,
        source: "conflict",
      });
    }
  }

  return units;
}

function countsFromUnits(units: BattleIconUnit[]): BattleCounts {
  const counts = cloneCounts(EMPTY_COUNTS);
  for (const unit of units) counts[unit.icon] += 1;
  return counts;
}

function getBattleIconRequirements(
  acquisitions: PlaythroughResultAcquisitionInput[] = [],
  hasOrnithopterFleet: boolean,
): BattleIconRequirement[] {
  const requirements: BattleIconRequirement[] = [];

  for (const item of acquisitions) {
    if (item.itemType !== "intrigue_card") continue;

    const vpCount = positiveCount(item.vpCount ?? item.vp_count);
    if (vpCount <= 0) continue;

    const name = item.itemName.trim().toLowerCase();
    let requirement: BattleIconRequirement | null = null;

    if (name === "grasp arrakis") {
      requirement = {
        kind: "grasp",
        label: item.itemName,
        itemKey: item.itemKey,
      };
    } else if (name === "crysknife") {
      if (!hasOrnithopterFleet) {
        requirement = {
          kind: "icon",
          icon: "Crysknife",
          label: item.itemName,
          itemKey: item.itemKey,
        };
      }
    } else if (name === "desert mouse") {
      if (!hasOrnithopterFleet) {
        requirement = {
          kind: "icon",
          icon: "Desert Mouse",
          label: item.itemName,
          itemKey: item.itemKey,
        };
      }
    } else if (name === "ornithopter") {
      requirement = {
        kind: "icon",
        icon: "Ornithopter",
        label: item.itemName,
        itemKey: item.itemKey,
      };
    }

    if (!requirement) continue;
    for (let index = 0; index < vpCount; index += 1) {
      requirements.push(requirement);
    }
  }

  return requirements;
}

function incrementRecord(
  record: Record<string, number>,
  key: string,
  amount = 1,
): Record<string, number> {
  return { ...record, [key]: (record[key] ?? 0) + amount };
}

function incrementUsage(
  record: Record<string, BattleIconItemUsage>,
  key: string,
  field: keyof BattleIconItemUsage,
  amount = 1,
): Record<string, BattleIconItemUsage> {
  if (key === "__objective__") return record;

  const current = record[key] ?? {};
  return {
    ...record,
    [key]: {
      ...current,
      [field]: (current[field] ?? 0) + amount,
    },
  };
}

function incrementUsageForUnit(
  record: Record<string, BattleIconItemUsage>,
  unit: BattleIconUnit,
  field: keyof BattleIconItemUsage,
  amount = 1,
): Record<string, BattleIconItemUsage> {
  if (unit.source !== "conflict") return record;
  return incrementUsage(record, unit.itemKey, field, amount);
}

function mergeUsage(
  left: Record<string, BattleIconItemUsage>,
  right: Record<string, BattleIconItemUsage>,
): Record<string, BattleIconItemUsage> {
  let merged = { ...left };
  for (const [key, usage] of Object.entries(right)) {
    for (const [field, amount] of Object.entries(usage) as Array<[keyof BattleIconItemUsage, number]>) {
      if (amount > 0) merged = incrementUsage(merged, key, field, amount);
    }
  }
  return merged;
}

function removeUnit(units: BattleIconUnit[], id: string): BattleIconUnit[] {
  return units.filter((unit) => unit.id !== id);
}

function removeUnits(units: BattleIconUnit[], ids: string[]): BattleIconUnit[] {
  const removeIds = new Set(ids);
  return units.filter((unit) => !removeIds.has(unit.id));
}

function sortUnits(units: BattleIconUnit[]): BattleIconUnit[] {
  return [...units].sort((left, right) => left.id.localeCompare(right.id));
}

function forceStandardMatches(
  conflictUnits: BattleIconUnit[],
  objectiveIcon: StandardBattleIcon | null,
): { forcedVp: number; remainingUnits: BattleIconUnit[]; conflictUsageByItemKey: Record<string, BattleIconItemUsage> } {
  let remainingUnits: BattleIconUnit[] = [];
  let forcedVp = 0;
  let usage: Record<string, BattleIconItemUsage> = {};

  for (const icon of STANDARD_ICONS) {
    const unitsForIcon = sortUnits(conflictUnits.filter((unit) => unit.icon === icon));
    const hasObjective = objectiveIcon === icon;

    if (hasObjective && unitsForIcon.length === 0) {
      const unit = objectiveUnit(icon);
      if (unit) remainingUnits.push(unit);
      continue;
    }

    let unitsAvailableForSameIconPairing = unitsForIcon;

    if (hasObjective && unitsForIcon.length > 0) {
      forcedVp += 1;
      usage = incrementUsageForUnit(usage, unitsForIcon[0], "forced");
      unitsAvailableForSameIconPairing = unitsForIcon.slice(1);
    }

    const pairCount = Math.floor(unitsAvailableForSameIconPairing.length / 2);
    forcedVp += pairCount;

    const kept = unitsAvailableForSameIconPairing.length % 2 === 1
      ? unitsAvailableForSameIconPairing.slice(-1)
      : [];
    const consumed = unitsAvailableForSameIconPairing.slice(
      0,
      unitsAvailableForSameIconPairing.length - kept.length,
    );

    remainingUnits.push(...kept);
    for (const unit of consumed) usage = incrementUsageForUnit(usage, unit, "forced");
  }

  remainingUnits.push(...conflictUnits.filter((unit) => unit.icon === "Wild"));

  return { forcedVp, remainingUnits, conflictUsageByItemKey: usage };
}

function forceOrnithopterFleetMatches(
  conflictUnits: BattleIconUnit[],
  objectiveIcon: StandardBattleIcon | null,
): { forcedVp: number; remainingUnits: BattleIconUnit[]; conflictUsageByItemKey: Record<string, BattleIconItemUsage> } {
  const sortedUnits = sortUnits(conflictUnits).map((unit) => ({ ...unit, icon: "Ornithopter" as const }));
  let remainingConflictUnits = sortedUnits;
  let forcedVp = 0;
  let usage: Record<string, BattleIconItemUsage> = {};

  if (objectiveIcon) {
    if (remainingConflictUnits.length === 0) {
      const unit = objectiveUnit("Ornithopter");
      return {
        forcedVp: 0,
        remainingUnits: unit ? [unit] : [],
        conflictUsageByItemKey: usage,
      };
    }

    forcedVp += 1;
    usage = incrementUsageForUnit(usage, remainingConflictUnits[0], "forced");
    remainingConflictUnits = remainingConflictUnits.slice(1);
  }

  const pairCount = Math.floor(remainingConflictUnits.length / 2);
  forcedVp += pairCount;

  const kept = remainingConflictUnits.length % 2 === 1 ? remainingConflictUnits.slice(-1) : [];
  const consumed = remainingConflictUnits.slice(0, remainingConflictUnits.length - kept.length);
  for (const unit of consumed) usage = incrementUsageForUnit(usage, unit, "forced");

  return { forcedVp, remainingUnits: kept, conflictUsageByItemKey: usage };
}

type WildMatchResult = {
  wildVp: number;
  conflictUsageByItemKey: Record<string, BattleIconItemUsage>;
};

function scoreWildEndgameMatches(units: BattleIconUnit[]): WildMatchResult {
  const wilds = sortUnits(units.filter((unit) => unit.icon === "Wild"));
  const standards = sortUnits(units.filter((unit) => unit.icon !== "Wild"));
  let usage: Record<string, BattleIconItemUsage> = {};
  let wildVp = 0;
  let wildIndex = 0;
  let standardIndex = 0;

  while (wildIndex < wilds.length && standardIndex < standards.length) {
    usage = incrementUsageForUnit(usage, wilds[wildIndex], "wild");
    usage = incrementUsageForUnit(usage, standards[standardIndex], "wild");
    wildVp += 1;
    wildIndex += 1;
    standardIndex += 1;
  }

  while (wildIndex + 1 < wilds.length) {
    usage = incrementUsageForUnit(usage, wilds[wildIndex], "wild");
    usage = incrementUsageForUnit(usage, wilds[wildIndex + 1], "wild");
    wildVp += 1;
    wildIndex += 2;
  }

  return { wildVp, conflictUsageByItemKey: usage };
}

function candidateUnitsForIcon(units: BattleIconUnit[], icon: StandardBattleIcon): BattleIconUnit[] {
  return sortUnits(
    units.filter((unit) => unit.source === "conflict" && (unit.icon === icon || unit.icon === "Wild")),
  );
}

function candidatePairs(units: BattleIconUnit[]): Array<[BattleIconUnit, BattleIconUnit]> {
  const sorted = sortUnits(units.filter((unit) => unit.source === "conflict"));
  const pairs: Array<[BattleIconUnit, BattleIconUnit]> = [];

  for (let leftIndex = 0; leftIndex < sorted.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sorted.length; rightIndex += 1) {
      pairs.push([sorted[leftIndex], sorted[rightIndex]]);
    }
  }

  return pairs;
}

type EndgameOptimisationResult = {
  wildVp: number;
  supportedIntrigueVp: number;
  unresolvedIntrigueVp: number;
  supportedIntrigueVpByItemKey: Record<string, number>;
  unresolvedIntrigueVpByItemKey: Record<string, number>;
  conflictUsageByItemKey: Record<string, BattleIconItemUsage>;
};

function optimiseEndgame(
  requirements: BattleIconRequirement[],
  units: BattleIconUnit[],
): EndgameOptimisationResult {
  const memo = new Map<string, EndgameOptimisationResult>();

  const keyFor = (index: number, current: BattleIconUnit[]) =>
    [index, sortUnits(current).map((unit) => unit.id).join(",")].join("|");

  const totalVp = (result: EndgameOptimisationResult) =>
    result.wildVp + result.supportedIntrigueVp;

  const better = (
    left: EndgameOptimisationResult,
    right: EndgameOptimisationResult,
  ) => {
    const leftTotal = totalVp(left);
    const rightTotal = totalVp(right);
    if (leftTotal !== rightTotal) return leftTotal > rightTotal ? left : right;
    if (left.unresolvedIntrigueVp !== right.unresolvedIntrigueVp) {
      return left.unresolvedIntrigueVp < right.unresolvedIntrigueVp
        ? left
        : right;
    }
    if (left.supportedIntrigueVp !== right.supportedIntrigueVp) {
      return left.supportedIntrigueVp > right.supportedIntrigueVp ? left : right;
    }
    return left.wildVp >= right.wildVp ? left : right;
  };

  const search = (
    index: number,
    current: BattleIconUnit[],
  ): EndgameOptimisationResult => {
    if (index >= requirements.length) {
      const wild = scoreWildEndgameMatches(current);
      return {
        wildVp: wild.wildVp,
        supportedIntrigueVp: 0,
        unresolvedIntrigueVp: 0,
        supportedIntrigueVpByItemKey: {},
        unresolvedIntrigueVpByItemKey: {},
        conflictUsageByItemKey: wild.conflictUsageByItemKey,
      };
    }

    const cacheKey = keyFor(index, current);
    const cached = memo.get(cacheKey);
    if (cached) return cached;

    const requirement = requirements[index];
    let best: EndgameOptimisationResult | null = null;

    if (requirement.kind === "icon") {
      for (const unit of candidateUnitsForIcon(current, requirement.icon)) {
        const result = search(index + 1, removeUnit(current, unit.id));
        const supported = {
          ...result,
          supportedIntrigueVp: result.supportedIntrigueVp + 1,
          supportedIntrigueVpByItemKey: incrementRecord(
            result.supportedIntrigueVpByItemKey,
            requirement.itemKey,
          ),
          conflictUsageByItemKey: incrementUsageForUnit(result.conflictUsageByItemKey, unit, "intrigue"),
        };
        best = best ? better(best, supported) : supported;
      }
    } else {
      for (const [left, right] of candidatePairs(current)) {
        const result = search(index + 1, removeUnits(current, [left.id, right.id]));
        const supported = {
          ...result,
          supportedIntrigueVp: result.supportedIntrigueVp + 1,
          supportedIntrigueVpByItemKey: incrementRecord(
            result.supportedIntrigueVpByItemKey,
            requirement.itemKey,
          ),
          conflictUsageByItemKey: incrementUsageForUnit(
            incrementUsageForUnit(result.conflictUsageByItemKey, left, "intrigue"),
            right,
            "intrigue",
          ),
        };
        best = best ? better(best, supported) : supported;
      }
    }

    const skipped = search(index + 1, current);
    const unresolved = {
      ...skipped,
      unresolvedIntrigueVp: skipped.unresolvedIntrigueVp + 1,
      unresolvedIntrigueVpByItemKey: incrementRecord(
        skipped.unresolvedIntrigueVpByItemKey,
        requirement.itemKey,
      ),
    };
    best = best ? better(best, unresolved) : unresolved;

    memo.set(cacheKey, best);
    return best;
  };

  return search(0, units);
}

function markRemainingUnits(
  units: BattleIconUnit[],
  usage: Record<string, BattleIconItemUsage>,
): Record<string, BattleIconItemUsage> {
  let next = { ...usage };
  const unitCounts: Record<string, number> = {};

  for (const unit of units) {
    if (unit.source !== "conflict") continue;
    unitCounts[unit.itemKey] = (unitCounts[unit.itemKey] ?? 0) + 1;
  }

  for (const [itemKey, total] of Object.entries(unitCounts)) {
    const existing = next[itemKey] ?? {};
    const used = (existing.intrigue ?? 0) + (existing.wild ?? 0);
    const remaining = Math.max(0, total - used);

    if (remaining > 0) {
      next = {
        ...next,
        [itemKey]: {
          ...existing,
          remaining,
        },
      };
    }
  }

  return next;
}

function buildIntrigueUsage(
  supported: Record<string, number>,
  unresolved: Record<string, number>,
): Record<string, BattleIconIntrigueUsage> {
  const keys = new Set([...Object.keys(supported), ...Object.keys(unresolved)]);
  const result: Record<string, BattleIconIntrigueUsage> = {};
  for (const key of keys) {
    result[key] = {
      used: supported[key] ?? 0,
      unsupported: unresolved[key] ?? 0,
    };
  }
  return result;
}

export function calculateBattleIconVpForResult(
  result: BattleIconResultLike,
): BattleIconVpBreakdown {
  const acquisitions = result.acquisitions ?? [];
  const conflictUnits = getConflictUnits(acquisitions);
  const objectiveIcon = objectiveBattleIcon(
    result.objectiveCard ?? result.objective_card,
  );
  const hasOrnithopterFleet = acquisitions.some(isOrnithopterFleet);
  const hasConflictIcons = conflictUnits.length > 0;
  const requirements = getBattleIconRequirements(
    acquisitions,
    hasOrnithopterFleet,
  );

  const forced = hasOrnithopterFleet
    ? forceOrnithopterFleetMatches(conflictUnits, objectiveIcon)
    : forceStandardMatches(conflictUnits, objectiveIcon);

  const endgame = optimiseEndgame(requirements, forced.remainingUnits);
  const notes: string[] = [];
  const combinedUsage = markRemainingUnits(
    forced.remainingUnits,
    mergeUsage(forced.conflictUsageByItemKey, endgame.conflictUsageByItemKey),
  );

  if (hasOrnithopterFleet) {
    notes.push("Ornithopter Fleet treats every battle icon as Ornithopter.");
  }

  if (endgame.unresolvedIntrigueVp > 0) {
    notes.push(
      `${endgame.unresolvedIntrigueVp} selected battle-icon Intrigue VP cannot be supported by the entered face-up Conflict cards.`,
    );
  }

  return {
    hasInputs:
      hasConflictIcons ||
      Boolean(objectiveIcon) ||
      requirements.length > 0 ||
      hasOrnithopterFleet,
    battleIconVp: forced.forcedVp + endgame.wildVp,
    forcedVp: forced.forcedVp,
    endgameWildVp: endgame.wildVp,
    iconIntrigueVp: endgame.supportedIntrigueVp,
    unresolvedIntrigueVp: endgame.unresolvedIntrigueVp,
    supportedIntrigueVpByItemKey: endgame.supportedIntrigueVpByItemKey,
    unresolvedIntrigueVpByItemKey: endgame.unresolvedIntrigueVpByItemKey,
    conflictUsageByItemKey: combinedUsage,
    intrigueUsageByItemKey: buildIntrigueUsage(
      endgame.supportedIntrigueVpByItemKey,
      endgame.unresolvedIntrigueVpByItemKey,
    ),
    hasOrnithopterFleet,
    remainingConflictIcons: countsFromUnits(forced.remainingUnits.filter((unit) => unit.source === "conflict")),
    notes,
  };
}
