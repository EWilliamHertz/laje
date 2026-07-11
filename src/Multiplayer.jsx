import { useEffect, useState, useRef } from 'react'
import { useStore } from './store'
import { io } from 'socket.io-client'
import ClassModel from './ClassModel'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { API_BASE } from './api'
import { world } from './ecs/world'
import { networkDamageEnemy } from './ecs/systems'

export const socket = io(API_BASE, { autoConnect: false })

export default function Multiplayer() {
  const otherPlayers = useStore(state => state.otherPlayers)
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
        useStore.getState().setOtherPlayers(others)
      })

      socket.on('player_joined', (player) => {
        useStore.getState().updateOtherPlayer(player.id, player)
      })

      socket.on('player_moved', (player) => {
        useStore.getState().updateOtherPlayer(player.id, player)
      })

      socket.on('player_left', (id) => {
        useStore.getState().removeOtherPlayer(id)
      })

      socket.on('chat_message', (msg) => {
        useStore.getState().addChatMessage(msg)
      })

      socket.on('enemy_hit', ({ enemyId, damage, hitterId }) => {
        networkDamageEnemy(world, enemyId, damage)
      })

      socket.on('party_invite', (sender) => {
        useStore.getState().addPartyInvite(sender)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `${sender.username} invited you to a party. Type /accept ${sender.username}` })
      })

      socket.on('party_update', (partyMembers) => {
        useStore.getState().setParty(partyMembers)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `Party updated!` })
      })

      socket.on('party_xp_received', (xp) => {
        useStore.getState().addLoot(xp, 0)
        useStore.getState().addFloatingText(`+${xp} Party XP`, [0, 3, 0], '#fef08a')
      })

      socket.on('duel_request', (sender) => {
        useStore.getState().addDuelRequest(sender)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `${sender.username} challenged you to a duel! Type /accept duel` })
      })

      socket.on('duel_start', (opponent) => {
        useStore.getState().setActiveDuel(opponent)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `DUEL STARTED against ${opponent.username}!` })
        useStore.getState().addFloatingText(`DUEL: ${opponent.username}!`, [0, 4, 0], '#f87171')
      })

      socket.on('duel_damage_received', (damage) => {
        const store = useStore.getState()
        const newHp = Math.max(0, store.health - damage)
        // Store health update doesn't exist directly, but we can set it via store.js... wait!
        // The player's health is stored in ECS `Health.current[playerEid]`. We can't access ECS from Multiplayer.jsx easily unless we dispatch an action.
        // Actually, store has an `applyDamage` or we can just add a global window event or Zustand action.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('laje_duel_damage', { detail: damage }))
        }
      })

      socket.on('duel_end', ({ won, opponent }) => {
        useStore.getState().setActiveDuel(null)
        if (won) {
          useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `🏆 VICTORY! You defeated ${opponent} in a duel!` })
          useStore.getState().addFloatingText('DUEL WON!', [0, 4, 0], '#fcd34d')
        }
      })

      return () => {
        socket.disconnect()
        socket.off('current_players')
        socket.off('player_joined')
        socket.off('player_moved')
        socket.off('player_left')
        socket.off('chat_message')
        socket.off('party_invite')
        socket.off('party_update')
        socket.off('party_xp_received')
        socket.off('duel_request')
        socket.off('duel_start')
        socket.off('duel_damage_received')
        socket.off('duel_end')
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
