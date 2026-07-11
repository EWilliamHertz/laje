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
import Toolbar from './Toolbar'
import Inventory from './Inventory'
import Merchant from './Merchant'
import FriendsList from './FriendsList'
import Multiplayer from './Multiplayer'
import { useStore } from './store'
import './index.css'
import './login.css'

export default function App() {
  const characterConfig = useStore(state => state.characterConfig)
  const toggleMap = useStore(state => state.toggleMap)
  const toggleSkillTree = useStore(state => state.toggleSkillTree)
  const toggleInventory = useStore(state => state.toggleInventory)
  const isLoggedIn = useStore(state => state.isLoggedIn)

  // Map M key to open world map
  useEffect(() => {
    if (!characterConfig) return
    const handleKeyDown = (e) => {
      if (e.code === 'KeyM') toggleMap()
      if (e.code === 'KeyK') toggleSkillTree()
      if (e.code === 'KeyI') toggleInventory()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [characterConfig, toggleMap, toggleSkillTree, toggleInventory])

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
            <FriendsList />
            <Toolbar />
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
