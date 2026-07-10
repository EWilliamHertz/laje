import { query } from 'bitecs'
import { Position, Velocity, Rotation, PlayerControls, PlayerAttack, Enemy, Health } from './world'
import { useStore } from '../store'

// Helper for 2D distance
function getDistance(x1, z1, x2, z2) {
  const dx = x1 - x2
  const dz = z1 - z2
  return Math.sqrt(dx * dx + dz * dz)
}

export function playerInputSystem(world) {
  for (const eid of query(world, [Position, Velocity, Rotation, PlayerControls])) {
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
    
    const speed = 15 // Increased player speed for better ARPG feel
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

export function enemyAISystem(world, playerEid) {
  if (playerEid === null) return
  
  const px = Position.x[playerEid]
  const pz = Position.z[playerEid]
  
  for (const eid of query(world, [Enemy, Position, Velocity, Rotation, Health])) {
    if (Health.current[eid] <= 0) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      continue
    }

    const ex = Position.x[eid]
    const ez = Position.z[eid]
    const dist = getDistance(px, pz, ex, ez)
    
    // Aggro radius 25, attack radius 1.5
    if (dist < 25 && dist > 1.5) {
      // Move toward player
      const dx = px - ex
      const dz = pz - ez
      const length = Math.sqrt(dx * dx + dz * dz)
      const speed = 6
      Velocity.x[eid] = (dx / length) * speed
      Velocity.z[eid] = (dz / length) * speed
      Rotation.y[eid] = Math.atan2(dx, dz)
    } else if (dist <= 1.5) {
      // Attack range (Stop moving)
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      // Much slower health drain so the player doesn't die in 3 seconds!
      Health.current[playerEid] -= 0.02
    } else {
      // Idle
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
    }
  }
}

export function combatSystem(world, delta, playerEid) {
  if (playerEid === null) return

  const px = Position.x[playerEid]
  const pz = Position.z[playerEid]
  const pRot = Rotation.y[playerEid]
  const ents = query(world, [Enemy, Position, Health])

  if (PlayerAttack.action[playerEid] === 3 && PlayerAttack.cooldown[playerEid] <= 0) {
    // Phase Dash: Teleport forward
    Position.x[playerEid] += Math.sin(pRot) * 10
    Position.z[playerEid] += Math.cos(pRot) * 10
    PlayerAttack.cooldown[playerEid] = 1.0
    PlayerAttack.action[playerEid] = 0
    useStore.getState().addFloatingText(playerEid, "PHASE DASH", "#a855f7", px, pz)
  }
  
  if (PlayerAttack.action[playerEid] === 4 && PlayerAttack.cooldown[playerEid] <= 0) {
    // Energy Cleave: Massive AoE damage
    for (let i = 0; i < ents.length; i++) {
      const eid = ents[i]
      const dx = Position.x[eid] - px
      const dz = Position.z[eid] - pz
      const dist = Math.sqrt(dx*dx + dz*dz)
      if (dist < 8) {
        Health.current[eid] -= 100
        Velocity.x[eid] += dx * 5
        Velocity.z[eid] += dz * 5
        useStore.getState().addFloatingText(eid, "100 CRIT", "#ef4444", Position.x[eid], Position.z[eid])
      }
    }
    PlayerAttack.cooldown[playerEid] = 2.0
    PlayerAttack.action[playerEid] = 0
  }
  
  if (PlayerAttack.action[playerEid] === 5 && PlayerAttack.cooldown[playerEid] <= 0) {
    // Aether Shield: Heal self
    Health.current[playerEid] = Math.min(100, Health.current[playerEid] + 50)
    PlayerAttack.cooldown[playerEid] = 3.0
    PlayerAttack.action[playerEid] = 0
    useStore.getState().addFloatingText(playerEid, "+50 HP", "#22c55e", px, pz)
  }



  // Cooldown reduction
  if (PlayerAttack.cooldown[playerEid] > 0) {
    PlayerAttack.cooldown[playerEid] -= delta
  }

  // Attack Triggered
  if (PlayerAttack.action[playerEid] > 0 && PlayerAttack.cooldown[playerEid] <= 0) {
    const actionType = PlayerAttack.action[playerEid]
    PlayerAttack.action[playerEid] = 0 // consume action
    PlayerAttack.cooldown[playerEid] = 0.5 // global cooldown 0.5s

    const px = Position.x[playerEid]
    const pz = Position.z[playerEid]
    const pRot = Rotation.y[playerEid]
    const attackRange = actionType === 1 ? 8 : 15 // Increased ranges: J=Melee(8), K=Ranged(15)

    // Soft-Lock Cone Targeting against all enemies
    for (const eid of query(world, [Enemy, Position, Health])) {
      if (Health.current[eid] <= 0) continue

      const ex = Position.x[eid]
      const ez = Position.z[eid]
      const dist = getDistance(px, pz, ex, ez)
      
      if (dist < attackRange) {
        // Calculate angle to enemy
        const angleToEnemy = Math.atan2(ex - px, ez - pz)
        // Normalize angle diff
        let diff = angleToEnemy - pRot
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        
        // Widen cone to 180 degrees (PI/2 rads on either side) to make hitting much easier!
        if (Math.abs(diff) < Math.PI / 2) {
          Health.current[eid] -= 35 // Now takes 3 hits to kill!
          
          if (Health.current[eid] <= 0) {
            // Enemy Died!
            const xpGained = 25 + Math.floor(Math.random() * 10)
            const currencyGained = 5 + Math.floor(Math.random() * 5)
            
            useStore.getState().addLoot(xpGained, currencyGained)
            useStore.getState().addFloatingText(eid, `+${xpGained} XP`, '#fef08a', ex, ez)
            useStore.getState().addFloatingText(eid, `+${currencyGained} Credits`, '#34d399', ex, ez)
          }
        }
      }
    }
  }
}

export function movementSystem(world, delta) {
  for (const eid of query(world, [Position, Velocity])) {
    Position.x[eid] += Velocity.x[eid] * delta
    Position.y[eid] += Velocity.y[eid] * delta
    Position.z[eid] += Velocity.z[eid] * delta
  }
}
