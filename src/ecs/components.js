import { defineComponent, Types } from 'bitecs'

// Component storing x, y, z floats
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
})

// Component storing velocity vectors
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
})

// Component storing rotation around Y axis
export const Rotation = defineComponent({
  y: Types.f32,
})

// Component mapping to player keyboard states
export const PlayerControls = defineComponent({
  forward: Types.ui8,
  backward: Types.ui8,
  left: Types.ui8,
  right: Types.ui8,
})
