import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CharacterModel = forwardRef(({ charClass, energyColor, isPreview = false }, ref) => {
  const groupRef = useRef()
  const weaponRef = useRef()
  
  useImperativeHandle(ref, () => ({
    get group() { return groupRef.current },
    get weapon() { return weaponRef.current }
  }))
  
  const isMage = charClass === 'mage'
  const isWarrior = charClass === 'warrior'
  const isRogue = charClass === 'rogue'

  useFrame((state, delta) => {
    if (!weaponRef.current || !isPreview) return
    // Idle rotate for preview screen only
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
    weaponRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1
  })

  return (
    <group ref={groupRef} position={[0, isPreview ? -1.5 : 1.2, 0]} scale={isPreview ? 2 : 1}>
      {/* Core Body (Cyber-suit) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Shoulders */}
      <mesh castShadow position={[0.4, 0.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.4, 0.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>

      {/* Head / Helmet */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.35, 0.4, 0.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Glowing Visor */}
      <mesh position={[0, 0.85, 0.18]}>
        <planeGeometry args={[0.25, 0.1]} />
        <meshBasicMaterial color={energyColor} />
      </mesh>

      {/* Chest Core */}
      <mesh position={[0, 0.2, 0.21]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color={energyColor} />
      </mesh>

      {/* Dynamic Weapon based on Class */}
      <group ref={weaponRef} position={[0.6, 0, 0.5]}>
        {isWarrior && (
          <group rotation={[Math.PI / 4, 0, 0]}>
            {/* Plasma Greatsword */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.6, 0.1]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[0.15, 1.2, 0.05]} />
              <meshBasicMaterial color={energyColor} />
            </mesh>
          </group>
        )}
        {isMage && (
          <group>
            {/* Floating Aether Orb */}
            <mesh>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color={energyColor} transparent opacity={0.8} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {!isPreview && <pointLight color={energyColor} intensity={2} distance={5} />}
          </group>
        )}
        {isRogue && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            {/* Energy Daggers */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.05, 0.6, 4]} />
              <meshBasicMaterial color={energyColor} />
            </mesh>
            <mesh position={[-1.2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.05, 0.6, 4]} />
              <meshBasicMaterial color={energyColor} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
})

export default CharacterModel
