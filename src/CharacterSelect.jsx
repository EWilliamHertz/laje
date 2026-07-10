import { useState } from 'react'
import { useStore } from './store'

const RACES = [
  { id: 'human', name: 'Neo-Terran' },
  { id: 'elf', name: 'Aether-Elf' },
  { id: 'cyborg', name: 'Forged' },
]

const CLASSES = [
  { id: 'warrior', name: 'Plasma Warrior' },
  { id: 'mage', name: 'Technomancer' },
  { id: 'rogue', name: 'Cyber-Assassin' },
]

export default function CharacterSelect() {
  const setCharacterConfig = useStore(state => state.setCharacterConfig)
  
  const [race, setRace] = useState(RACES[0].id)
  const [charClass, setCharClass] = useState(CLASSES[0].id)

  const handleStart = () => {
    setCharacterConfig({ race, class: charClass })
  }

  return (
    <div className="character-select-container">
      <div className="character-select-box">
        <h1 className="title">LAJE'S</h1>
        <p className="subtitle">Select your lineage and combat matrix</p>
        
        <div className="options-grid">
          <div className="option-column">
            <h3>Race</h3>
            {RACES.map(r => (
              <button 
                key={r.id} 
                className={`option-btn ${race === r.id ? 'active' : ''}`}
                onClick={() => setRace(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className="option-column">
            <h3>Class</h3>
            {CLASSES.map(c => (
              <button 
                key={c.id} 
                className={`option-btn ${charClass === c.id ? 'active' : ''}`}
                onClick={() => setCharClass(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <button className="start-btn" onClick={handleStart}>
          INITIALIZE SEQUENCE
        </button>
      </div>
    </div>
  )
}
