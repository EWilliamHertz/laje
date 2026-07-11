// ── Item Tiers, Loot Tables & Enemy Matrix ───────────────────────────────

export const TIERS = {
  Common:    { color: '#94a3b8', mult: 1.0, glow: 0.15 },
  Rare:      { color: '#3b82f6', mult: 1.6, glow: 0.4 },
  Epic:      { color: '#a855f7', mult: 2.4, glow: 0.7 },
  Legendary: { color: '#f59e0b', mult: 3.5, glow: 1.0 }
}
export const TIER_ORDER = ['Common', 'Rare', 'Epic', 'Legendary']

// Weapon archetypes. `model` drives the 3D mesh attached to the character's hand.
export const WEAPON_ARCHETYPES = [
  { key: 'sword',   name: 'Plasma Blade',   model: 'sword' },
  { key: 'greatsword', name: 'Fusion Greatsword', model: 'greatsword' },
  { key: 'daggers', name: 'Mono-Daggers',   model: 'daggers' },
  { key: 'orb',     name: 'Aether Orb',     model: 'orb' },
  { key: 'staff',   name: 'Ley Staff',      model: 'staff' },
  { key: 'cannon',  name: 'Arc Cannon',     model: 'cannon' }
]

export const ARMOR_ARCHETYPES = [
  { key: 'nanoweave', name: 'Nanoweave Suit' },
  { key: 'exo',       name: 'Exo-Plate Harness' },
  { key: 'aegis',     name: 'Aegis Field Vest' },
  { key: 'stealth',   name: 'Ghostmesh Shroud' }
]

const PREFIXES = ['Scavenged', 'Calibrated', 'Vector', 'Quantum', 'Aether-Forged', 'Void-Touched', 'Singularity']

let itemCounter = 0
export function makeItem(slot, tierName, itemLevel, archetypeKey) {
  const tier = TIERS[tierName]
  const pool = slot === 'weapon' ? WEAPON_ARCHETYPES : ARMOR_ARCHETYPES
  const arch = pool.find(a => a.key === archetypeKey) || pool[Math.floor(Math.random() * pool.length)]
  const basePower = slot === 'weapon' ? 6 + itemLevel * 2 : 10 + itemLevel * 3
  const power = Math.floor(basePower * tier.mult * (0.9 + Math.random() * 0.2))
  const prefix = PREFIXES[Math.min(PREFIXES.length - 1, Math.floor(Math.random() * (TIER_ORDER.indexOf(tierName) + 2)))]
  return {
    id: `item_${Date.now()}_${itemCounter++}`,
    slot,
    name: `${prefix} ${arch.name}`,
    archetype: arch.key,
    model: arch.model || null,
    rarity: tierName,
    color: tier.color,
    itemLevel,
    power,
    value: Math.floor(power * 2.5)
  }
}

// ── Enemy Types ──────────────────────────────────────────────────────────
// behavior: chase | flank | brute | boss  — implemented in enemyAISystem.
export const ENEMY_TYPES = [
  {
    key: 'drone', name: 'Scrap Drone', behavior: 'chase',
    color: '#22d3ee', size: 0.9,
    hp: 60, dmg: 6, speed: 7, xp: 18, credits: 4,
    dropChance: 0.15, tierWeights: { Common: 70, Rare: 25, Epic: 5, Legendary: 0 }
  },
  {
    key: 'stalker', name: 'Cyber Stalker', behavior: 'flank',
    color: '#a3e635', size: 1.0,
    hp: 90, dmg: 9, speed: 9, xp: 28, credits: 7,
    dropChance: 0.2, tierWeights: { Common: 55, Rare: 32, Epic: 11, Legendary: 2 }
  },
  {
    key: 'brute', name: 'Plasma Brute', behavior: 'brute',
    color: '#fb923c', size: 1.6,
    hp: 220, dmg: 16, speed: 4.5, xp: 55, credits: 15,
    dropChance: 0.35, tierWeights: { Common: 35, Rare: 40, Epic: 20, Legendary: 5 }
  },
  {
    key: 'sentinel', name: 'Void Sentinel', behavior: 'boss',
    color: '#f43f5e', size: 2.2,
    hp: 600, dmg: 26, speed: 6, xp: 200, credits: 60,
    dropChance: 1.0, tierWeights: { Common: 0, Rare: 40, Epic: 40, Legendary: 20 }
  }
]

// Per-area spawn tables: [typeIndex, count]
export const AREA_SPAWNS = {
  hub:          [[0, 5]],
  cyber_forest: [[0, 10], [1, 8], [2, 3]],
  ruined_spire: [[1, 8], [2, 6], [3, 1]]
}

// Enemy stat scaling with level.
export function scaleEnemy(typeIdx, level) {
  const t = ENEMY_TYPES[typeIdx]
  const m = 1 + (level - 1) * 0.18
  return {
    hp: Math.floor(t.hp * m),
    dmg: Math.floor(t.dmg * (1 + (level - 1) * 0.12)),
    xp: Math.floor(t.xp * m),
    credits: Math.floor(t.credits * m)
  }
}

function pickTier(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (const tier of TIER_ORDER) {
    roll -= weights[tier] || 0
    if (roll <= 0) return tier
  }
  return 'Common'
}

// Roll loot for a killed enemy. Returns item or null.
export function rollLoot(typeIdx, level) {
  const t = ENEMY_TYPES[typeIdx]
  if (Math.random() > t.dropChance) return null
  const tier = pickTier(t.tierWeights)
  const slot = Math.random() > 0.5 ? 'weapon' : 'armor'
  return makeItem(slot, tier, level)
}
