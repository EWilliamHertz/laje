import { useState } from 'react'
import { useStore } from './store'

export default function Merchant() {
  const isMerchantOpen = useStore(state => state.isMerchantOpen)
  const toggleMerchant = useStore(state => state.toggleMerchant)
  const inventory = useStore(state => state.inventory)
  const currency = useStore(state => state.currency)
  const buyItem = useStore(state => state.buyItem)
  const sellItem = useStore(state => state.sellItem)
  
  const [activeTab, setActiveTab] = useState('buy') // 'buy' or 'sell'

  if (!isMerchantOpen) return null

  // Procedurally generated shop inventory
  const shopItems = [
    { id: 'weapon_shop_1', name: 'Laser Katana', rarity: 'Rare', color: '#3b82f6', power: 45, cost: 500 },
    { id: 'weapon_shop_2', name: 'Plasma Cannon', rarity: 'Epic', color: '#a855f7', power: 85, cost: 1200 },
    { id: 'armor_shop_1', name: 'Nanoweave Suit', rarity: 'Rare', color: '#3b82f6', power: 50, cost: 600 },
    { id: 'armor_shop_2', name: 'Aegis Exoskeleton', rarity: 'Legendary', color: '#f59e0b', power: 150, cost: 3000 },
  ]

  return (
    <div className="ui-screen" style={{ 
      pointerEvents: 'auto', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.8)'
    }}>
      <div className="glass-panel" style={{
        width: '60%',
        height: '70%',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        border: '1px solid rgba(245, 158, 11, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron', margin: 0, textShadow: '0 0 10px #f59e0b', color: '#fcd34d' }}>BLACK MARKET CYBER-VENDOR</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Orbitron', color: '#34d399', fontWeight: 'bold' }}>{currency} CREDITS</span>
            <button onClick={toggleMerchant} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer', fontFamily: 'Orbitron' }}>LEAVE</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('buy')}
            style={{ flex: 1, padding: '1rem', fontFamily: 'Orbitron', cursor: 'pointer', background: activeTab === 'buy' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.5)', border: '1px solid #f59e0b', color: 'white', fontWeight: 'bold' }}
          >
            BUY GEAR
          </button>
          <button 
            onClick={() => setActiveTab('sell')}
            style={{ flex: 1, padding: '1rem', fontFamily: 'Orbitron', cursor: 'pointer', background: activeTab === 'sell' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.5)', border: '1px solid #f59e0b', color: 'white', fontWeight: 'bold' }}
          >
            SELL SCRAP
          </button>
        </div>

        {/* Content */}
        <div style={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          overflowY: 'auto',
          alignContent: 'start',
          paddingTop: '1rem'
        }}>
          {activeTab === 'buy' ? (
            shopItems.map(item => (
              <div key={item.id} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${item.color}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ color: item.color, fontFamily: 'Orbitron', fontWeight: 'bold' }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Type: {item.id.includes('weapon') ? 'Weapon' : 'Armor'}</div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>Power: {item.power}</div>
                <button 
                  onClick={() => buyItem(item, item.cost)}
                  disabled={currency < item.cost}
                  style={{ 
                    marginTop: 'auto', 
                    background: currency >= item.cost ? '#34d399' : '#64748b', 
                    border: 'none', 
                    padding: '0.5rem', 
                    color: 'black', 
                    fontFamily: 'Orbitron', 
                    fontWeight: 'bold', 
                    cursor: currency >= item.cost ? 'pointer' : 'not-allowed',
                    borderRadius: '0.25rem'
                  }}
                >
                  BUY ({item.cost} CR)
                </button>
              </div>
            ))
          ) : (
            inventory.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', paddingTop: '2rem' }}>You have no items to sell.</div>
            ) : (
              inventory.map((item, idx) => {
                const sellPrice = item.power * 2
                return (
                  <div key={idx} style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${item.color}`,
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ color: item.color, fontFamily: 'Orbitron', fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Type: {item.id.includes('weapon') ? 'Weapon' : 'Armor'}</div>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>Power: {item.power}</div>
                    <button 
                      onClick={() => sellItem(item)}
                      style={{ 
                        marginTop: 'auto', 
                        background: '#f59e0b', 
                        border: 'none', 
                        padding: '0.5rem', 
                        color: 'black', 
                        fontFamily: 'Orbitron', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        borderRadius: '0.25rem'
                      }}
                    >
                      SELL (+{sellPrice} CR)
                    </button>
                  </div>
                )
              })
            )
          )}
        </div>
      </div>
    </div>
  )
}
