import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import World from './World'
import Character from './Character'
import Enemies from './Enemies'
import FloatingTexts from './FloatingText'
import CharacterSelect from './CharacterSelect'
import Login from './Login'
import Hud from './Hud'
import WorldMap from './WorldMap'
import SkillTree from './SkillTree'
import Inventory from './Inventory'
import Merchant from './Merchant'
import QuestNPC from './QuestNPC'
import Multiplayer from './Multiplayer'
import Chat from './Chat'
import { useStore } from './store'
import './index.css'
import './login.css'

const AUTO_SAVE_INTERVAL_MS = 30_000

export default function App() {
  const characterConfig = useStore(state => state.characterConfig)
  const toggleMap = useStore(state => state.toggleMap)
  const toggleSkillTree = useStore(state => state.toggleSkillTree)
  const toggleInventory = useStore(state => state.toggleInventory)
  const isLoggedIn = useStore(state => state.isLoggedIn)

  // Hotkeys for panels
  useEffect(() => {
    if (!characterConfig) return
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.code === 'KeyM') toggleMap()
      if (e.code === 'KeyK') toggleSkillTree()
      if (e.code === 'KeyI') toggleInventory()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [characterConfig, toggleMap, toggleSkillTree, toggleInventory])

  // ── Background auto-save: every 30s + on tab close/hide ──
  useEffect(() => {
    if (!characterConfig) return
    const save = () => useStore.getState().saveCharacter()

    const interval = setInterval(save, AUTO_SAVE_INTERVAL_MS)
    const onVisibility = () => { if (document.visibilityState === 'hidden') save() }
    const onBeforeUnload = () => save()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
    save() // initial checkpoint on entering the world

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
      save() // final save when leaving the world
    }
  }, [characterConfig?.id])

  return (
    <>
      <div id="ui-layer">
        {!isLoggedIn ? (
          <Login />
        ) : !characterConfig ? (
          <CharacterSelect />
        ) : (
          <>
            <Hud />
            <WorldMap />
            <SkillTree />
            <Inventory />
            <Merchant />
            <QuestNPC />
            <Chat />
          </>
        )}
      </div>

      {isLoggedIn && characterConfig && (
        <Canvas shadows dpr={[1, 1.5]}>
          <OrthographicCamera
            makeDefault
            position={[20, 20, 20]}
            zoom={30}
            near={-100}
            far={100}
          />
          <ambientLight intensity={0.5} color="#ffffff" />
          <directionalLight
            castShadow
            position={[10, 20, 15]}
            intensity={1.2}
            color="#ffebb3"
            shadow-mapSize={[1024, 1024]}
          >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
          </directionalLight>

          <Suspense fallback={null}>
            <World />
            <Enemies />
            <Character />
            <Multiplayer />
            <FloatingTexts />
          </Suspense>
        </Canvas>
      )}
    </>
  )
}
