import { useEffect, useState, useRef } from 'react'
import { useStore } from './store'
import { io } from 'socket.io-client'
import ClassModel from './ClassModel'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { API_BASE } from './api'

export const socket = io(API_BASE, { autoConnect: false })

export default function Multiplayer() {
  const [otherPlayers, setOtherPlayers] = useState({})
  const isLoggedIn = useStore(state => state.isLoggedIn)
  const config = useStore(state => state.characterConfig)
  const userProfile = useStore(state => state.userProfile)

  useEffect(() => {
    if (isLoggedIn && config && userProfile) {
      socket.connect()
      socket.emit('join_world', {
        username: config.name || userProfile.username,
        class: config.class,
        level: useStore.getState().level
      })

      socket.on('current_players', (players) => {
        const others = { ...players }
        delete others[socket.id]
        setOtherPlayers(others)
      })

      socket.on('player_joined', (player) => {
        setOtherPlayers(prev => ({ ...prev, [player.id]: player }))
      })

      socket.on('player_moved', (player) => {
        setOtherPlayers(prev => ({ ...prev, [player.id]: player }))
      })

      socket.on('player_left', (id) => {
        setOtherPlayers(prev => {
          const newPlayers = { ...prev }
          delete newPlayers[id]
          return newPlayers
        })
      })

      return () => {
        socket.disconnect()
        socket.off('current_players')
        socket.off('player_joined')
        socket.off('player_moved')
        socket.off('player_left')
      }
    }
  }, [isLoggedIn, config, userProfile])

  return (
    <group>
      {Object.values(otherPlayers).map(p => (
        <OtherPlayer key={p.id} player={p} />
      ))}
    </group>
  )
}

function OtherPlayer({ player }) {
  const groupRef = useRef()
  const isMage = player.class === 'mage'
  const isWarrior = player.class === 'warrior'
  const energyColor = isMage ? '#06b6d4' : isWarrior ? '#ef4444' : '#a855f7'

  const anim = player.isAttacking ? 'attack' : player.isMoving ? 'run' : 'idle'

  // Smoothly interpolate other players' movements
  useFrame(() => {
    if (groupRef.current && player.position) {
      groupRef.current.position.lerp(new THREE.Vector3(...player.position), 0.2)
      const diff = player.rotation - groupRef.current.rotation.y
      const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff))
      groupRef.current.rotation.y += normalizedDiff * 0.2
    }
  })

  return (
    <group
      ref={groupRef}
      position={player.position || [0, 0, 0]}
      onContextMenu={(e) => {
        e.stopPropagation()
        useStore.getState().addFriend(player.username)
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <ClassModel
        charClass={player.class}
        anim={anim}
        weaponItem={player.equippedWeapon || null}
        energyColor={energyColor}
      />

      {/* Player Name Tag */}
      <Billboard position={[0, 2.6, 0]}>
        <Text fontSize={0.4} color="white" outlineWidth={0.05} outlineColor="black">
          {player.level ? `[${player.level}] ` : ''}{player.username}
        </Text>
      </Billboard>

      {/* Target/Selection Ring */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color={energyColor} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
