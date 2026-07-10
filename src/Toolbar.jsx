import { useStore } from './store'
import { useEffect } from 'react'

const SKILL_ICONS = {
  dash: '⚡',
  cleave: '⚔️',
  shield: '🛡️'
}

export default function Toolbar() {
  const hotbar = useStore(state => state.hotbar)
  const updateHotbar = useStore(state => state.updateHotbar)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code)) {
        const index = parseInt(e.key) - 1
        const skill = hotbar[index]
        if (skill) {
          // Trigger skill!
          useStore.getState().triggerSkill(skill)
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
      gap: '1rem',
      pointerEvents: 'auto'
    }}>
      {hotbar.map((skillId, index) => (
        <div 
          key={index}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          style={{
            width: '60px',
            height: '60px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            position: 'relative',
            boxShadow: skillId ? '0 0 15px rgba(96, 165, 250, 0.5)' : 'none'
          }}
        >
          {skillId ? SKILL_ICONS[skillId] : ''}
          <div style={{
            position: 'absolute',
            bottom: '-0.5rem',
            right: '-0.5rem',
            background: '#3b82f6',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  )
}
