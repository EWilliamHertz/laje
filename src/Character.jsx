import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { addEntity, removeEntity, addComponent } from 'bitecs'
import * as THREE from 'three'
import { world, Position, Velocity, Rotation, PlayerControls, PlayerAttack, Health } from './ecs/world'
import { playerInputSystem, movementSystem, enemyAISystem, combatSystem } from './ecs/systems'
import { useStore } from './store'
import CharacterModel from './CharacterModel'
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
        case 'KeyJ': PlayerAttack.action[eid] = 1; break; // Melee Attack
        case 'KeyK': PlayerAttack.action[eid] = 2; break; // Ranged Attack
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
  const modelRef = useRef()
  const [eid, setEid] = useState(null)
  
  useEffect(() => {
    const newEid = addEntity(world)
    setEid(newEid)
    
    addComponent(world, Position, newEid)
    addComponent(world, Velocity, newEid)
    addComponent(world, Rotation, newEid)
    addComponent(world, PlayerControls, newEid)
    addComponent(world, PlayerAttack, newEid)
    addComponent(world, Health, newEid)
    
    Position.x[newEid] = 0
    Position.y[newEid] = 0
    Position.z[newEid] = 0
    Health.current[newEid] = 100
    Health.max[newEid] = 100
    
    return () => {
      removeEntity(world, newEid)
    }
  }, [currentArea])
  
  usePlayerECSInput(eid)

  useFrame((state, delta) => {
    if (!groupRef.current || eid === null) return
    
    // 1. Run ECS Game Logic in order
    playerInputSystem(world)
    combatSystem(world, delta, eid)
    enemyAISystem(world, eid)
    movementSystem(world, delta)
    
    // Sync Health to UI
    const currentHealth = Math.max(0, Math.floor(Health.current[eid]))
    setHealth(currentHealth)
    
    groupRef.current.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
    
    // Smoothly rotate the character model to face the movement direction
    // Instead of snapping, we use slerp/lerp for a better feel
    const targetRotation = Rotation.y[eid]
    // Simple lerp for rotation
    const currentRot = groupRef.current.rotation.y
    const diff = targetRotation - currentRot
    // Normalize angle difference to avoid spinning the long way around
    const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff))
    groupRef.current.rotation.y += normalizedDiff * 10 * delta
    
    const charPos = groupRef.current.position
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, charPos.x + 20, 0.1)
    state.camera.position.y = 20
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, charPos.z + 20, 0.1)
    state.camera.lookAt(charPos.x, 0, charPos.z)
    
    // Weapon Animation Loop
    if (modelRef.current && modelRef.current.weapon) {
      if (PlayerAttack.cooldown[eid] > 0) {
        modelRef.current.weapon.rotation.x -= 30 * delta
      } else {
        modelRef.current.weapon.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1
        modelRef.current.weapon.rotation.x = 0
      }
    }

    // Multiplayer Sync (20 ticks per second)
    if (window.frameCount === undefined) window.frameCount = 0
    window.frameCount++
    if (window.frameCount % 3 === 0 && socket.connected) {
      socket.emit('player_move', {
        position: [charPos.x, charPos.y, charPos.z],
        rotation: targetRotation,
        isAttacking: PlayerAttack.cooldown[eid] > 0
      })
    }
  })

  if (!config || eid === null) return null

  const isMage = config.class === 'mage'
  const isWarrior = config.class === 'warrior'
  const isRogue = config.class === 'rogue'
  const energyColor = isMage ? '#06b6d4' : isWarrior ? '#ef4444' : '#a855f7'

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      
      {/* --- Advanced Procedural 3D Model --- */}
      <CharacterModel 
        ref={modelRef}
        charClass={config.class} 
        energyColor={energyColor} 
      />

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
