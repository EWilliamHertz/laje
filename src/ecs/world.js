import { createWorld } from 'bitecs'

export const world = createWorld({
  components: {
    Position: { x: new Float32Array(1e4), y: new Float32Array(1e4), z: new Float32Array(1e4) },
    Velocity: { x: new Float32Array(1e4), y: new Float32Array(1e4), z: new Float32Array(1e4) },
    Rotation: { y: new Float32Array(1e4) },
    PlayerControls: {
      forward: new Uint8Array(1e4),
      backward: new Uint8Array(1e4),
      left: new Uint8Array(1e4),
      right: new Uint8Array(1e4)
    },
    PlayerAttack: { action: new Uint8Array(1e4), cooldown: new Float32Array(1e4) },
    Enemy: {
      type: new Uint8Array(1e4),        // index into ENEMY_TYPES
      level: new Uint8Array(1e4),       // scaled enemy level
      attackTimer: new Float32Array(1e4), // time until next hit
      strafeDir: new Int8Array(1e4),    // flanking direction (-1 / 1)
      serverId: new Float32Array(1e4)   // deterministic ID for multiplayer sync
    },
    Health: { current: new Float32Array(1e4), max: new Float32Array(1e4) }
  }
})

export const { Position, Velocity, Rotation, PlayerControls, PlayerAttack, Enemy, Health } = world.components
