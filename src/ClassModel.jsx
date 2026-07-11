import { useMemo, useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { createPortal } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { TIERS } from './data/items'

// KayKit Adventurers (CC0, Kay Lousberg) — rigged + fully animated.
export const CLASS_MODELS = {
  warrior: '/models/Knight.glb',   // Plasma Warrior: heavy sci-fi armor
  mage: '/models/Mage.glb',        // Technomancer: sleek aether-robes
  rogue: '/models/Rogue.glb'       // Cyber-Assassin: stealth tech suit
}

// Animation names per logical state (clips verified inside each GLB).
const ANIMS = {
  idle: 'Idle',
  run: 'Running_A',
  death: 'Death_A',
  spin: '2H_Melee_Attack_Spin',
  cast: 'Spellcast_Shoot',
  attack: {
    warrior: '2H_Melee_Attack_Slice',
    mage: 'Spellcast_Shoot',
    rogue: 'Dualwield_Melee_Attack_Slice'
  }
}

// Names of built-in prop meshes we hide so our dynamic loadout shows instead.
const BUILTIN_PROPS = /sword|knife|shield|staff|crossbow|axe|arrow|mug|spellbook|badge/i

// ── Dynamic weapon meshes, driven by the equipped item ──────────────────
function WeaponMesh({ model, tierColor, glow }) {
  switch (model) {
    case 'greatsword':
      return (
        <group rotation={[Math.PI, 0, 0]}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <boxGeometry args={[0.09, 0.5, 0.09]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[0.42, 0.08, 0.1]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.16, 1.4, 0.05]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.5 * glow + 0.5} />
          </mesh>
        </group>
      )
    case 'daggers':
      return (
        <group rotation={[Math.PI, 0, 0]}>
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.25, 6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.05, 0.6, 4]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.5 * glow + 0.5} />
          </mesh>
        </group>
      )
    case 'orb':
      return (
        <group position={[0, -0.25, 0]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.2 * glow + 0.4} transparent opacity={0.85} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )
    case 'staff':
      return (
        <group rotation={[Math.PI, 0, 0]}>
          <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 1.7, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.5 * glow + 0.5} />
          </mesh>
        </group>
      )
    case 'cannon':
      return (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow position={[0, 0, 0.25]}>
            <boxGeometry args={[0.18, 0.22, 0.7]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.3, 8]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.5 * glow + 0.5} />
          </mesh>
        </group>
      )
    case 'sword':
    default:
      return (
        <group rotation={[Math.PI, 0, 0]}>
          <mesh castShadow position={[0, 0.12, 0]}>
            <boxGeometry args={[0.07, 0.35, 0.07]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.32, 0]}>
            <boxGeometry args={[0.3, 0.06, 0.08]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[0.11, 1.0, 0.04]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={1.5 * glow + 0.5} />
          </mesh>
        </group>
      )
  }
}

const DEFAULT_WEAPON_MODEL = { warrior: 'greatsword', mage: 'orb', rogue: 'daggers' }

/**
 * Fully rigged, animated class model with a dynamic weapon loadout.
 * Props:
 *  - charClass: warrior | mage | rogue
 *  - anim: idle | run | attack | spin | cast | death
 *  - weaponItem: equipped weapon item (drives the hand mesh + tier glow)
 *  - energyColor: class accent color
 */
export default function ClassModel({ charClass = 'warrior', anim = 'idle', weaponItem = null, energyColor = '#60a5fa', scale = 1.1 }) {
  const url = CLASS_MODELS[charClass] || CLASS_MODELS.warrior
  const groupRef = useRef()
  const { scene, animations } = useGLTF(url)

  // Skeleton-aware clone so multiple characters can share the same GLB.
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene)
    c.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        if (BUILTIN_PROPS.test(o.name)) o.visible = false
      }
    })
    return c
  }, [scene])

  const { actions } = useAnimations(animations, groupRef)

  // Find the right/left hand attachment bones (GLTFLoader sanitizes 'handslot.r' → 'handslotr')
  const [handR, setHandR] = useState(null)
  useEffect(() => {
    let right = null
    clone.traverse(o => {
      const n = o.name.toLowerCase()
      if (n.includes('handslot') && /r$/.test(n)) right = o
    })
    setHandR(right)
  }, [clone])

  // Animation state machine with crossfades
  const current = useRef(null)
  useEffect(() => {
    if (!actions) return
    let clipName = anim === 'attack'
      ? (ANIMS.attack[charClass] || ANIMS.attack.warrior)
      : (ANIMS[anim] || ANIMS.idle)
    if (!actions[clipName]) clipName = ANIMS.idle
    const next = actions[clipName]
    if (!next || current.current === next) return

    if (current.current) current.current.fadeOut(0.15)
    next.reset().fadeIn(0.15).play()
    if (anim === 'death') {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else if (anim === 'attack' || anim === 'spin' || anim === 'cast') {
      next.timeScale = 1.6
    } else {
      next.timeScale = 1
    }
    current.current = next
  }, [anim, actions, charClass])

  const weaponModel = weaponItem?.model || DEFAULT_WEAPON_MODEL[charClass]
  const tier = TIERS[weaponItem?.rarity] || null
  const tierColor = tier ? weaponItem.color : energyColor
  const glow = tier ? tier.glow : 0.3

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clone} />
      {/* Dynamic weapon portaled into the hand bone */}
      {handR && createPortal(
        <WeaponMesh model={weaponModel} tierColor={tierColor} glow={glow} />,
        handR
      )}
    </group>
  )
}

useGLTF.preload(CLASS_MODELS.warrior)
useGLTF.preload(CLASS_MODELS.mage)
useGLTF.preload(CLASS_MODELS.rogue)
