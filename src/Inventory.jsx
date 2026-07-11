import { useStore } from './store'

export default function Inventory() {
  const isInventoryOpen = useStore(state => state.isInventoryOpen)
  const toggleInventory = useStore(state => state.toggleInventory)
  const inventory = useStore(state => state.inventory) || []
  const equipped = useStore(state => state.equipped) || { weapon: null, armor: null }
  const equipItem = useStore(state => state.equipItem)
  const consumeItem = useStore(state => state.consumeItem)

  if (!isInventoryOpen) return null

  return (
    <div className="ui-screen" style={{ 
      pointerEvents: 'auto', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 100
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
              <div 
                key={idx} 
                draggable={true}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                onClick={() => item.type === 'consumable' ? consumeItem(item) : equipItem(item)} 
                style={{ 
                  background: 'rgba(0,0,0,0.5)', 
                  border: `1px solid ${item.color}88`, 
                  borderRadius: '0.25rem', 
                  padding: '1rem',
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'grab',
                  position: 'relative'
                }}
              >
                {item.type === 'consumable' && (item.qty || 1) > 1 && (
                  <div style={{
                    position: 'absolute', top: '0.4rem', right: '0.5rem',
                    background: 'rgba(96,165,250,0.25)', border: '1px solid rgba(96,165,250,0.6)',
                    borderRadius: '0.25rem', padding: '0.1rem 0.4rem',
                    fontFamily: 'Orbitron', fontSize: '0.7rem', fontWeight: 900, color: '#93c5fd'
                  }}>x{item.qty}</div>
                )}
                <div style={{ color: item.color, fontWeight: 'bold', textAlign: 'center', fontSize: '0.9rem' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Type: {item.type === 'consumable' ? 'Consumable' : (item.id.includes('weapon') ? 'Weapon' : 'Armor')}</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{item.type === 'consumable' ? 'Effect' : 'Power'}: {item.power}</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                  {item.type === 'consumable' ? 'CLICK TO USE' : 'CLICK TO EQUIP'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
