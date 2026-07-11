# LAJE — Isometric Sci-Fi Fantasy ARPG

A multiplayer isometric Action RPG built with **React Three Fiber**, **bitecs** (ECS), **Zustand**, **Socket.io**, and a **Node.js/PostgreSQL** backend.

## Features

### Character Select (WoW-style)
- Full roster screen: up to **8 characters per account** (1-to-many `users → characters` schema).
- Selected character rendered in full 3D on a rotating pedestal **with their actual equipped weapon** (tier glow included).
- Create/delete characters with lineage (Neo-Terran, Aether-Elf, Forged) and class selection.

### Classes
| Class | Fantasy | Resource | Attack |
|---|---|---|---|
| **Plasma Warrior** | Heavy sci-fi armor, greatsword | Fury | Melee cleave |
| **Technomancer** | Aether-robes, arcane orb/staff | Aether | Ranged |
| **Cyber-Assassin** | Stealth tech suit, dual daggers | Charge | Fast melee |

### Progression
- Polynomial XP curve (`xpForLevel`) with per-level scaling of Health, Damage, Speed, and Resource capacity, plus class growth multipliers.
- **+1 skill point per level.** Each class has a **3-branch skill tree** (`src/data/skills.js`) with active abilities and passive nodes, persisted in the `unlocked_skills` JSONB column.
- Actives are **drag-and-drop bindable to hotbar keys 1–5**, with per-ability cooldowns and resource costs.

### Auto-Save
- Background auto-save every **30 seconds** plus checkpoints on tab hide/close, character switch, and death. Persists XP, level, inventory, currency, equipment, hotbar, skills, and position. Save status is shown live in the HUD.

### HUD
- Sci-fi themed overlay: health/energy **orbs**, XP bar, action bar with DOM-painted cooldown sweeps, and a canvas **minimap radar** that reads the ECS directly.
- Zustand subscriptions are isolated per component (memoized selectors), so combat ticks re-render only the elements that change.

### 3D Models & Animations
- Rigged GLB characters (KayKit Adventurers, **CC0**) with `useAnimations` crossfade mixing: Idle, Run, Attack, Spellcast, Spin, and Death.
- Weapons are portaled into the rig's **hand bone** — equipping gear visually changes the model in-world, on other connected players, and on the character select screen.

### Loot & Enemies
- Tiered items (Common → Rare → Epic → Legendary) with weighted, level-scaled loot rolls (`src/data/items.js`).
- 4 enemy archetypes with distinct behaviors — swarming **drones**, flanking **stalkers**, heavy **brutes**, and boss-class **sentinels** — each with its own drop table, level scaling, and respawn cycle.

## Running

```bash
npm install
node server.js        # backend (PORT env, defaults to 80) — auto-migrates the schema
npm run dev           # frontend (VITE_API_URL to point at the backend)
```

## Controls
`WASD` move · `J`/`Space` attack · `1-5` abilities · `I` inventory · `K` skill matrix · `M` map

## Credits
Character models by [Kay Lousberg](https://kaylousberg.com) (KayKit Character Pack: Adventurers, CC0).
