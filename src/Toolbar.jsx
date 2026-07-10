import { useStore } from './store'
import { useEffect } from 'react'

const SKILL_ICONS = {
  dash: '⚡',
  cleave: '⚔️',
  shield: '🛡️'
}

export default function Toolbar() {
  const hotbar = useStore(state => state.hotbar) || [null, null, null, null, null]
  const updateHotbar = useStore(state => state.updateHotbar)
  const triggerSkill = useStore(state => state.triggerSkill)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code)) {
        const index = parseInt(e.key) - 1
        const skill = hotbar[index]
        if (skill) {
          // Trigger skill!
          triggerSkill(skill)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hotbar])

  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e, index) => {
    e.preventDefault()
    const skillId = e.dataTransfer.getData('skillId')
    if (skillId) {
      updateHotbar(index, skillId)
    }
  }

  return (
    <div style={{
      position: 'absolute',
      right: '2rem',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
      pointerEvents: 'auto'
    }}>
      {hotbar.map((skillId, index) => (
        <div 
          key={index}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className="glass-panel"
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            position: 'relative',
            boxShadow: skillId ? '0 0 20px rgba(96, 165, 250, 0.4)' : 'none',
            border: skillId ? '2px solid rgba(96, 165, 250, 0.8)' : '1px solid rgba(255,255,255,0.1)',
            clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ transform: 'skewX(10deg)' }}>
            {skillId ? SKILL_ICONS[skillId] : ''}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontFamily: 'Orbitron',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            transform: 'skewX(10deg)'
          }}>
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  )
}
