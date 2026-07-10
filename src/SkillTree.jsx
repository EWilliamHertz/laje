import { useStore } from './store'

const SKILLS = [
  { id: 'dash', name: 'Phase Dash', cost: 100, desc: 'Instantly teleport forward. Evade incoming damage.' },
  { id: 'cleave', name: 'Energy Cleave', cost: 200, desc: 'Wide arc attack dealing massive area damage.' },
  { id: 'shield', name: 'Aether Shield', cost: 500, desc: 'Blocks the next 3 instances of damage.' },
]

export default function SkillTree() {
  const isSkillTreeOpen = useStore(state => state.isSkillTreeOpen)
  const toggleSkillTree = useStore(state => state.toggleSkillTree)
  const unlockSkill = useStore(state => state.unlockSkill)
  const unlockedSkills = useStore(state => state.unlockedSkills)
  const currency = useStore(state => state.currency)

  const handleDragStart = (e, skillId) => {
    e.dataTransfer.setData('skillId', skillId)
  }

  if (!isSkillTreeOpen) return null

  return (
    <div className="ui-screen" style={{ background: 'rgba(2, 6, 23, 0.95)', padding: '4rem', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
      <button 
        onClick={toggleSkillTree}
        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
      >
        ✕
      </button>

      <h1 style={{ color: '#60a5fa', fontSize: '3rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Neural Skill Matrix</h1>
      <h2 style={{ color: '#fbbf24', marginBottom: '3rem' }}>Available Data-Shards: {currency}</h2>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {SKILLS.map(skill => {
          const isUnlocked = unlockedSkills.includes(skill.id)
          const canAfford = currency >= skill.cost

          return (
            <div 
              key={skill.id}
              draggable={isUnlocked}
              onDragStart={(e) => handleDragStart(e, skill.id)}
              style={{
                background: isUnlocked ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isUnlocked ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                padding: '2rem',
                borderRadius: '1rem',
                width: '300px',
                textAlign: 'center',
                transition: 'all 0.3s',
                cursor: isUnlocked ? 'grab' : 'default'
              }}
            >
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>{skill.name}</h3>
              <p style={{ color: '#94a3b8', marginBottom: '2rem', height: '60px' }}>{skill.desc}</p>
              
              {isUnlocked ? (
                <div style={{ color: '#4ade80', fontWeight: 'bold', padding: '1rem' }}>UNLOCKED</div>
              ) : (
                <button
                  disabled={!canAfford}
                  onClick={() => unlockSkill(skill.id, skill.cost)}
                  style={{
                    background: canAfford ? '#3b82f6' : '#334155',
                    color: canAfford ? 'white' : '#94a3b8',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  UNLOCK ({skill.cost} Shards)
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
