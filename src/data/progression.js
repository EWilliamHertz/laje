// ── Level & Stat Progression ─────────────────────────────────────────────
// XP required to go from `level` to `level + 1`. Smooth super-linear curve.
export function xpForLevel(level) {
  return Math.floor(80 * Math.pow(level, 1.35) + 20 * level)
}

export const MAX_LEVEL = 60

// Base stats + per-level growth for each class.
export const CLASS_STATS = {
  warrior: {
    name: 'Plasma Warrior',
    color: '#ef4444',
    resourceName: 'Heat',
    baseHealth: 120, healthPerLevel: 18,
    baseResource: 100, resourcePerLevel: 5,
    baseDamage: 12, damagePerLevel: 2.2,
    baseSpeed: 13,
    baseCrit: 0.05
  },
  mage: {
    name: 'Technomancer',
    color: '#06b6d4',
    resourceName: 'Aether',
    baseHealth: 90, healthPerLevel: 12,
    baseResource: 130, resourcePerLevel: 12,
    baseDamage: 10, damagePerLevel: 2.6,
    baseSpeed: 13.5,
    baseCrit: 0.05
  },
  rogue: {
    name: 'Cyber-Assassin',
    color: '#a855f7',
    resourceName: 'Overclock',
    baseHealth: 100, healthPerLevel: 14,
    baseResource: 110, resourcePerLevel: 8,
    baseDamage: 11, damagePerLevel: 2.4,
    baseSpeed: 15,
    baseCrit: 0.12
  }
}

// Compute all derived stats from level + gear + unlocked passive nodes.
export function computeDerivedStats(charClass, level, equipped, passiveEffects) {
  const c = CLASS_STATS[charClass] || CLASS_STATS.warrior
  const p = passiveEffects || {}
  const armorPower = equipped?.armor?.power || 0
  const weaponPower = equipped?.weapon?.power || 0

  const maxHealth = Math.floor(
    (c.baseHealth + (level - 1) * c.healthPerLevel + armorPower + (p.maxHealth || 0)) *
    (1 + (p.maxHealthPct || 0))
  )
  const maxResource = Math.floor(
    (c.baseResource + (level - 1) * c.resourcePerLevel + (p.maxResource || 0)) *
    (1 + (p.maxResourcePct || 0))
  )
  const damage = Math.floor(
    (c.baseDamage + (level - 1) * c.damagePerLevel + weaponPower) *
    (1 + (p.damagePct || 0))
  )
  const moveSpeed = c.baseSpeed * (1 + (p.moveSpeedPct || 0))
  const critChance = Math.min(0.75, c.baseCrit + (p.critChance || 0))
  const cooldownMult = Math.max(0.4, 1 - (p.cooldownReduction || 0))
  const resourceRegen = 6 * (1 + (p.resourceRegenPct || 0))
  const healthRegen = 1 + (p.healthRegen || 0)

  return { maxHealth, maxResource, damage, moveSpeed, critChance, cooldownMult, resourceRegen, healthRegen }
}

// Skill points: 1 per level gained.
export function totalSkillPoints(level) {
  return Math.max(0, level - 1)
}
