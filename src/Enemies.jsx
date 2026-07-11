import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { addEntity, removeEntity, addComponent } from 'bitecs'
import * as THREE from 'three'
import { world, Position, Velocity, Rotation, Enemy, Health } from './ecs/world'
import { useStore } from './store'
import { ENEMY_TYPES, AREA_SPAWNS, scaleEnemy } from './data/items'

const MAX_PER_TYPE = 32
const RESPAWN_SECONDS = 12

// One instanced mesh per enemy archetype → varied silhouettes, still 4 draw calls.
function enemyGeometry(key) {
  switch (key) {
    case 'drone': return <icosahedronGeometry args={[0.55, 0]} />
    case 'stalker': return <coneGeometry args={[0.5, 1.4, 5]} />
    case 'brute': return <boxGeometry args={[1.5, 1.5, 1.5]} />
    case 'sentinel': return <octahedronGeometry args={[1.4, 0]} />
    default: return <boxGeometry args={[1, 1, 1]} />
  }
}

export default function Enemies() {
  const currentArea = useStore(state => state.currentArea)
  const meshRefs = useRef([])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // eids grouped per type index + respawn bookkeeping
  const spawned = useRef([]) // [{ eid, typeIdx, deadSince }]

  const spawnEnemy = (typeIdx, playerLevel) => {
    const eid = addEntity(world)
    addComponent(world, eid, Position)
    addComponent(world, eid, Velocity)
    addComponent(world, eid, Rotation)
    addComponent(world, eid, Enemy)
    addComponent(world, eid, Health)

    const angle = Math.random() * Math.PI * 2
    const radius = 15 + Math.random() * 25
    Position.x[eid] = Math.cos(angle) * radius
    Position.y[eid] = ENEMY_TYPES[typeIdx].size * 0.5
    Position.z[eid] = Math.sin(angle) * radius

    const level = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1)
    const scaled = scaleEnemy(typeIdx, level)
    Enemy.type[eid] = typeIdx
    Enemy.level[eid] = level
    Enemy.attackTimer[eid] = 0
    Enemy.strafeDir[eid] = 0
    Health.current[eid] = scaled.hp
    Health.max[eid] = scaled.hp
    return eid
  }

  useEffect(() => {
    // Clear old enemies on area change
    spawned.current.forEach(s => removeEntity(world, s.eid))
    spawned.current = []

    const playerLevel = useStore.getState().level
    const table = AREA_SPAWNS[currentArea] || AREA_SPAWNS.hub
    for (const [typeIdx, count] of table) {
      for (let i = 0; i < count; i++) {
        spawned.current.push({ eid: spawnEnemy(typeIdx, playerLevel), typeIdx, deadSince: null })
      }
    }

    return () => {
      spawned.current.forEach(s => removeEntity(world, s.eid))
      spawned.current = []
    }
  }, [currentArea])

  useFrame(() => {
    const counts = new Array(ENEMY_TYPES.length).fill(0)
    const now = Date.now()

    for (const s of spawned.current) {
      const eid = s.eid
      const type = ENEMY_TYPES[s.typeIdx]

      // Death → sink, then respawn stronger after a delay
      if (Health.current[eid] <= 0) {
        if (s.deadSince === null) s.deadSince = now
        if (Position.y[eid] > -2.5) Position.y[eid] -= 0.05
        if (now - s.deadSince > RESPAWN_SECONDS * 1000) {
          removeEntity(world, eid)
          s.eid = spawnEnemy(s.typeIdx, useStore.getState().level)
          s.deadSince = null
          continue
        }
      }

      const mesh = meshRefs.current[s.typeIdx]
      if (!mesh) continue
      const idx = counts[s.typeIdx]++
      if (idx >= MAX_PER_TYPE) continue

      dummy.position.set(Position.x[eid], Position.y[eid], Position.z[eid])
      dummy.rotation.set(0, Rotation.y[eid], 0)
      // Wounded enemies flicker smaller; sentinels pulse
      const hpPct = Math.max(0, Health.current[eid] / Health.max[eid])
      const pulse = type.behavior === 'boss' ? 1 + Math.sin(now * 0.004) * 0.08 : 1
      dummy.scale.setScalar(type.size * (0.75 + 0.25 * hpPct) * pulse)
      dummy.updateMatrix()
      mesh.setMatrixAt(idx, dummy.matrix)
    }

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.count = Math.min(counts[i], MAX_PER_TYPE)
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <group>
      {ENEMY_TYPES.map((type, i) => (
        <instancedMesh
          key={type.key}
          ref={el => (meshRefs.current[i] = el)}
          args={[null, null, MAX_PER_TYPE]}
          castShadow
          receiveShadow
          frustumCulled={false}
        >
          {enemyGeometry(type.key)}
          <meshStandardMaterial
            color={type.color}
            roughness={0.35}
            metalness={0.8}
            emissive={type.color}
            emissiveIntensity={0.7}
          />
        </instancedMesh>
      ))}
    </group>
  )
}
