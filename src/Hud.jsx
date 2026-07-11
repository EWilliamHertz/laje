import { useEffect, useRef, memo, useState } from 'react'
import { query } from 'bitecs'
import { useStore, runtime } from './store'
import { world, Position, Enemy, Health } from './ecs/world'
import { ENEMY_TYPES } from './data/items'
import { xpForLevel, CLASS_STATS } from './data/progression'
import { ABILITIES } from './data/skills'

/*
 * Hyper-modern sci-fi HUD.
 * Every element is its own memoized component with a razor-thin zustand
 * selector, so combat-frequency updates (health/resource ticks) only
 * re-render the orb that changed — never the whole overlay.
 */

// ── Health / Resource orbs ───────────────────────────────────────────────
function Orb({ value, max, color, label, align }) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{
        width: '110px', height: '110px', borderRadius: '50%', position: 'relative', overflow: 'hidden',
        border: `2px solid ${color}88`, background: 'rgba(2,6,23,0.85)',
        boxShadow: `0 0 25px ${color}44, inset 0 0 20px rgba(0,0,0,0.8)`
      }}>
        {/* liquid fill */}
        <div style={{
          position: 'absolute', left: 0, bottom: 0, width: '100%', height: `${pct * 100}%`,
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
          boxShadow: `0 0 30px ${color}`, transition: 'height 0.25s ease-out'
        }} />
        {/* liquid surface shimmer */}
        <div style={{
          position: 'absolute', left: 0, bottom: `${pct * 100}%`, width: '100%', height: '4px',
          background: 'rgba(255,255,255,0.5)', filter: 'blur(1px)', transition: 'bottom 0.25s ease-out'
        }} />
        {/* glass highlight */}
        <div style={{
          position: 'absolute', top: '8%', left: '18%', width: '30%', height: '18%',
          borderRadius: '50%', background: 'rgba(255,255,255,0.25)', filter: 'blur(3px)'
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem', color: 'white', textShadow: '0 0 6px black'
        }}>
          {Math.floor(value)}
        </div>
      </div>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.6rem', letterSpacing: '0.25em', color, textShadow: `0 0 8px ${color}` }}>{label}</div>
    </div>
  )
}

const HealthOrb = memo(function HealthOrb() {
  const health = useStore(s => Math.floor(s.health))
  const maxHealth = useStore(s => s.maxHealth)
  return <Orb value={health} max={maxHealth} color="#ef4444" label="VITALS" />
})

const ResourceOrb = memo(function ResourceOrb() {
  const resource = useStore(s => Math.floor(s.resource))
  const maxResource = useStore(s => s.maxResource)
  const charClass = useStore(s => s.characterConfig?.class || 'mage')
  const color = charClass === 'warrior' ? '#f59e0b' : '#3b82f6'
  return <Orb value={resource} max={maxResource} color={color} label={charClass === 'warrior' ? 'RAGE' : 'MANA'} />
})

const QuestTracker = memo(function QuestTracker() {
  const activeQuest = useStore(s => s.activeQuest)
  
  if (!activeQuest) return null

  return (
    <div style={{
      position: 'absolute', top: '1.5rem', right: '1.5rem', pointerEvents: 'none',
      background: 'rgba(15, 23, 42, 0.7)', border: '1px solid #10b981',
      borderRadius: '0.5rem', padding: '1rem', color: 'white', width: '250px',
      boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'Orbitron', color: '#34d399', fontSize: '0.9rem' }}>ACTIVE MISSION</h3>
      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{activeQuest.title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Progress:</span>
        <span style={{ fontFamily: 'Orbitron', color: activeQuest.currentCount >= activeQuest.targetCount ? '#10b981' : '#f59e0b' }}>
          {activeQuest.currentCount} / {activeQuest.targetCount}
        </span>
      </div>
      <div style={{ 
        width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', 
        borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden'
      }}>
        <div style={{ 
          height: '100%', width: `${Math.min(100, (activeQuest.currentCount / activeQuest.targetCount) * 100)}%`, 
          background: '#10b981', transition: 'width 0.3s ease-out' 
        }} />
      </div>
    </div>
  )
})

const BossHealthBar = memo(function BossHealthBar() {
  const containerRef = useRef(null)
  const barRef = useRef(null)
  const textRef = useRef(null)
  const nameRef = useRef(null)
  
  useEffect(() => {
    let raf
    const tick = () => {
      const enemies = query(world, [Enemy, Health])
      let foundBoss = null
      for (const eid of enemies) {
        const typeIdx = Enemy.type[eid]
        const typeDef = ENEMY_TYPES[typeIdx]
        if (typeDef && typeDef.behavior === 'boss' && Health.current[eid] > 0) {
          foundBoss = {
            name: typeDef.name,
            hp: Health.current[eid],
            maxHp: Health.max[eid],
            color: typeDef.color
          }
          break
        }
      }
      
      if (containerRef.current) {
        if (foundBoss) {
          containerRef.current.style.display = 'flex'
          if (nameRef.current) nameRef.current.textContent = foundBoss.name.toUpperCase()
          if (textRef.current) textRef.current.textContent = `${Math.ceil(foundBoss.hp)} / ${Math.ceil(foundBoss.maxHp)}`
          if (barRef.current) {
            const pct = Math.max(0, Math.min(100, (foundBoss.hp / foundBoss.maxHp) * 100))
            barRef.current.style.width = `${pct}%`
            barRef.current.style.background = `linear-gradient(90deg, #9f1239, ${foundBoss.color})`
          }
        } else {
          containerRef.current.style.display = 'none'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={containerRef} style={{
      position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)',
      width: '600px', pointerEvents: 'none', display: 'none', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
      textShadow: '0 0 10px black', zIndex: 1000
    }}>
      <h2 ref={nameRef} style={{ fontFamily: 'Orbitron', margin: 0, color: '#f43f5e', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.2em' }}>
        BOSS NAME
      </h2>
      <div style={{
        width: '100%', height: '24px', background: 'rgba(15, 23, 42, 0.8)', border: `2px solid #f43f5e`,
        borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: `0 0 20px rgba(244,63,94,0.4)`
      }}>
        <div ref={barRef} style={{
          height: '100%', width: `100%`, background: `linear-gradient(90deg, #9f1239, #f43f5e)`,
          transition: 'width 0.1s linear'
        }} />
        <div ref={textRef} style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Orbitron', fontWeight: 'bold', color: 'white', fontSize: '0.85rem'
        }}>
          0 / 0
        </div>
      </div>
    </div>
  )
})

// ── XP bar ───────────────────────────────────────────────────────────────
const XpBar = memo(function XpBar() {
  const xp = useStore(s => s.xp)
  const level = useStore(s => s.level)
  const needed = xpForLevel(level)
  const pct = Math.min(100, (xp / needed) * 100)
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'Orbitron', fontSize: '0.6rem', color: '#facc15', whiteSpace: 'nowrap' }}>LV {level}</span>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(250,204,21,0.25)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ca8a04, #facc15)', boxShadow: '0 0 8px #facc15', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{xp}/{needed}</span>
    </div>
  )
})

let hoveredSlot = null;

const ActionBarsContainer = memo(function ActionBarsContainer() {
  const triggerSkill = useStore(s => s.triggerSkill)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      if (hoveredSlot !== null) {
        useStore.getState().updateKeybind(hoveredSlot, e.code)
        return
      }
      
      let index = useStore.getState().keybinds.indexOf(e.code);
      if (index !== -1) {
        const slotId = useStore.getState().hotbar[index]
        if (!slotId) return;
        const ability = ABILITIES[slotId]
        if (ability) {
          useStore.getState().triggerSkill(slotId)
        } else {
          const item = useStore.getState().inventory.find(i => i.id === slotId)
          if (item && item.type === 'consumable') useStore.getState().consumeItem(item)
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [triggerSkill])

  return <ActionBarGroup startIdx={0} endIdx={5} vertical={false} />
})

const ActionBarGroup = memo(function ActionBarGroup({ startIdx, endIdx, vertical }) {
  const hotbar = useStore(s => s.hotbar)
  const keybinds = useStore(s => s.keybinds) || ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0']
  const inventory = useStore(s => s.inventory)
  const updateHotbar = useStore(s => s.updateHotbar)
  const overlayRefs = useRef([])

  useEffect(() => {
    let raf
    const tick = () => {
      const hb = useStore.getState().hotbar
      for (let i = startIdx; i < endIdx; i++) {
        const skillId = hb[i]
        const el = overlayRefs.current[i - startIdx]
        if (!el) continue
        const cd = skillId ? runtime.cooldowns[skillId] : null
        if (cd && cd.readyAt > Date.now()) {
          const remaining = (cd.readyAt - Date.now()) / 1000
          const frac = Math.min(1, remaining / cd.duration)
          el.style.opacity = '1'
          el.style.background = `conic-gradient(rgba(2,6,23,0.85) ${frac * 360}deg, transparent 0deg)`
          el.textContent = remaining > 1 ? Math.ceil(remaining) : remaining.toFixed(1)
        } else {
          el.style.opacity = '0'
          el.textContent = ''
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startIdx, endIdx])

  const handleDrop = (e, index) => {
    e.preventDefault()
    const skillId = e.dataTransfer.getData('skillId') || e.dataTransfer.getData('text/plain')
    if (skillId) updateHotbar(index, skillId)
  }

  const renderSlot = (slotId, index) => {
    const ability = slotId ? ABILITIES[slotId] : null
    const item = (!ability && slotId) ? inventory.find(i => i.id === slotId) : null
    let displayChar = keybinds[index] ? keybinds[index].replace('Key', '').replace('Digit', '') : '?'
    
    // Fallback display if it's an item (no icon but name instead)
    const innerContent = ability ? (
      <span>{ability.icon}</span>
    ) : item ? (
      <span style={{ fontSize: '0.6rem', color: item.color, textAlign: 'center', lineHeight: '1' }}>{item.name.substring(0, 4)}</span>
    ) : null;
    
    const title = ability ? `${ability.name} — ${ability.cost} energy` 
                : item ? `${item.name}` 
                : 'Drag a skill or consumable here'

    return (
      <div
        key={index}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, index)}
        onMouseEnter={() => { hoveredSlot = index }}
        onMouseLeave={() => { if (hoveredSlot === index) hoveredSlot = null }}
        title={title}
        style={{
          width: '58px', height: '58px', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.7rem', borderRadius: '0.5rem',
          background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)',
          border: slotId ? (item ? `1px solid ${item.color}70` : '1px solid rgba(96,165,250,0.7)') : '1px solid rgba(255,255,255,0.12)',
          boxShadow: slotId ? (item ? `0 0 15px ${item.color}35` : '0 0 15px rgba(96,165,250,0.35)') : 'none',
          clipPath: 'polygon(12% 0, 100% 0, 88% 100%, 0 100%)'
        }}
      >
        {innerContent}
        <div
          ref={el => (overlayRefs.current[index - startIdx] = el)}
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron', fontWeight: 900, fontSize: '0.9rem', color: '#facc15',
            pointerEvents: 'none', opacity: 0
          }}
        />
        <div style={{
          position: 'absolute', top: '2px', right: '8px',
          fontFamily: 'Orbitron', fontSize: '0.55rem', fontWeight: 900, color: '#60a5fa'
        }}>{displayChar}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: '0.5rem' }}>
      {hotbar.slice(startIdx, endIdx).map((slotId, loopIndex) => renderSlot(slotId, startIdx + loopIndex))}
    </div>
  )
})

// ── Minimap radar: canvas driven by rAF, reads ECS directly ─────────────
const Minimap = memo(function Minimap() {
  const canvasRef = useRef()

  useEffect(() => {
    let raf
    const SIZE = 160
    const RANGE = 45 // world units shown
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      const half = SIZE / 2
      const scale = half / RANGE

      ctx.clearRect(0, 0, SIZE, SIZE)
      // circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(half, half, half - 1, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = 'rgba(2, 6, 23, 0.78)'
      ctx.fillRect(0, 0, SIZE, SIZE)
      // grid rings
      ctx.strokeStyle = 'rgba(96,165,250,0.18)'
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath()
        ctx.arc(half, half, (half / 3) * r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(half, 0); ctx.lineTo(half, SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, half); ctx.lineTo(SIZE, half); ctx.stroke()

      const px = runtime.playerPos.x
      const pz = runtime.playerPos.z

      // enemies
      for (const eid of query(world, [Enemy, Position, Health])) {
        if (Health.current[eid] <= 0) continue
        const dx = (Position.x[eid] - px) * scale
        const dz = (Position.z[eid] - pz) * scale
        if (dx * dx + dz * dz > half * half) continue
        const type = ENEMY_TYPES[Enemy.type[eid]] || ENEMY_TYPES[0]
        ctx.fillStyle = type.color
        ctx.beginPath()
        ctx.arc(half + dx, half + dz, type.behavior === 'boss' ? 4 : 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // player blip
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#60a5fa'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(half, half, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()

      // bezel
      ctx.strokeStyle = 'rgba(96,165,250,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(half, half, half - 1, 0, Math.PI * 2)
      ctx.stroke()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} width={160} height={160} style={{ display: 'block' }} />
})

// ── Party UI ────────────────────────────────────────────────────────────
const PartyHUD = memo(function PartyHUD() {
  const party = useStore(s => s.party)
  const otherPlayers = useStore(s => s.otherPlayers)

  if (!party || party.length === 0) return null

  return (
    <div style={{ position: 'absolute', top: '4rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'auto' }}>
      {party.map((member, i) => {
        // Find their live health from otherPlayers
        const liveData = otherPlayers[member.id]
        const hp = liveData?.health ?? 100
        const maxHp = liveData?.maxHealth ?? 100
        const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))

        return (
          <div key={i} style={{
            background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(96,165,250,0.5)', borderRadius: '0.4rem',
            padding: '0.5rem', width: '180px', display: 'flex', flexDirection: 'column', gap: '0.3rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.7rem', color: '#60a5fa', fontWeight: 'bold' }}>
                {member.username}
              </div>
              <div style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: '#94a3b8' }}>
                {Math.floor(hp)} / {Math.floor(maxHp)}
              </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', transition: 'width 0.2s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
})

// ── Top bar: identity, credits, save status, buttons ────────────────────
const TopBar = memo(function TopBar() {
  const name = useStore(s => s.characterConfig?.name)
  const level = useStore(s => s.level)
  const currency = useStore(s => s.currency)
  const skillPoints = useStore(s => s.skillPoints)
  const area = useStore(s => s.currentArea)
  const saveState = useStore(s => s.saveState)
  const toggleMap = useStore(s => s.toggleMap)
  const toggleInventory = useStore(s => s.toggleInventory)
  const toggleSkillTree = useStore(s => s.toggleSkillTree)
  const exitToCharacterSelect = useStore(s => s.exitToCharacterSelect)

  const areaNames = { hub: 'NEXUS HUB', cyber_forest: 'CYBER FOREST', ruined_spire: 'RUINED SPIRE' }
  const chip = {
    fontFamily: 'Orbitron', fontSize: '0.7rem', fontWeight: 700, color: 'white',
    background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)', padding: '0.45rem 0.8rem',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.4rem'
  }

  return (
    <>
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', pointerEvents: 'auto' }}>
        <div style={{ ...chip, color: '#60a5fa' }}>{name} · LV {level}</div>
        <div style={{ ...chip, color: '#34d399' }}>⬡ {currency}</div>
        {skillPoints > 0 && <div style={{ ...chip, color: '#facc15', border: '1px solid #facc15', cursor: 'pointer' }} onClick={toggleSkillTree}>★ {skillPoints} SKILL PTS</div>}
        <div style={{
          ...chip,
          color: saveState === 'error' ? '#f87171' : saveState === 'saving' ? '#facc15' : '#475569',
          fontSize: '0.6rem'
        }}>
          {saveState === 'saving' ? '⟳ SAVING…' : saveState === 'error' ? '⚠ SAVE FAILED' : '✓ AUTO-SAVE'}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', pointerEvents: 'auto' }}>
        <Minimap />
        <div style={{ ...chip, fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.2em' }}>{areaNames[area] || area?.toUpperCase()}</div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={{ ...chip, cursor: 'pointer' }} onClick={toggleInventory}>🎒 I</button>
          <button style={{ ...chip, cursor: 'pointer' }} onClick={toggleSkillTree}>🧠 K</button>
          <button style={{ ...chip, cursor: 'pointer' }} onClick={toggleMap}>🌍 M</button>
          <button style={{ ...chip, cursor: 'pointer', color: '#f87171' }} onClick={exitToCharacterSelect} title="Save & switch character">⏏</button>
        </div>
      </div>
    </>
  )
})

export default function Hud() {
  return (
    <>
      <TopBar />
      <PartyHUD />

      {/* Bottom combat cluster: orb — action bar + xp — orb */}
      <div style={{
        position: 'absolute', bottom: '0.2rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'flex-end', gap: '1.5rem', pointerEvents: 'auto'
      }}>
        <HealthOrb />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', paddingBottom: '1.1rem' }}>
          <XpBar />
          <ActionBarsContainer />
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.55rem', color: '#475569', letterSpacing: '0.15em' }}>
            [WASD] MOVE · [J / SPACE] ATTACK · [1-5] SKILLS
          </div>
        </div>
        <ResourceOrb />
      </div>

      {/* Side Action Bar */}
      <div style={{
        position: 'absolute', right: '1rem', top: 'auto', bottom: '7rem', pointerEvents: 'auto'
      }}>
        <ActionBarGroup startIdx={5} endIdx={10} vertical={true} />
      </div>

      <QuestTracker />
      <BossHealthBar />
    </>
  )
}
