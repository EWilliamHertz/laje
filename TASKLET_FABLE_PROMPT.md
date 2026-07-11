# Laje: Isometric Sci-Fi Fantasy ARPG - Next Development Phase

You are Tasklet.AI Fable 5, an advanced AI development agent. You are taking over development of **Laje**, a multiplayer isometric Action RPG built with React Three Fiber, bitecs (Entity Component System), Zustand (State Management), Socket.io, and a Node.js/PostgreSQL backend.

Your goal is to build out the next major milestones for the game, focusing heavily on progression, UI, 3D assets, and character management.

## 1. World of Warcraft Style Character Loadout & Selection Screen
- **Revamp `CharacterSelect.jsx`**: Currently, it locks you into your previous choice. We need to expand this into a full "Character Select" screen like WoW.
- When the user logs in, show a list/carousel of their saved characters on the side.
- Render the selected character in full 3D with their actual equipped gear (Loadout) dynamically attached to their rig.
- Allow creating multiple characters per account (requires updating the PostgreSQL schema to support 1-to-many users-to-characters relationships).

## 2. Auto-Saving Character Progress
- The game currently relies on `saveProgress` triggers. Implement a robust background auto-save system that seamlessly persists the character's XP, Level, Inventory, Currency, and Position every 30 seconds to the PostgreSQL backend without interrupting gameplay.

## 3. UI and HUD Optimization
- Redesign the HUD to be hyper-modern, clean, and Sci-Fi/Fantasy themed.
- Create an intuitive action bar (hotbar) for skills, a sleek minimap/radar, and distinct health/energy orbs or bars.
- Optimize the React components to minimize unnecessary re-renders of the UI overlay during intense combat, isolating Zustand state subscriptions strictly to the components that need them.

## 4. Advanced Level & Skill Progression System
- **Leveling**: Expand the math for XP curves. Implement dynamic stats scaling (Health, Damage, Speed, Resource capacity) as the player levels up.
- **Skill Trees**: Implement distinct, multi-branch skill trees for the 3 classes (Plasma Warrior, Technomancer, Cyber-Assassin).
- Add unlockable active abilities (bindable to keys 1-5) and passive nodes. Store unlocked nodes in the `unlocked_skills` JSONB column.

## 5. Sci-Fi Fantasy 3D Models & Animations
- Replace the current primitive placeholder shapes (boxes/capsules) with actual rigged 3D models for the different classes.
- Load `.gltf` or `.glb` models for the Plasma Warrior (heavy sci-fi armor), Technomancer (sleek aether-robes), and Cyber-Assassin (stealth tech suits).
- Implement basic animation mixing using `@react-three/drei`'s `useAnimations` for Idle, Run, Attack, and Death states.

## 6. Weapons and Equipment System (Etcetera)
- Build out the loot tables and equipment matrix.
- Weapons and armor should have distinct tiers (Common, Rare, Epic, Legendary).
- Ensure that equipping a weapon visually changes the 3D model in the game world and Character Select screen.
- Add varied enemy types with their own unique drops and behaviors.

Please review the current codebase (`src/store.js`, `src/ecs/systems.js`, `server.js`) to understand the architecture, and then begin implementing these features step by step!
