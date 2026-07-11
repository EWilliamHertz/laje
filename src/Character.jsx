import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { addEntity, removeEntity, addComponent } from 'bitecs'
import * as THREE from 'three'
import { world, Position, Velocity, Rotation, PlayerControls, PlayerAttack, Health } from './ecs/world'
import { playerInputSystem, movementSystem, enemyAISystem, combatSystem } from './ecs/systems'
import { useStore, runtime } from './store'
import { CLASS_STATS } from './data/progression'
import { ABILITIES } from './data/skills'
import ClassModel from './ClassModel'
import { socket } from './Multiplayer'

function usePlayerECSInput(eid) {
  useEffect(() => {
    if (eid === null) return
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': PlayerControls.forward[eid] = 1; break;
        case 'KeyS': PlayerControls.backward[eid] = 1; break;
        case 'KeyA': PlayerControls.left[eid] = 1; break;
        case 'KeyD': PlayerControls.right[eid] = 1; break;
        case 'KeyJ': case 'Space': PlayerAttack.action[eid] = 1; break; // Basic Attack
      }
    }
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': PlayerControls.forward[eid] = 0; break;
        case 'KeyS': PlayerControls.backward[eid] = 0; break;
        case 'KeyA': PlayerControls.left[eid] = 0; break;
        case 'KeyD': PlayerControls.right[eid] = 0; break;
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [eid])
}

export default function Character() {
  const config = useStore(state => state.characterConfig)
  const setHealth = useStore(state => state.setHealth)
  const currentArea = useStore(state => state.currentArea)
  const groupRef = useRef()
  const [eid, setEid] = useState(null)
  const [anim, setAnim] = useState('idle')
  const animRef = useRef({ value: 'idle', abilityAnim: null, abilityUntil: 0, respawnAt: 0 })

  useEffect(() => {
    const newEid = addEntity(world)
    setEid(newEid)

    addComponent(world, newEid, Position)
    addComponent(world, newEid, Velocity)
    addComponent(world, newEid, Rotation)
    addComponent(world, newEid, PlayerControls)
    addComponent(world, newEid, PlayerAttack)
    addComponent(world, newEid, Health)

    const s = useStore.getState()
    Position.x[newEid] = runtime.playerPos.x
    Position.y[newEid] = 0
    Position.z[newEid] = runtime.playerPos.z
    Health.current[newEid] = s.health
    Health.max[newEid] = s.maxHealth

    return () => {
      removeEntity(world, newEid)
    }
  }, [currentArea])

  usePlayerECSInput(eid)

  // Ability animation cues (attack/spin/cast flourishes)
  useEffect(() => {
    return useStore.subscribe((state, prev) => {
      if (state.triggeredSkill && state.triggeredSkill !== prev.triggeredSkill) {
        const a = ABILITIES[state.triggeredSkill]
        if (a?.anim) {
          animRef.current.abilityAnim = a.anim
          animRef.current.abilityUntil = Date.now() + 600
        }
      }
    })
  }, [])

  useFrame((state, delta) => {
    if (!groupRef.current || eid === null) return
    const store = useStore.getState()

    // Keep ECS max health in sync with derived stats (level ups, gear swaps)
    if (Health.max[eid] !== store.maxHealth) {
      const diff = store.maxHealth - Health.max[eid]
      Health.max[eid] = store.maxHealth
      if (diff > 0) Health.current[eid] = Math.min(store.maxHealth, Health.current[eid] + diff)
      else Health.current[eid] = Math.min(store.maxHealth, Health.current[eid])
    }
    if (runtime.pendingFullHeal) {
      runtime.pendingFullHeal = false
      Health.current[eid] = Health.max[eid]
    }

    // 1. Run ECS Game Logic in order
    playerInputSystem(world)
    combatSystem(world, delta, eid)
    enemyAISystem(world, eid, delta)
    movementSystem(world, delta)

    // Health regen (passives) + resource regen
    if (!runtime.isDead && Health.current[eid] > 0) {
      Health.current[eid] = Math.min(Health.max[eid], Health.current[eid] + store.stats.healthRegen * delta)
    }
    store.tickRegen(delta)

    // Death & respawn
    if (Health.current[eid] <= 0 && !runtime.isDead) {
      runtime.isDead = true
      animRef.current.respawnAt = Date.now() + 4000
      store.addFloatingText('SYSTEMS CRITICAL — REBOOTING', [Position.x[eid], 3, Position.z[eid]], '#ef4444')
      store.saveCharacter()
    }
    if (runtime.isDead && Date.now() > animRef.current.respawnAt) {
      runtime.isDead = false
      Position.x[eid] = 0
      Position.z[eid] = 0
      Health.current[eid] = Health.max[eid]
      useStore.getState().updateResource(9999)
    }

    // Sync Health to UI (store only re-renders subscribers when value changes)
    setHealth(Math.max(0, Math.floor(Health.current[eid])))

    groupRef.current.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
    runtime.playerPos.x = Position.x[eid]
    runtime.playerPos.z = Position.z[eid]

    // Smoothly rotate the character model to face movement direction
    const targetRotation = Rotation.y[eid]
    const currentRot = groupRef.current.rotation.y
    const diff = targetRotation - currentRot
    const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff))
    groupRef.current.rotation.y += normalizedDiff * 10 * delta

    const charPos = groupRef.current.position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, charPos.x + 20, 0.1)
    state.camera.position.y = 20
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, charPos.z + 20, 0.1)
    state.camera.lookAt(charPos.x, 0, charPos.z)

    // Gate Teleportation Check (gate is at [15, 0, 15])
    if (Math.abs(charPos.x - 15) < 3 && Math.abs(charPos.z - 15) < 3) {
      if (currentArea === 'cyber_forest') {
        store.setCurrentArea('ruined_spire')
        Position.x[eid] = 0
        Position.z[eid] = 0
      } else if (currentArea === 'ruined_spire') {
        store.setCurrentArea('cyber_forest')
        Position.x[eid] = 0
        Position.z[eid] = 0
      }
    }

    // ── Animation state machine ──
    const moving = Math.abs(Velocity.x[eid]) > 0.5 || Math.abs(Velocity.z[eid]) > 0.5
    let nextAnim = 'idle'
    if (runtime.isDead) nextAnim = 'death'
    else if (animRef.current.abilityUntil > Date.now()) nextAnim = animRef.current.abilityAnim
    else if (PlayerAttack.cooldown[eid] > 0.25) nextAnim = 'attack'
    else if (moving) nextAnim = 'run'
    if (nextAnim !== animRef.current.value) {
      animRef.current.value = nextAnim
      setAnim(nextAnim)
    }

    // Multiplayer Sync (20 ticks per second)
    if (window.frameCount === undefined) window.frameCount = 0
    window.frameCount++
    if (window.frameCount % 3 === 0 && socket.connected) {
      const w = store.equipped.weapon
      socket.emit('player_move', {
        position: [charPos.x, charPos.y, charPos.z],
        rotation: targetRotation,
        isAttacking: PlayerAttack.cooldown[eid] > 0.25,
        isMoving: moving,
        level: store.level,
        equippedWeapon: w ? { model: w.model, rarity: w.rarity, color: w.color } : null
      })
    }
  })

  if (!config || eid === null) return null

  const energyColor = CLASS_STATS[config.class]?.color || '#60a5fa'

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Rigged, animated class model with equipped weapon */}
      <EquippedModel charClass={config.class} anim={anim} energyColor={energyColor} />

      {/* Target/Selection Ring */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color={energyColor} transparent opacity={0.8} />
      </mesh>

      {/* Subtle glowing ground shadow */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color={energyColor} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

// Isolated so weapon swaps re-render only the model, not the whole Character.
function EquippedModel({ charClass, anim, energyColor }) {
  const weapon = useStore(state => state.equipped.weapon)
  return <ClassModel charClass={charClass} anim={anim} weaponItem={weapon} energyColor={energyColor} />
}
