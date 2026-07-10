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
  const toggleInventory = useStore(state => state.toggleInventory)
  
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
      <div className="top-right-hud" style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="map-btn" onClick={toggleInventory}>🎒 INVENTORY (I)</button>
        <button className="map-btn" onClick={toggleMap}>🌍 WORLD MAP (M)</button>
      </div>

      <div className="hud-container" style={{ gap: '4rem', paddingBottom: '1rem' }}>
        {/* Futuristic Health Bar (Left) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', width: '300px' }}>
          <div className="orb-label" style={{ color: '#fca5a5', paddingLeft: '1rem' }}>HEALTH</div>
          <div className="glass-panel" style={{
            width: '100%',
            height: '32px',
            position: 'relative',
            clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.2)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              width: `${healthPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
            }} />
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              opacity: 0.5
            }} />
            <span style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Orbitron',
              fontWeight: 900,
              color: 'white',
              textShadow: '0 0 5px rgba(0,0,0,1)'
            }}>{Math.floor(health)} / {maxHealth}</span>
          </div>
        </div>

        {/* Action Bar Placeholder (Center) */}
        <div className="action-bar-placeholder">
          <div className={`action-slot ${activeKeys['KeyJ'] ? 'active' : ''}`}>J</div>
          <div className={`action-slot ${activeKeys['KeyK'] ? 'active' : ''}`}>K</div>
        </div>

        {/* Futuristic Resource Bar (Right) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', width: '300px' }}>
          <div className="orb-label" style={{ color: resourceColor, paddingRight: '1rem' }}>{resourceName}</div>
          <div className="glass-panel" style={{
            width: '100%',
            height: '32px',
            position: 'relative',
            clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)',
            border: `1px solid ${resourceColor}`,
            boxShadow: `0 0 20px ${resourceColor}40`
          }}>
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              width: `${resourcePercent}%`,
              height: '100%',
              background: `linear-gradient(270deg, ${resourceColor}, ${resourceColor}88)`,
              transition: 'width 0.3s ease-out',
              boxShadow: `0 0 20px ${resourceColor}`
            }} />
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              opacity: 0.5
            }} />
            <span style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Orbitron',
              fontWeight: 900,
              color: 'white',
              textShadow: '0 0 5px rgba(0,0,0,1)'
            }}>{Math.floor(resource)} / {maxResource}</span>
          </div>
        </div>
      </div>
      
      {/* Bottom right hints */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', fontFamily: 'Orbitron', fontWeight: 600 }}>
          [I] INVENTORY
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', fontFamily: 'Orbitron', fontWeight: 600 }}>
          [M] MAP
        </div>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', fontFamily: 'Orbitron', fontWeight: 600 }}>
          [L] SKILLS
        </div>
      </div>
    </>
  )
}
