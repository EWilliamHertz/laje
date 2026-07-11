import { useState, Suspense, useMemo } from 'react'
import { useStore } from './store'
import { api } from './api'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import ClassModel from './ClassModel'
import { CLASS_STATS } from './data/progression'

const RACES = [
  { id: 'human', name: 'Neo-Terran', desc: 'Adaptable survivors of the ancient cataclysm.' },
  { id: 'elf', name: 'Aether-Elf', desc: "Beings deeply attuned to the planet's ley lines." },
  { id: 'cyborg', name: 'Forged', desc: 'Cybernetic organisms built for war.' },
]

const CLASSES = [
  { id: 'warrior', name: 'Plasma Warrior', desc: 'Heavy melee combatant with plasma shields.', color: '#ef4444' },
  { id: 'mage', name: 'Technomancer', desc: 'Ranged spellcaster wielding ancient aether.', color: '#06b6d4' },
  { id: 'rogue', name: 'Cyber-Assassin', desc: 'Fast, stealthy, dual energy daggers.', color: '#a855f7' }
]

const parse = (v, f) => (typeof v === 'string' ? JSON.parse(v) : v) ?? f

// Slowly rotating pedestal showcase of the character with their real loadout.
function CharacterShowcase({ charClass, weaponItem, color }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.6, 5.2], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <spotLight position={[6, 10, 8]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-4, 2, -4]} intensity={1.5} color={color} />
      <Suspense fallback={null}>
        <group position={[0, -1.4, 0]}>
          <ClassModel charClass={charClass} anim="idle" weaponItem={weaponItem} energyColor={color} scale={1.5} />
          {/* Sci-fi pedestal */}
          <mesh position={[0, -0.12, 0]} receiveShadow>
            <cylinderGeometry args={[1.6, 1.9, 0.25, 48]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 1.5, 48]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        </group>
        <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.9} />
      </Suspense>
    </Canvas>
  )
}

export default function CharacterSelect() {
  const userProfile = useStore(state => state.userProfile)
  const characters = useStore(state => state.characters)
  const setCharacters = useStore(state => state.setCharacters)
  const selectCharacter = useStore(state => state.selectCharacter)
  const logout = useStore(state => state.logout)

  const [mode, setMode] = useState(characters.length === 0 ? 'create' : 'select')
  const [selectedId, setSelectedId] = useState(characters[0]?.id ?? null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Creation state
  const [newName, setNewName] = useState('')
  const [newClass, setNewClass] = useState(CLASSES[0])
  const [newRace, setNewRace] = useState(RACES[0])

  const selected = useMemo(
    () => characters.find(c => c.id === selectedId) || characters[0] || null,
    [characters, selectedId]
  )

  const previewClass = mode === 'create' ? newClass.id : (selected?.char_class || 'warrior')
  const previewColor = CLASS_STATS[previewClass]?.color || '#60a5fa'
  const previewWeapon = mode === 'create' ? null : parse(selected?.equipped, {})?.weapon || null

  const handleCreate = async () => {
    setError('')
    if (newName.trim().length < 2) { setError('Name must be at least 2 characters.'); return }
    setBusy(true)
    try {
      const created = await api.createCharacter(userProfile.id, {
        name: newName.trim(), charClass: newClass.id, charRace: newRace.id
      })
      setCharacters([created, ...characters])
      setSelectedId(created.id)
      setNewName('')
      setMode('select')
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  const handleDelete = async (char) => {
    if (!window.confirm(`Permanently decommission ${char.name}? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api.deleteCharacter(char.id)
      const remaining = characters.filter(c => c.id !== char.id)
      setCharacters(remaining)
      if (selectedId === char.id) setSelectedId(remaining[0]?.id ?? null)
      if (remaining.length === 0) setMode('create')
    } catch (err) {
      setError(err.message)
    } finally { setBusy(false) }
  }

  const classInfo = (id) => CLASSES.find(c => c.id === id) || CLASSES[0]
  const raceInfo = (id) => RACES.find(r => r.id === id) || RACES[0]

  return (
    <div className="ui-screen" style={{ display: 'flex', flexDirection: 'row', background: 'radial-gradient(ellipse at 30% 20%, #0f172a 0%, #020617 70%)', pointerEvents: 'auto' }}>

      {/* ── Center: full 3D showcase ── */}
      <div style={{ flex: 1.4, position: 'relative' }}>
        <CharacterShowcase charClass={previewClass} weaponItem={previewWeapon} color={previewColor} />
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'radial-gradient(circle at center, transparent 40%, #020617 100%)',
          pointerEvents: 'none'
        }} />
        {/* Name plate */}
        <div style={{ position: 'absolute', bottom: '7rem', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
          {mode === 'select' && selected && (
            <>
              <div style={{ fontFamily: 'Orbitron', fontSize: '2.5rem', fontWeight: 900, color: 'white', textShadow: `0 0 30px ${previewColor}` }}>
                {selected.name}
              </div>
              <div style={{ fontFamily: 'Orbitron', color: previewColor, letterSpacing: '0.2em' }}>
                LEVEL {selected.level} · {classInfo(selected.char_class).name.toUpperCase()} · {raceInfo(selected.char_race).name.toUpperCase()}
              </div>
              {previewWeapon && (
                <div style={{ color: previewWeapon.color, marginTop: '0.4rem', fontWeight: 700 }}>
                  ⚔ {previewWeapon.name} [{previewWeapon.rarity}]
                </div>
              )}
            </>
          )}
          {mode === 'create' && (
            <div style={{ fontFamily: 'Orbitron', fontSize: '2rem', fontWeight: 900, color: previewColor, textShadow: `0 0 30px ${previewColor}` }}>
              {newClass.name.toUpperCase()}
            </div>
          )}
        </div>
        {/* Enter world */}
        {mode === 'select' && selected && (
          <button
            onClick={() => selectCharacter(selected)}
            style={{
              position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              padding: '1.1rem 4rem', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Orbitron',
              background: `linear-gradient(135deg, ${previewColor}, ${previewColor}88)`, color: 'white',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              boxShadow: `0 0 40px ${previewColor}66`, letterSpacing: '0.15em',
              clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0 100%)'
            }}
          >
            ENTER WORLD
          </button>
        )}
      </div>

      {/* ── Right: character roster (WoW style) ── */}
      <div style={{ width: '380px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(10px)', borderLeft: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', zIndex: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Orbitron', color: 'white', margin: 0, fontSize: '1.1rem', letterSpacing: '0.15em' }}>YOUR CHARACTERS</h2>
          <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '0.3rem 0.7rem', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.75rem' }}>LOG OUT</button>
        </div>
        <div style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{userProfile?.username} · {characters.length}/8 slots</div>

        {error && <div style={{ color: '#f87171', fontSize: '0.85rem', padding: '0.5rem', border: '1px solid #7f1d1d', borderRadius: '0.4rem' }}>{error}</div>}

        {characters.map(char => {
          const ci = classInfo(char.char_class)
          const isActive = mode === 'select' && selected?.id === char.id
          return (
            <div
              key={char.id}
              onClick={() => { setSelectedId(char.id); setMode('select'); setError('') }}
              style={{
                padding: '1rem', borderRadius: '0.6rem', cursor: 'pointer',
                background: isActive ? `linear-gradient(90deg, ${ci.color}33, transparent)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? ci.color : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.15s', boxShadow: isActive ? `0 0 20px ${ci.color}33` : 'none'
              }}
            >
              <div>
                <div style={{ fontFamily: 'Orbitron', fontWeight: 700, color: 'white' }}>{char.name}</div>
                <div style={{ fontSize: '0.78rem', color: ci.color }}>Lv {char.level} {ci.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{raceInfo(char.char_race).name}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(char) }}
                disabled={busy}
                title="Delete character"
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem' }}
              >✕</button>
            </div>
          )
        })}

        <button
          onClick={() => { setMode('create'); setError('') }}
          disabled={characters.length >= 8}
          style={{
            marginTop: '0.5rem', padding: '0.9rem', fontFamily: 'Orbitron', fontWeight: 700,
            background: mode === 'create' ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)',
            border: `1px dashed ${mode === 'create' ? '#60a5fa' : 'rgba(255,255,255,0.25)'}`,
            color: characters.length >= 8 ? '#475569' : 'white', borderRadius: '0.6rem',
            cursor: characters.length >= 8 ? 'not-allowed' : 'pointer'
          }}
        >
          + CREATE NEW CHARACTER
        </button>

        {/* ── Creation panel ── */}
        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Character name"
              maxLength={24}
              style={{ padding: '0.8rem', background: 'rgba(2,6,23,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.4rem', color: 'white', fontFamily: 'Orbitron' }}
            />
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>LINEAGE</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {RACES.map(r => (
                  <button key={r.id} onClick={() => setNewRace(r)} style={{
                    padding: '0.45rem 0.7rem', fontSize: '0.75rem', borderRadius: '0.4rem', cursor: 'pointer',
                    background: newRace.id === r.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: newRace.id === r.id ? 'white' : '#94a3b8',
                    border: `1px solid ${newRace.id === r.id ? 'white' : 'rgba(255,255,255,0.1)'}`
                  }}>{r.name}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>COMBAT MATRIX</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {CLASSES.map(c => (
                  <button key={c.id} onClick={() => setNewClass(c)} style={{
                    padding: '0.45rem 0.7rem', fontSize: '0.75rem', borderRadius: '0.4rem', cursor: 'pointer',
                    background: newClass.id === c.id ? c.color : 'rgba(255,255,255,0.05)',
                    color: newClass.id === c.id ? 'white' : '#94a3b8',
                    border: `1px solid ${newClass.id === c.id ? c.color : 'rgba(255,255,255,0.1)'}`,
                    fontWeight: 700
                  }}>{c.name}</button>
                ))}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>{newClass.desc}</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={busy}
              style={{
                padding: '1rem', fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1rem',
                background: 'white', color: 'black', border: 'none', borderRadius: '0.4rem',
                cursor: 'pointer', boxShadow: `0 0 30px ${newClass.color}66`
              }}
            >
              {busy ? 'FORGING…' : 'DEPLOY TO SURFACE'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
