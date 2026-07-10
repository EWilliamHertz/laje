import { useRef, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { Billboard, Text } from '@react-three/drei'
import { useStore } from './store'
import { useFrame } from '@react-three/fiber'

const areaConfigs = {
  cyber_forest: { floorColor: '#0f172a' },
  ruined_spire: { floorColor: '#3f3f46' },
  hub: { floorColor: '#4ade80' }
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
    </group>
  )
}
