import { useState, Suspense } from 'react'
import { useStore } from './store'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import CharacterModel from './CharacterModel'

const classes = [
  { id: 'warrior', name: 'Plasma Warrior', desc: 'Heavy melee combatant with plasma shields.', color: '#ef4444' },
  { id: 'mage', name: 'Technomancer', desc: 'Ranged spellcaster wielding ancient aether.', color: '#06b6d4' },
  { id: 'rogue', name: 'Cyber-Assassin', desc: 'Fast, stealthy, dual energy daggers.', color: '#a855f7' }
]

export default function CharacterSelect() {
  const setCharacterConfig = useStore(state => state.setCharacterConfig)
  const [selectedClass, setSelectedClass] = useState(classes[0])

  const handleStart = () => {
    setCharacterConfig({
      class: selectedClass.id
    })
  }

  return (
    <div className="ui-screen" style={{ display: 'flex', flexDirection: 'row', background: '#020617' }}>
      
      {/* Left Panel: Selection UI */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10 }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 2rem 0', color: 'white' }}>INITIATE UPLINK</h1>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          {classes.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedClass(c)}
              style={{
                padding: '1rem 2rem',
                background: selectedClass.id === c.id ? c.color : 'rgba(255,255,255,0.05)',
                color: selectedClass.id === c.id ? 'white' : '#94a3b8',
                border: `1px solid ${selectedClass.id === c.id ? c.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: selectedClass.color }}>{selectedClass.name}</h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem', lineHeight: '1.5' }}>{selectedClass.desc}</p>
        </div>

        <button 
          onClick={handleStart}
          style={{
            marginTop: '3rem',
            padding: '1.5rem',
            background: 'white',
            color: 'black',
            fontSize: '1.5rem',
            fontWeight: '900',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: `0 0 30px ${selectedClass.color}66`
          }}
        >
          DEPLOY TO SURFACE
        </button>
      </div>

      {/* Right Panel: 3D Model Preview! */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          
          <Suspense fallback={null}>
            <CharacterModel 
              charClass={selectedClass.id} 
              energyColor={selectedClass.color} 
              isPreview={true} 
            />
            
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
            <Environment preset="city" />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Suspense>
        </Canvas>
        
        {/* Cool technological overlay vignette */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'radial-gradient(circle at center, transparent 0%, #020617 100%)',
          pointerEvents: 'none'
        }} />
      </div>

    </div>
  )
}
