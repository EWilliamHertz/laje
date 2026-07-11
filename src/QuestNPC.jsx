import { useStore } from './store'

export default function QuestNPC() {
  const isQuestNPCOpen = useStore(state => state.isQuestNPCOpen)
  const toggleQuestNPC = useStore(state => state.toggleQuestNPC)
  const activeQuest = useStore(state => state.activeQuest)
  const acceptQuest = useStore(state => state.acceptQuest)

  if (!isQuestNPCOpen) return null

  // Hardcoded quest for now
  const availableQuest = {
    id: 'q_drone_hunter',
    title: 'Sentry Drone Purge',
    description: 'The automated sentry drones have malfunctioned. Destroy 5 of them to clear the area.',
    targetEnemyType: 0, // Drones
    targetCount: 5,
    rewardXp: 150,
    rewardCredits: 50
  }

  return (
    <div className="ui-screen" style={{ 
      pointerEvents: 'auto', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.8)',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '50%',
        height: '60%',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        border: '1px solid rgba(16, 185, 129, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Orbitron', margin: 0, textShadow: '0 0 10px #10b981', color: '#6ee7b7' }}>COMMANDER VEX</h2>
          <button onClick={toggleQuestNPC} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer', fontFamily: 'Orbitron' }}>LEAVE</button>
        </div>

        {/* Content */}
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflowY: 'auto',
          paddingTop: '1rem'
        }}>
          {activeQuest ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <h3 style={{ fontFamily: 'Orbitron', color: '#f59e0b' }}>ACTIVE MISSION</h3>
              <p style={{ fontSize: '1.2rem' }}>{activeQuest.title}</p>
              <p style={{ color: '#94a3b8' }}>{activeQuest.description}</p>
              <div style={{ fontSize: '2rem', fontFamily: 'Orbitron', color: '#10b981', margin: '1rem 0' }}>
                {activeQuest.currentCount} / {activeQuest.targetCount}
              </div>
              <p style={{ color: '#94a3b8' }}>Return to the field to complete your objective.</p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: `1px solid #10b981`,
              borderRadius: '0.5rem',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{ margin: 0, color: '#34d399', fontFamily: 'Orbitron' }}>{availableQuest.title}</h3>
              <p style={{ color: '#cbd5e1' }}>{availableQuest.description}</p>
              
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.25rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Objective</div>
                  <div style={{ fontWeight: 'bold' }}>Destroy {availableQuest.targetCount} Drones</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Rewards</div>
                  <div style={{ fontWeight: 'bold', color: '#fcd34d' }}>{availableQuest.rewardXp} XP, {availableQuest.rewardCredits} CR</div>
                </div>
              </div>

              <button 
                onClick={() => acceptQuest(availableQuest)}
                style={{ 
                  marginTop: '1rem', 
                  background: '#10b981', 
                  border: 'none', 
                  padding: '1rem', 
                  color: 'black', 
                  fontFamily: 'Orbitron', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  borderRadius: '0.25rem',
                  fontSize: '1.1rem'
                }}
              >
                ACCEPT MISSION
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
