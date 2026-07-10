import { useStore } from './store'

export default function Inventory() {
  const isInventoryOpen = useStore(state => state.isInventoryOpen)
  const toggleInventory = useStore(state => state.toggleInventory)
  const inventory = useStore(state => state.inventory) || []
  const equipped = useStore(state => state.equipped) || { weapon: null, armor: null }
  const equipItem = useStore(state => state.equipItem)

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
        gap: '2rem',
        border: '1px solid rgba(96, 165, 250, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron', margin: 0, textShadow: '0 0 10px #60a5fa' }}>CYBERNETIC STASH</h2>
          <button onClick={toggleInventory} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer', fontFamily: 'Orbitron' }}>CLOSE</button>
        </div>
        
        {/* Equipped Gear Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#60a5fa', margin: '0 0 1rem 0' }}>EQUIPPED WEAPON</h3>
            {equipped.weapon ? (
              <div style={{ color: equipped.weapon.color }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{equipped.weapon.name}</div>
                <div>Power: +{equipped.weapon.power} DMG</div>
              </div>
            ) : (
              <div style={{ color: '#64748b' }}>No weapon equipped</div>
            )}
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ fontFamily: 'Orbitron', color: '#a855f7', margin: '0 0 1rem 0' }}>EQUIPPED ARMOR</h3>
            {equipped.armor ? (
              <div style={{ color: equipped.armor.color }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{equipped.armor.name}</div>
                <div>Defense: +{equipped.armor.power} HP</div>
              </div>
            ) : (
              <div style={{ color: '#64748b' }}>No armor equipped</div>
            )}
          </div>
        </div>
        
        <h3 style={{ fontFamily: 'Orbitron', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: 0 }}>BACKPACK</h3>
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
              <div key={idx} onClick={() => equipItem(item)} style={{
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
                <div style={{ color: 'white', fontWeight: 'bold' }}>Power: {item.power}</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem' }}>CLICK TO EQUIP</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
