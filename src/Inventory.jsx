import { useStore } from './store'

export default function Inventory() {
  const isInventoryOpen = useStore(state => state.isInventoryOpen)
  const toggleInventory = useStore(state => state.toggleInventory)
  const inventory = useStore(state => state.inventory)

  if (!isInventoryOpen) return null

  return (
    <div className="ui-screen" style={{ 
      pointerEvents: 'auto', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.7)'
    }}>
      <div className="glass-panel" style={{
        width: '80%',
        height: '80%',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(96, 165, 250, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron', margin: 0, textShadow: '0 0 10px #60a5fa' }}>CYBERNETIC STASH</h2>
          <button onClick={toggleInventory} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer', fontFamily: 'Orbitron' }}>CLOSE</button>
        </div>
        
        <div style={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          overflowY: 'auto',
          alignContent: 'start'
        }}>
          {inventory.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', paddingTop: '4rem' }}>
              Your stash is empty. Defeat enemies to find loot.
            </div>
          ) : (
            inventory.map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${item.color}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                boxShadow: `0 0 15px ${item.color}40`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ color: item.color, fontFamily: 'Orbitron', fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Type: {item.id.includes('weapon') ? 'Weapon' : 'Armor'}</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Power Rating: {item.power}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
