import { useState } from 'react'
import { useStore } from './store'

export default function FriendsList() {
  const friends = useStore(state => state.friends) || []
  const [isOpen, setIsOpen] = useState(false)
  
  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '8rem',
          right: '2rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          color: 'white',
          fontFamily: 'Orbitron',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: '1px solid #4ade80'
        }}
      >
        👥 FRIENDS ({friends.length})
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      bottom: '8rem',
      right: '2rem',
      width: '300px',
      maxHeight: '400px',
      borderRadius: '0.5rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #4ade80'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ margin: 0, fontFamily: 'Orbitron', color: '#4ade80' }}>FRIENDS LIST</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Orbitron' }}>X</button>
      </div>
      
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {friends.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
            No friends yet. Right-click other players to add them!
          </div>
        ) : (
          friends.map((friend, idx) => (
            <div key={idx} style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontFamily: 'Orbitron' }}>{friend}</span>
              <button style={{ background: '#3b82f6', border: 'none', color: 'white', borderRadius: '0.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>
                CHAT
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
