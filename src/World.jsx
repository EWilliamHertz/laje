import { useRef, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { runtime, useStore } from './store'

function SpringFountain({ position }) {
  const updateHealth = useStore(state => state.updateHealth)
  const addFloatingText = useStore(state => state.addFloatingText)
  const lastHeal = useRef(0)

  useFrame(() => {
    const px = runtime.playerPos.x
    const pz = runtime.playerPos.z
    const dx = px - position[0]
    const dz = pz - position[2]
    const distSq = dx*dx + dz*dz
    
    if (distSq < 25) { // 5 radius
      const now = Date.now()
      if (now - lastHeal.current > 1000) {
        lastHeal.current = now
        const s = useStore.getState()
        if (s.health < s.maxHealth) {
          updateHealth(5)
          addFloatingText('+5 HP', [px, 2.5, pz], '#22c55e')
        }
      }
    }
  })

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.5, 0.5, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 16]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} transparent opacity={0.8} />
      </mesh>
      <pointLight color="#06b6d4" intensity={2} distance={10} position={[0, 2, 0]} />
      <Billboard position={[0, 3, 0]}>
        <Text fontSize={0.5} color="#22c55e" outlineWidth={0.05} outlineColor="black">
          HEALING SPRING
        </Text>
      </Billboard>
    </group>
  )
}

const areaConfigs = {
  cyber_forest: { floorColor: '#0f172a' },
  ruined_spire: { floorColor: '#3f3f46' },
  hub: { floorColor: '#4ade80' }
}

// Placeholder for Quest NPC
function CommanderVex() {
  const meshRef = useRef()
  const toggleQuestNPC = useStore(state => state.toggleQuestNPC)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
  })

  return (
    <group position={[-5, 0, -2]}>
      {/* Interaction zone */}
      <mesh ref={meshRef} position={[0, 1, 0]} onClick={toggleQuestNPC}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} wireframe />
      </mesh>
      {/* Hologram base */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#10b981" intensity={2} distance={5} />
      <Text position={[0, 2.5, 0]} fontSize={0.3} color="#10b981" outlineWidth={0.02} outlineColor="#000">
        CMDR VEX
      </Text>
      <Text position={[0, 2.2, 0]} fontSize={0.15} color="#cbd5e1">
        [ MISSION GIVER ]
      </Text>
    </group>
  )
}

export default function World() {
  const currentArea = useStore(state => state.currentArea)
  const setCurrentArea = useStore(state => state.setCurrentArea)
  
  const floorTex = useTexture('/floor.jpg')
  floorTex.wrapS = THREE.RepeatWrapping
  floorTex.wrapT = THREE.RepeatWrapping
  floorTex.repeat.set(40, 40)
  
  const config = areaConfigs[currentArea] || areaConfigs.hub
  const isForest = currentArea === 'cyber_forest'
  const isSpire = currentArea === 'ruined_spire'

  const stones = useMemo(() => {
    const items = []
    for (let i = 0; i < 40; i++) {
      items.push({
        position: [(Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: Math.random() * 0.8 + 0.2
      })
    }
    return items
  }, [])

  if (currentArea === 'cyber_forest') {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.2} color={config.floorColor} />
        </mesh>
        
        {[-15, 15, 30, -30].map((x, i) => (
          <group key={`tree-${i}`} position={[x, 2, x > 0 ? -20 : 20]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.4, 0.6, 6, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.6} />
            </mesh>
            <mesh position={[0, 4, 0]}>
              <dodecahedronGeometry args={[3, 1]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  if (currentArea === 'ruined_spire') {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.2} color={config.floorColor} />
        </mesh>
        
        {[-20, 20].map((x, i) => (
          <group key={`spire-${i}`} position={[x, 4, -10]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4, 8, 4]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
            <mesh position={[0, -3.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 10]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  // Default 'hub'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.2} color={config.floorColor} />
      </mesh>
      
      {stones.map((stone, i) => (
        <mesh key={i} position={stone.position} rotation={stone.rotation} scale={stone.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
      ))}

      {[-20, 20].map((x) => (
        <group key={`obelisk-${x}`} position={[x, 2, -15]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 1, 4, 4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
      
      {/* --- TELEPORTATION GATE --- */}
      <group position={[15, 0, 15]}>
        <mesh castShadow position={[0, 2, 0]}>
          <boxGeometry args={[4, 4, 1]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 2, 0.6]}>
          <planeGeometry args={[3, 3]} />
          <meshBasicMaterial color={isForest ? "#a855f7" : "#ef4444"} transparent opacity={0.8} />
        </mesh>
        <pointLight color={isForest ? "#a855f7" : "#ef4444"} intensity={2} distance={10} position={[0, 2, 1]} />
      </group>
      
      {/* --- MERCHANT NPC --- */}
      <group position={[-10, 0.5, 5]} 
        onContextMenu={(e) => { e.stopPropagation(); useStore.getState().toggleMerchant() }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 2, 1.5]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
        <Billboard position={[0, 2, 0]}>
          <Text fontSize={0.5} color="#fcd34d" outlineWidth={0.05} outlineColor="black">
            [RIGHT CLICK]
            BLACK MARKET
          </Text>
        </Billboard>
      </group>
      
      {/* --- HEALING FOUNTAIN --- */}
      <SpringFountain position={[0, 0, -10]} />
      
      {/* --- QUEST NPC --- */}
      <CommanderVex />
    </group>
  )
}
