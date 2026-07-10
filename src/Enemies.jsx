import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { addEntity, removeEntity, addComponent, query } from 'bitecs'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { world, Position, Velocity, Rotation, Enemy, Health } from './ecs/world'
import { useStore } from './store'

const MAX_ENEMIES = 50

export default function Enemies() {
  const currentArea = useStore(state => state.currentArea)
  const meshRef = useRef()
  const dummy = new THREE.Object3D()
  
  const enemyTex = useTexture('/enemy.jpg')
  
  // Track our enemy eids so we can map them to InstancedMesh indices
  const enemyEids = useRef([])

  useEffect(() => {
    // Clear old enemies on mount/area change
    enemyEids.current.forEach(eid => removeEntity(world, eid))
    enemyEids.current = []

    // Spawn new enemies based on area
    const count = currentArea === 'hub' ? 5 : currentArea === 'cyber_forest' ? 20 : 15
    
    for (let i = 0; i < count; i++) {
      const eid = addEntity(world)
      addComponent(world, Position, eid)
      addComponent(world, Velocity, eid)
      addComponent(world, Rotation, eid)
      addComponent(world, Enemy, eid)
      addComponent(world, Health, eid)
      
      // Random position outside immediate center
      const angle = Math.random() * Math.PI * 2
      const radius = 15 + Math.random() * 20
      
      Position.x[eid] = Math.cos(angle) * radius
      Position.y[eid] = 0.5
      Position.z[eid] = Math.sin(angle) * radius
      
      Health.current[eid] = 100
      Health.max[eid] = 100
      
      enemyEids.current.push(eid)
    }

    return () => {
      enemyEids.current.forEach(eid => removeEntity(world, eid))
      enemyEids.current = []
    }
  }, [currentArea])

  useFrame(() => {
    if (!meshRef.current) return

    let instanceIdx = 0
    for (let i = 0; i < enemyEids.current.length; i++) {
      const eid = enemyEids.current[i]
      
      // If dead, sink into the ground
      if (Health.current[eid] <= 0) {
        if (Position.y[eid] > -2) {
          Position.y[eid] -= 0.05 // death sink animation
        }
      }

      dummy.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
      dummy.rotation.set(0, Rotation.y[eid], 0)
      
      // Scale down if dead, scale pulse if damaged?
      const healthPct = Health.current[eid] / Health.max[eid]
      if (healthPct <= 0) {
        dummy.scale.set(1, 1, 1) // stay standard size while sinking
      } else {
        dummy.scale.set(1, 1, 1)
      }

      dummy.updateMatrix()
      meshRef.current.setMatrixAt(instanceIdx++, dummy.matrix)
      
      // We could use setColorsAt for damage flashing, but keeping it simple for now
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Color scheme based on area
  const enemyColor = currentArea === 'cyber_forest' ? '#22d3ee' : currentArea === 'ruined_spire' ? '#ef4444' : '#f59e0b'

  return (
    <instancedMesh ref={meshRef} args={[null, null, MAX_ENEMIES]} castShadow receiveShadow>
      {/* For performance, we use a simple Box to represent critters/drones */}
      <boxGeometry args={[1.2, 1.2, 1.2]} />
      <meshStandardMaterial 
        map={enemyTex} 
        color={enemyColor} 
        roughness={0.4} 
        metalness={0.8} 
        emissive={enemyColor}
        emissiveIntensity={0.8}
      />
    </instancedMesh>
  )
}
