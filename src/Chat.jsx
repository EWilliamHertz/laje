import { useState, useRef, useEffect } from 'react'
import { useStore } from './store'
import { socket } from './Multiplayer'

export default function Chat() {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatMessages = useStore(state => state.chatMessages)
  const userProfile = useStore(state => state.userProfile)
  const characterConfig = useStore(state => state.characterConfig)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (inputText.trim() && socket.connected) {
      const text = inputText.trim()
      
      if (text.startsWith('/invite ')) {
        const target = text.substring(8).trim()
        socket.emit('party_invite', target)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `Inviting ${target} to party...` })
      } else if (text.startsWith('/accept ')) {
        // Find invite from username
        const target = text.substring(8).trim()
        const duelReq = useStore.getState().duelRequests.find(r => r.username.toLowerCase() === target.toLowerCase())
        const partyInv = useStore.getState().partyInvites.find(i => i.username.toLowerCase() === target.toLowerCase())
        
        if (target.toLowerCase() === 'duel' || text.startsWith('/accept duel')) {
          // If they typed "/accept duel [name]" or just "/accept duel"
          const namePart = text.replace('/accept duel', '').trim()
          let duelToAccept = null
          if (namePart) {
            duelToAccept = useStore.getState().duelRequests.find(r => r.username.toLowerCase() === namePart.toLowerCase())
          } else {
            duelToAccept = useStore.getState().duelRequests[0] // accept latest/first
          }
          if (duelToAccept) {
            socket.emit('duel_accept', duelToAccept.id)
            useStore.getState().removeDuelRequest(duelToAccept.id)
          } else {
            useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `No pending duel requests.` })
          }
        } else if (partyInv) {
          socket.emit('party_accept', partyInv.id)
          useStore.getState().removePartyInvite(partyInv.id)
        } else {
          useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `No invite from ${target}.` })
        }
      } else if (text.startsWith('/duel ')) {
        const target = text.substring(6).trim()
        socket.emit('duel_request', target)
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `Challenged ${target} to a duel...` })
      } else if (text === '/tp boss') {
        import('./store').then(({ runtime }) => {
          import('./ecs/world').then(({ Position }) => {
            if (runtime.playerEid !== null) {
              Position.x[runtime.playerEid] = 0
              Position.z[runtime.playerEid] = 0
              runtime.playerPos.x = 0
              runtime.playerPos.z = 0
            }
          })
        })
        useStore.getState().setArea('ruined_spire')
        useStore.getState().addChatMessage({ senderName: 'SYSTEM', text: `Teleporting to Boss Arena...` })
      } else {
        const senderName = characterConfig?.name || userProfile?.username || 'Unknown'
        socket.emit('chat_message', {
          senderId: socket.id,
          senderName: senderName,
          text: text,
          timestamp: Date.now()
        })
      }
      setInputText('')
    }
    setIsTyping(false)
    if (document.activeElement?.tagName === 'INPUT') {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    // Global hotkey to focus chat when pressing Enter
    const handleKeyDown = (e) => {
      // Don't intercept if they are typing in another input field (like login)
      if (document.activeElement?.tagName === 'INPUT' && !isTyping) return;

      if (e.key === 'Enter') {
        if (!isTyping) {
          e.preventDefault()
          setIsTyping(true)
        }
        // If they ARE typing, the <form onSubmit> handles the submission!
      } else if (e.key === 'Escape' && isTyping) {
        setIsTyping(false)
        if (document.activeElement?.tagName === 'INPUT') {
          document.activeElement.blur()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTyping])

  return (
    <div style={{
      position: 'absolute',
      bottom: '120px', // Above toolbar
      left: '20px',
      width: '350px',
      maxHeight: '250px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      pointerEvents: 'none', // Pass clicks through
      zIndex: 50,
      fontFamily: 'Orbitron, sans-serif'
    }}>
      <div style={{
        overflowY: 'auto',
        maxHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '10px',
        textShadow: '1px 1px 2px black',
        pointerEvents: 'auto'
      }}>
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', alignSelf: 'flex-start' }}>
            <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>[{msg.senderName}]: </span>
            <span style={{ color: 'white' }}>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ pointerEvents: 'auto' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Press Enter to chat..."
          style={{
            width: '100%',
            background: isTyping ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0,0,0,0.2)',
            border: isTyping ? '1px solid #3b82f6' : '1px solid transparent',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            outline: 'none',
            fontFamily: 'inherit',
            opacity: isTyping ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
          onFocus={() => setIsTyping(true)}
          onBlur={() => setIsTyping(false)}
          ref={input => isTyping && input && input.focus()}
        />
      </form>
    </div>
  )
}
