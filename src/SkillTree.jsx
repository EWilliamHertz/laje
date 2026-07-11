import { useStore } from './store'
import { getTree } from './data/skills'

export default function SkillTree() {
  const isSkillTreeOpen = useStore(state => state.isSkillTreeOpen)
  const toggleSkillTree = useStore(state => state.toggleSkillTree)
  const unlockSkill = useStore(state => state.unlockSkill)
  const unlockedSkills = useStore(state => state.unlockedSkills)
  const skillPoints = useStore(state => state.skillPoints)
  const level = useStore(state => state.level)
  const charClass = useStore(state => state.characterConfig?.class)

  if (!isSkillTreeOpen || !charClass) return null

  const tree = getTree(charClass)

  const handleDragStart = (e, skillId) => {
    e.dataTransfer.setData('skillId', skillId)
  }

  return (
    <div className="ui-screen" style={{ zIndex: 100, background: 'rgba(2, 6, 23, 0.95)', padding: '2.5rem', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
      <button
        onClick={toggleSkillTree}
        style={{ position: 'absolute', top: '1.5rem', right: '2rem', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
      >✕</button>

      <h1 style={{ color: tree.color, fontFamily: 'Orbitron', fontSize: '2.2rem', margin: '0 0 0.3rem 0', textTransform: 'uppercase', textShadow: `0 0 25px ${tree.color}` }}>
        {tree.className} — Neural Skill Matrix
      </h1>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', fontFamily: 'Orbitron' }}>
        <span style={{ color: '#facc15', fontWeight: 900 }}>★ {skillPoints} SKILL POINTS</span>
        <span style={{ color: '#94a3b8' }}>LEVEL {level} · +1 point per level</span>
      </div>
      <p style={{ color: '#64748b', margin: '0 0 2rem 0', fontSize: '0.85rem' }}>
        Unlock <b style={{ color: '#60a5fa' }}>ACTIVE</b> abilities and drag them onto your action bar (keys 1-5). <b style={{ color: '#4ade80' }}>PASSIVE</b> nodes empower you permanently.
      </p>

      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1300px' }}>
        {tree.branches.map(branch => (
          <div key={branch.id} style={{ flex: '1 1 300px', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ color: 'white', fontFamily: 'Orbitron', fontSize: '1.05rem', letterSpacing: '0.15em', margin: '0 0 0.2rem 0' }}>{branch.name.toUpperCase()}</h2>
            <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '1.2rem' }}>{branch.desc}</div>

            {branch.nodes.map((node, idx) => {
              const isUnlocked = unlockedSkills.includes(node.id)
              const parentOk = !node.requires || unlockedSkills.includes(node.requires)
              const levelOk = level >= (node.requiresLevel || 1)
              const canUnlock = !isUnlocked && parentOk && levelOk && skillPoints > 0
              const locked = !isUnlocked && !canUnlock

              return (
                <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {idx > 0 && (
                    <div style={{
                      width: '2px', height: '28px',
                      background: isUnlocked || parentOk ? tree.color : 'rgba(255,255,255,0.12)',
                      boxShadow: isUnlocked ? `0 0 8px ${tree.color}` : 'none'
                    }} />
                  )}
                  <div
                    draggable={isUnlocked && node.type === 'active'}
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onClick={() => canUnlock && unlockSkill(node.id)}
                    style={{
                      width: '100%',
                      background: isUnlocked ? `linear-gradient(135deg, ${tree.color}33, rgba(255,255,255,0.04))` : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${isUnlocked ? tree.color : canUnlock ? '#facc15' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '0.7rem',
                      padding: '0.9rem 1rem',
                      opacity: locked ? 0.55 : 1,
                      cursor: canUnlock ? 'pointer' : isUnlocked && node.type === 'active' ? 'grab' : 'default',
                      boxShadow: isUnlocked ? `0 0 18px ${tree.color}44` : canUnlock ? '0 0 14px rgba(250,204,21,0.3)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex', gap: '0.8rem', alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{node.icon}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontFamily: 'Orbitron', fontWeight: 700, fontSize: '0.85rem' }}>{node.name}</span>
                        <span style={{
                          fontSize: '0.55rem', fontFamily: 'Orbitron', fontWeight: 900, padding: '0.15rem 0.45rem', borderRadius: '0.25rem',
                          background: node.type === 'active' ? 'rgba(96,165,250,0.25)' : 'rgba(74,222,128,0.2)',
                          color: node.type === 'active' ? '#60a5fa' : '#4ade80'
                        }}>{node.type.toUpperCase()}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.25rem' }}>{node.desc}</div>
                      <div style={{ marginTop: '0.35rem', fontSize: '0.62rem', fontFamily: 'Orbitron' }}>
                        {isUnlocked ? (
                          <span style={{ color: '#4ade80' }}>✓ UNLOCKED{node.type === 'active' ? ' — DRAG TO ACTION BAR' : ''}</span>
                        ) : canUnlock ? (
                          <span style={{ color: '#facc15' }}>CLICK TO UNLOCK — 1 ★</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>
                            {!levelOk ? `REQUIRES LEVEL ${node.requiresLevel}` : !parentOk ? 'REQUIRES PREVIOUS NODE' : 'NO SKILL POINTS'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
