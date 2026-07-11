// ── Skill Trees & Active Abilities ───────────────────────────────────────
// Each class has 3 branches. Nodes are unlocked with Skill Points (1/level).
// type: 'active' → bindable to hotbar keys 1-5. 'passive' → permanent effects.
// requires: id of the parent node in the same branch (null = root).

export const SKILL_TREES = {
  warrior: {
    className: 'Plasma Warrior',
    color: '#ef4444',
    branches: [
      {
        id: 'vanguard', name: 'Vanguard Protocol', desc: 'Frontline devastation',
        nodes: [
          { id: 'w_power_strike', name: 'Power Strike', icon: '💥', type: 'active', requires: null, requiresLevel: 2, desc: 'Overcharge your blade: a heavy blow for 250% weapon damage.' },
          { id: 'w_cleave', name: 'Energy Cleave', icon: '⚔️', type: 'active', requires: 'w_power_strike', requiresLevel: 5, desc: 'Wide plasma arc hitting all enemies within 8m for 180% damage.' },
          { id: 'w_shockwave', name: 'Seismic Shockwave', icon: '🌊', type: 'active', requires: 'w_cleave', requiresLevel: 10, desc: 'Slam the ground, damaging and knocking back everything nearby.' }
        ]
      },
      {
        id: 'bulwark', name: 'Bulwark Systems', desc: 'Survive anything',
        nodes: [
          { id: 'w_plating', name: 'Reactive Plating', icon: '🛡️', type: 'passive', requires: null, requiresLevel: 2, desc: '+15% Max Health.', effects: { maxHealthPct: 0.15 } },
          { id: 'w_shield', name: 'Plasma Shield', icon: '✨', type: 'active', requires: 'w_plating', requiresLevel: 6, desc: 'Restore 35% of your max health instantly.' },
          { id: 'w_regen', name: 'Nano-Repair', icon: '💠', type: 'passive', requires: 'w_shield', requiresLevel: 12, desc: '+4 Health regenerated per second.', effects: { healthRegen: 4 } }
        ]
      },
      {
        id: 'fury', name: 'Fury Core', desc: 'Raw overheated power',
        nodes: [
          { id: 'w_hot_blade', name: 'Overheated Blade', icon: '🔥', type: 'passive', requires: null, requiresLevel: 3, desc: '+12% Damage.', effects: { damagePct: 0.12 } },
          { id: 'w_berserk', name: 'Berserk Override', icon: '😤', type: 'active', requires: 'w_hot_blade', requiresLevel: 8, desc: '+60% damage for 8 seconds.' },
          { id: 'w_crit', name: 'Critical Vents', icon: '🎯', type: 'passive', requires: 'w_berserk', requiresLevel: 14, desc: '+10% Critical Strike chance.', effects: { critChance: 0.10 } }
        ]
      }
    ]
  },
  mage: {
    className: 'Technomancer',
    color: '#06b6d4',
    branches: [
      {
        id: 'aether', name: 'Aether Weaving', desc: 'Devastating ranged arts',
        nodes: [
          { id: 'm_bolt', name: 'Aether Bolt', icon: '⚡', type: 'active', requires: null, requiresLevel: 2, desc: 'Hurl a bolt of pure aether at range for 220% damage.' },
          { id: 'm_nova', name: 'Ion Nova', icon: '☄️', type: 'active', requires: 'm_bolt', requiresLevel: 6, desc: 'Detonate an aether nova hitting everything within 10m.' },
          { id: 'm_singularity', name: 'Singularity', icon: '🌀', type: 'active', requires: 'm_nova', requiresLevel: 12, desc: 'Collapse space: pull enemies in and crush them for massive damage.' }
        ]
      },
      {
        id: 'conduit', name: 'Ley Conduit', desc: 'Endless energy reserves',
        nodes: [
          { id: 'm_capacitor', name: 'Aether Capacitor', icon: '🔋', type: 'passive', requires: null, requiresLevel: 2, desc: '+25% Max Aether.', effects: { maxResourcePct: 0.25 } },
          { id: 'm_flow', name: 'Ley-Line Flow', icon: '💧', type: 'passive', requires: 'm_capacitor', requiresLevel: 7, desc: '+40% Aether regeneration.', effects: { resourceRegenPct: 0.4 } },
          { id: 'm_barrier', name: 'Hardlight Barrier', icon: '🔷', type: 'active', requires: 'm_flow', requiresLevel: 10, desc: 'Convert aether into vitality: restore 40% max health.' }
        ]
      },
      {
        id: 'overload', name: 'System Overload', desc: 'Push beyond safe limits',
        nodes: [
          { id: 'm_amplify', name: 'Signal Amplifier', icon: '📡', type: 'passive', requires: null, requiresLevel: 3, desc: '+15% Damage.', effects: { damagePct: 0.15 } },
          { id: 'm_haste', name: 'Quickened Circuits', icon: '⏱️', type: 'passive', requires: 'm_amplify', requiresLevel: 8, desc: '-20% ability cooldowns.', effects: { cooldownReduction: 0.2 } },
          { id: 'm_overload', name: 'Total Overload', icon: '💫', type: 'active', requires: 'm_haste', requiresLevel: 14, desc: '+60% damage for 8 seconds while your systems run red-hot.' }
        ]
      }
    ]
  },
  rogue: {
    className: 'Cyber-Assassin',
    color: '#a855f7',
    branches: [
      {
        id: 'phase', name: 'Phase Tech', desc: 'Untouchable mobility',
        nodes: [
          { id: 'r_dash', name: 'Phase Dash', icon: '💨', type: 'active', requires: null, requiresLevel: 2, desc: 'Instantly teleport 10m forward, evading all damage.' },
          { id: 'r_swift', name: 'Servo Tendons', icon: '🦵', type: 'passive', requires: 'r_dash', requiresLevel: 6, desc: '+12% Movement speed.', effects: { moveSpeedPct: 0.12 } },
          { id: 'r_cloak', name: 'Optic Cloak', icon: '👻', type: 'active', requires: 'r_swift', requiresLevel: 11, desc: 'Vanish for 4s — enemies lose all interest in you.' }
        ]
      },
      {
        id: 'lethality', name: 'Lethality Suite', desc: 'One cut is enough',
        nodes: [
          { id: 'r_edge', name: 'Mono-Edge', icon: '🗡️', type: 'passive', requires: null, requiresLevel: 2, desc: '+12% Damage.', effects: { damagePct: 0.12 } },
          { id: 'r_fan', name: 'Fan of Blades', icon: '❇️', type: 'active', requires: 'r_edge', requiresLevel: 6, desc: 'Whirl of energy daggers striking all enemies within 7m.' },
          { id: 'r_execute', name: 'Terminate', icon: '☠️', type: 'active', requires: 'r_fan', requiresLevel: 12, desc: 'Executes a weakened target: 400% damage to enemies below half health.' }
        ]
      },
      {
        id: 'overclock', name: 'Overclock Rig', desc: 'Faster than thought',
        nodes: [
          { id: 'r_precision', name: 'Target Optics', icon: '🎯', type: 'passive', requires: null, requiresLevel: 3, desc: '+12% Critical Strike chance.', effects: { critChance: 0.12 } },
          { id: 'r_overclock', name: 'Overclock', icon: '⚙️', type: 'active', requires: 'r_precision', requiresLevel: 8, desc: '+40% move speed and +30% damage for 6 seconds.' },
          { id: 'r_battery', name: 'Auxiliary Battery', icon: '🔌', type: 'passive', requires: 'r_overclock', requiresLevel: 13, desc: '+20% Max Overclock energy.', effects: { maxResourcePct: 0.2 } }
        ]
      }
    ]
  }
}

// ── Active ability definitions consumed by the combat system ────────────
// dmgMult multiplies the player's derived damage stat.
export const ABILITIES = {
  // Warrior
  w_power_strike: { name: 'Power Strike', icon: '💥', cooldown: 4, cost: 20, kind: 'cone', range: 6, dmgMult: 2.5, anim: 'attack' },
  w_cleave:       { name: 'Energy Cleave', icon: '⚔️', cooldown: 6, cost: 30, kind: 'aoe', radius: 8, dmgMult: 1.8, knockback: 4, anim: 'spin' },
  w_shockwave:    { name: 'Seismic Shockwave', icon: '🌊', cooldown: 10, cost: 40, kind: 'aoe', radius: 10, dmgMult: 1.5, knockback: 12, anim: 'spin' },
  w_shield:       { name: 'Plasma Shield', icon: '✨', cooldown: 15, cost: 35, kind: 'heal', healPct: 0.35, anim: 'cast' },
  w_berserk:      { name: 'Berserk Override', icon: '😤', cooldown: 20, cost: 40, kind: 'buff', buff: { damagePct: 0.6 }, duration: 8, anim: 'cast' },
  // Mage
  m_bolt:        { name: 'Aether Bolt', icon: '⚡', cooldown: 2, cost: 15, kind: 'cone', range: 18, dmgMult: 2.2, anim: 'cast' },
  m_nova:        { name: 'Ion Nova', icon: '☄️', cooldown: 8, cost: 40, kind: 'aoe', radius: 10, dmgMult: 2.0, knockback: 5, anim: 'cast' },
  m_singularity: { name: 'Singularity', icon: '🌀', cooldown: 14, cost: 55, kind: 'aoe', radius: 12, dmgMult: 2.6, knockback: -8, anim: 'cast' },
  m_barrier:     { name: 'Hardlight Barrier', icon: '🔷', cooldown: 15, cost: 45, kind: 'heal', healPct: 0.4, anim: 'cast' },
  m_overload:    { name: 'Total Overload', icon: '💫', cooldown: 20, cost: 50, kind: 'buff', buff: { damagePct: 0.6 }, duration: 8, anim: 'cast' },
  // Rogue
  r_dash:      { name: 'Phase Dash', icon: '💨', cooldown: 3, cost: 15, kind: 'dash', distance: 10 },
  r_cloak:     { name: 'Optic Cloak', icon: '👻', cooldown: 18, cost: 30, kind: 'cloak', duration: 4 },
  r_fan:       { name: 'Fan of Blades', icon: '❇️', cooldown: 6, cost: 30, kind: 'aoe', radius: 7, dmgMult: 1.7, anim: 'spin' },
  r_execute:   { name: 'Terminate', icon: '☠️', cooldown: 8, cost: 35, kind: 'cone', range: 5, dmgMult: 4.0, executeThreshold: 0.5, anim: 'attack' },
  r_overclock: { name: 'Overclock', icon: '⚙️', cooldown: 16, cost: 40, kind: 'buff', buff: { damagePct: 0.3, moveSpeedPct: 0.4 }, duration: 6 },
  // Legacy ids (kept so old saves keep working)
  dash:   { name: 'Phase Dash', icon: '💨', cooldown: 3, cost: 15, kind: 'dash', distance: 10 },
  cleave: { name: 'Energy Cleave', icon: '⚔️', cooldown: 6, cost: 30, kind: 'aoe', radius: 8, dmgMult: 1.8, knockback: 4, anim: 'spin' },
  shield: { name: 'Plasma Shield', icon: '✨', cooldown: 15, cost: 35, kind: 'heal', healPct: 0.35, anim: 'cast' }
}

export function getTree(charClass) {
  return SKILL_TREES[charClass] || SKILL_TREES.warrior
}

export function allNodes(charClass) {
  return getTree(charClass).branches.flatMap(b => b.nodes)
}

export function getNode(charClass, id) {
  return allNodes(charClass).find(n => n.id === id)
}

// Aggregate all passive effects from a list of unlocked node ids.
export function aggregatePassives(charClass, unlockedIds) {
  const out = {}
  for (const id of unlockedIds || []) {
    const node = getNode(charClass, id)
    if (node?.type === 'passive' && node.effects) {
      for (const [k, v] of Object.entries(node.effects)) out[k] = (out[k] || 0) + v
    }
  }
  return out
}

export function getAbilityIcon(id) {
  return ABILITIES[id]?.icon || '❔'
}
