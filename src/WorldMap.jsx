import { useStore } from './store'

const AREAS = [
  { id: 'hub', name: 'Aegis Hub', x: 50, y: 70 },
  { id: 'cyber_forest', name: 'Neon Thicket', x: 25, y: 30 },
  { id: 'ruined_spire', name: 'Obsidian Spire', x: 75, y: 25 },
]

export default function WorldMap() {
  const isMapOpen = useStore(state => state.isMapOpen)
  const setArea = useStore(state => state.setArea)
  const toggleMap = useStore(state => state.toggleMap)
  
  if (!isMapOpen) return null

  return (
    <div className="world-map-overlay" onClick={toggleMap}>
      <div className="world-map-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={toggleMap}>X</button>
        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Global Navigation</h2>
        <div className="map-grid">
          {AREAS.map(area => (
            <div 
              key={area.id} 
              className="map-node" 
              style={{ top: `${area.y}%`, left: `${area.x}%` }}
              onClick={() => setArea(area.id)}
            >
              <div className="node-point"></div>
              <div className="node-label">{area.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
