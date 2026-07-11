import { query } from 'bitecs'
import { Position, Velocity, Rotation, PlayerControls, PlayerAttack, Enemy, Health } from './world'
import { useStore, runtime, getBuffValue } from '../store'
import { ABILITIES } from '../data/skills'
import { ENEMY_TYPES, scaleEnemy, rollLoot } from '../data/items'
import { socket } from '../Multiplayer'

// Helper for 2D distance
function getDistance(x1, z1, x2, z2) {
  const dx = x1 - x2
  const dz = z1 - z2
  return Math.sqrt(dx * dx + dz * dz)
}

export function playerInputSystem(world) {
  for (const eid of query(world, [Position, Velocity, Rotation, PlayerControls])) {
    if (runtime.isDead) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      continue
    }
    const forward = PlayerControls.forward[eid]
    const backward = PlayerControls.backward[eid]
    const left = PlayerControls.left[eid]
    const right = PlayerControls.right[eid]

    let vx = 0
    let vz = 0

    // Isometric Camera Mapping
    if (forward) { vx -= 1; vz -= 1; }
    if (backward) { vx += 1; vz += 1; }
    if (left) { vx -= 1; vz += 1; }
    if (right) { vx += 1; vz -= 1; }

    // Speed scales with level + gear + passives + temporary buffs
    const speed = useStore.getState().stats.moveSpeed * (1 + getBuffValue('moveSpeedPct'))
    const length = Math.sqrt(vx * vx + vz * vz)
    if (length > 0) {
      vx = (vx / length) * speed
      vz = (vz / length) * speed
      Rotation.y[eid] = Math.atan2(vx, vz)
    }

    Velocity.x[eid] = vx
    Velocity.z[eid] = vz
  }
}

export function enemyAISystem(world, playerEid, delta) {
  if (playerEid === null) return

  const px = Position.x[playerEid]
  const pz = Position.z[playerEid]
  const cloaked = runtime.cloakedUntil > Date.now() || runtime.isDead

  for (const eid of query(world, [Enemy, Position, Velocity, Rotation, Health])) {
    if (Health.current[eid] <= 0) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      continue
    }

    const type = ENEMY_TYPES[Enemy.type[eid]] || ENEMY_TYPES[0]
    const ex = Position.x[eid]
    const ez = Position.z[eid]
    const dist = getDistance(px, pz, ex, ez)
    const aggroRange = type.behavior === 'boss' ? 40 : 25
    const attackRange = type.size + 0.8

    if (Enemy.attackTimer[eid] > 0) Enemy.attackTimer[eid] -= delta

    if (!cloaked && dist < aggroRange && dist > attackRange) {
      const dx = px - ex
      const dz = pz - ez
      const length = Math.sqrt(dx * dx + dz * dz)
      let vx = (dx / length) * type.speed
      let vz = (dz / length) * type.speed

      // Flankers weave sideways while closing in
      if (type.behavior === 'flank' && dist > 4) {
        if (Enemy.strafeDir[eid] === 0) Enemy.strafeDir[eid] = Math.random() > 0.5 ? 1 : -1
        const perpX = -dz / length, perpZ = dx / length
        vx += perpX * type.speed * 0.6 * Enemy.strafeDir[eid]
        vz += perpZ * type.speed * 0.6 * Enemy.strafeDir[eid]
        if (Math.random() < 0.005) Enemy.strafeDir[eid] *= -1
      }

      Velocity.x[eid] = vx
      Velocity.z[eid] = vz
      Rotation.y[eid] = Math.atan2(dx, dz)
    } else if (!cloaked && dist <= attackRange) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      // Discrete, level-scaled attacks on a cooldown instead of constant drain
      if (Enemy.attackTimer[eid] <= 0) {
        const scaled = scaleEnemy(Enemy.type[eid], Enemy.level[eid] || 1)
        Health.current[playerEid] -= scaled.dmg
        Enemy.attackTimer[eid] = type.behavior === 'brute' ? 2.0 : type.behavior === 'boss' ? 1.6 : 1.2
        useStore.getState().addFloatingText(`-${scaled.dmg}`, [px, 2.2, pz], '#f87171')
      }
    } else {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
    }
  }
}

// ── Shared damage application with crits, kill rewards & loot drops ─────
function damageEnemy(eid, amount, opts = {}) {
  const store = useStore.getState()
  const { critChance } = store.stats
  const isCrit = Math.random() < critChance
  const final = Math.floor(amount * (isCrit ? 2 : 1))

  if (Health.current[eid] <= 0) return
  Health.current[eid] -= final

  const ex = Position.x[eid]
  const ez = Position.z[eid]
  store.addFloatingText(isCrit ? `${final} CRIT!` : `${final}`, [ex, 2, ez], isCrit ? '#f59e0b' : '#f8fafc')

  if (opts.knockback) {
    const dx = ex - opts.fromX
    const dz = ez - opts.fromZ
    const d = Math.max(0.1, Math.sqrt(dx * dx + dz * dz))
    Velocity.x[eid] += (dx / d) * opts.knockback
    Velocity.z[eid] += (dz / d) * opts.knockback
  }

  if (Health.current[eid] <= 0) {
    const typeIdx = Enemy.type[eid]
    const level = Enemy.level[eid] || 1
    const scaled = scaleEnemy(typeIdx, level)

    store.addLoot(scaled.xp, scaled.credits)
    store.addFloatingText(`+${scaled.xp} XP`, [ex, 2.6, ez], '#fef08a')
    store.addFloatingText(`+${scaled.credits} Credits`, [ex, 3.2, ez], '#34d399')

    const item = rollLoot(typeIdx, level)
    if (item) {
      store.addInventoryItem(item)
      store.addFloatingText(`${item.name} [${item.rarity}]`, [ex, 3.9, ez], item.color)
    }

    if (socket && socket.connected && store.party && store.party.length > 0) {
      socket.emit('party_xp', { party: store.party, xp: scaled.xp })
    }
  }
}

function playerDamage() {
  const store = useStore.getState()
  return store.stats.damage * (1 + getBuffValue('damagePct'))
}

// Execute an active ability from the hotbar.
function executeAbility(abilityId, playerEid, enemies) {
  const ability = ABILITIES[abilityId]
  if (!ability) return
  const store = useStore.getState()
  const px = Position.x[playerEid]
  const pz = Position.z[playerEid]
  const pRot = Rotation.y[playerEid]
  const dmg = playerDamage()

  switch (ability.kind) {
    case 'dash': {
      Position.x[playerEid] += Math.sin(pRot) * ability.distance
      Position.z[playerEid] += Math.cos(pRot) * ability.distance
      store.addFloatingText('PHASE DASH', [px, 2, pz], '#a855f7')
      break
    }
    case 'cloak': {
      runtime.cloakedUntil = Date.now() + ability.duration * 1000
      store.addFloatingText('CLOAKED', [px, 2, pz], '#94a3b8')
      break
    }
    case 'heal': {
      const heal = Math.floor(store.maxHealth * ability.healPct)
      Health.current[playerEid] = Math.min(store.maxHealth, Health.current[playerEid] + heal)
      store.addFloatingText(`+${heal} HP`, [px, 2, pz], '#22c55e')
      break
    }
    case 'buff': {
      for (const [k, v] of Object.entries(ability.buff)) {
        runtime.buffs[k] = { value: v, until: Date.now() + ability.duration * 1000 }
      }
      store.addFloatingText(ability.name.toUpperCase() + '!', [px, 2, pz], '#fbbf24')
      break
    }
    case 'aoe': {
      for (const eid of enemies) {
        if (Health.current[eid] <= 0) continue
        const d = getDistance(px, pz, Position.x[eid], Position.z[eid])
        if (d < ability.radius) {
          damageEnemy(eid, dmg * ability.dmgMult, { knockback: ability.knockback || 0, fromX: px, fromZ: pz })
        }
      }
      break
    }
    case 'cone': {
      for (const eid of enemies) {
        if (Health.current[eid] <= 0) continue
        const ex = Position.x[eid]
        const ez = Position.z[eid]
        const d = getDistance(px, pz, ex, ez)
        if (d < ability.range) {
          const angleToEnemy = Math.atan2(ex - px, ez - pz)
          let diff = angleToEnemy - pRot
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          if (Math.abs(diff) < Math.PI / 2) {
            // Execute-style abilities only work below a health threshold
            if (ability.executeThreshold && Health.current[eid] / Health.max[eid] > ability.executeThreshold) {
              damageEnemy(eid, dmg) // reduced hit on healthy targets
            } else {
              damageEnemy(eid, dmg * ability.dmgMult)
            }
          }
        }
      }
      break
    }
  }
}

export function combatSystem(world, delta, playerEid) {
  if (playerEid === null) return

  const store = useStore.getState()
  const enemies = query(world, [Enemy, Position, Health])

  // Hotbar ability triggered from the store?
  const tSkill = store.triggeredSkill
  if (tSkill) {
    executeAbility(tSkill, playerEid, enemies)
    store.clearTriggeredSkill()
  }

  // Cooldown reduction for the basic attack
  if (PlayerAttack.cooldown[playerEid] > 0) {
    PlayerAttack.cooldown[playerEid] -= delta
  }

  // Basic attack (J key)
  if (PlayerAttack.action[playerEid] === 1 && PlayerAttack.cooldown[playerEid] <= 0 && !runtime.isDead) {
    PlayerAttack.action[playerEid] = 0
    PlayerAttack.cooldown[playerEid] = 0.5

    const px = Position.x[playerEid]
    const pz = Position.z[playerEid]
    const pRot = Rotation.y[playerEid]
    const isRanged = store.characterConfig?.class === 'mage'
    const attackRange = isRanged ? 15 : 8
    const dmg = playerDamage()

    for (const eid of enemies) {
      if (Health.current[eid] <= 0) continue
      const ex = Position.x[eid]
      const ez = Position.z[eid]
      const dist = getDistance(px, pz, ex, ez)
      if (dist < attackRange) {
        const angleToEnemy = Math.atan2(ex - px, ez - pz)
        let diff = angleToEnemy - pRot
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        if (Math.abs(diff) < Math.PI / 2) {
          damageEnemy(eid, dmg)
        }
      }
    }
  } else if (PlayerAttack.action[playerEid] > 1) {
    PlayerAttack.action[playerEid] = 0 // consume unknown legacy actions
  }
}

export function movementSystem(world, delta) {
  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
    Position.z[eid] += Velocity.z[eid] * delta
    // Dampen knockback impulses on enemies
    if (Math.abs(Velocity.x[eid]) > 20 || Math.abs(Velocity.z[eid]) > 20) {
      Velocity.x[eid] *= 0.8
      Velocity.z[eid] *= 0.8
    }
  }
}
