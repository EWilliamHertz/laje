import { useStore } from './store'
import { useState, useEffect } from 'react'

export default function Hud() {
  const config = useStore(state => state.characterConfig)
  const health = useStore(state => state.health)
  const maxHealth = useStore(state => state.maxHealth)
  const resource = useStore(state => state.resource)
  const maxResource = useStore(state => state.maxResource)
  const level = useStore(state => state.level)
  const xp = useStore(state => state.xp)
  const currency = useStore(state => state.currency)
  const toggleMap = useStore(state => state.toggleMap)
  
  const [activeKeys, setActiveKeys] = useState({})
  
  useEffect(() => {
    const handleKeyDown = (e) => setActiveKeys(prev => ({ ...prev, [e.code]: true }))
    const handleKeyUp = (e) => setActiveKeys(prev => ({ ...prev, [e.code]: false }))
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  if (!config) return null
  
  const healthPercent = (health / maxHealth) * 100
  const resourcePercent = (resource / maxResource) * 100
  
  let resourceColor = '#3b82f6'
  let resourceName = 'Energy'
  
  if (config.class === 'warrior') { 
    resourceColor = '#ef4444' 
    resourceName = 'Heat' 
  } else if (config.class === 'mage') { 
    resourceColor = '#06b6d4' 
    resourceName = 'Aether' 
  } else if (config.class === 'rogue') { 
    resourceColor = '#a855f7' 
    resourceName = 'Overclock' 
  }

  return (
    <>
      {/* Top Left Stats */}
      <div className="top-left-hud">
        <div className="stat-box">LEVEL {level}</div>
        <div className="stat-box">XP: {xp} / {level * 100}</div>
        <div className="stat-box currency">CREDITS: {currency}</div>
      </div>

      {/* Top Right Mini-Map / Buttons */}
      <div className="top-right-hud">
        <button className="map-btn" onClick={toggleMap}>🌍 WORLD MAP (M)</button>
      </div>

      <div className="hud-container">
        {/* Health Indicator (Left) */}
        <div className="orb-container left-orb">
          <div className="orb-label" style={{ color: '#fca5a5' }}>Health</div>
          <div className="orb health-orb">
            <div className="orb-fill" style={{ height: `${healthPercent}%`, backgroundColor: '#dc2626' }}></div>
            <div className="orb-glass"></div>
            <div className="orb-grid"></div>
          </div>
          <div className="orb-value" style={{ color: '#fca5a5' }}>{health} / {maxHealth}</div>
        </div>

        {/* Action Bar Placeholder (Center) */}
        <div className="action-bar-placeholder">
          <div className={`action-slot ${activeKeys['KeyJ'] ? 'active' : ''}`}>J</div>
          <div className={`action-slot ${activeKeys['KeyK'] ? 'active' : ''}`}>K</div>
          <div className={`action-slot ${activeKeys['KeyL'] ? 'active' : ''}`}>L</div>
          <div className={`action-slot ${activeKeys['Semicolon'] ? 'active' : ''}`}>;</div>
          <div className={`action-slot ultimate ${activeKeys['KeyU'] ? 'active' : ''}`}>U</div>
        </div>

        {/* Resource Indicator (Right) */}
        <div className="orb-container right-orb">
          <div className="orb-label" style={{ color: resourceColor }}>{resourceName}</div>
          <div className="orb resource-orb" style={{ '--resource-glow': resourceColor }}>
            <div className="orb-fill" style={{ height: `${resourcePercent}%`, backgroundColor: resourceColor }}></div>
            <div className="orb-glass"></div>
            <div className="orb-grid"></div>
          </div>
          <div className="orb-value" style={{ color: resourceColor }}>{resource} / {maxResource}</div>
        </div>
      </div>
      
      {/* Bottom right hints */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}>
          [M] MAP
        </div>
        <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white' }}>
          [K] SKILLS
        </div>
      </div>
    </>
  )
}
