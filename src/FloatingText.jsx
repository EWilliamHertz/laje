import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useStore } from './store'

export default function FloatingTexts() {
  const texts = useStore(state => state.floatingTexts)
  const removeText = useStore(state => state.removeFloatingText)

  return (
    <group>
      {texts.map(ft => (
        <FloatingTextItem key={ft.id} item={ft} onComplete={() => removeText(ft.id)} />
      ))}
    </group>
  )
}

function FloatingTextItem({ item, onComplete }) {
  const meshRef = useRef()
  const startTime = item.createdAt
  const completed = useRef(false)

  useFrame(() => {
    if (!meshRef.current || completed.current) return
    const elapsed = Date.now() - startTime
    
    if (elapsed > 2000) {
      completed.current = true
      onComplete()
    } else {
      // Float upwards
      meshRef.current.position.y += 0.02
      // Fade out
      meshRef.current.fillOpacity = 1 - Math.pow(elapsed / 2000, 2)
    }
  })

  return (
    <Text
      ref={meshRef}
      position={item.position}
      color={item.color}
      fontSize={0.8}
      outlineWidth={0.05}
      outlineColor="#000000"
      anchorX="center"
      anchorY="middle"
    >
      {item.text}
    </Text>
  )
}
