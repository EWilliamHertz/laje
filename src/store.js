import { create } from 'zustand'
import { api } from './api'
import { xpForLevel, computeDerivedStats, totalSkillPoints, MAX_LEVEL } from './data/progression'
import { aggregatePassives, getNode, ABILITIES } from './data/skills'

// Non-reactive, high-frequency data. Mutated directly every frame so the UI
// never re-renders because of it. Read by the minimap / auto-save / systems.
export const runtime = {
  playerPos: { x: 0, z: 0 },
  cooldowns: {},        // abilityId -> { readyAt, duration }
  buffs: {},            // 'damagePct' | 'moveSpeedPct' -> { value, until }
  cloakedUntil: 0,
  isDead: false,
  pendingFullHeal: false
}

export function getBuffValue(key) {
  const b = runtime.buffs[key]
  return b && b.until > Date.now() ? b.value : 0
}

const parseJson = (v, fallback) => {
  if (v == null) return fallback
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return fallback } }
  return v
}

export const useStore = create((set, get) => ({
  // ── Account & character roster ─────────────────────────────────────
  isLoggedIn: false,
  userProfile: null,
  characters: [],
  activeCharacter: null,     // the selected DB character row
  characterConfig: null,     // { id, name, class, race } while in-world

  // ── Runtime character state ────────────────────────────────────────
  health: 100,
  maxHealth: 100,
  resource: 100,
  maxResource: 100,
  level: 1,
  xp: 0,
  currency: 0,
  stats: { damage: 10, moveSpeed: 13, critChance: 0.05, cooldownMult: 1, resourceRegen: 6, healthRegen: 1 },
  skillPoints: 0,
  unlockedSkills: [],
  hotbar: Array(10).fill(null),
  keybinds: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'],
  inventory: [],
  equipped: { weapon: null, armor: null },
  friends: [],
  currentArea: 'hub',

  // ── UI state ───────────────────────────────────────────────────────
  isMapOpen: false,
  isSkillTreeOpen: false,
  isInventoryOpen: false,
  isCharacterOpen: false,
  isMerchantOpen: false,
  isQuestNPCOpen: false,
  floatingTexts: [],
  triggeredSkill: null,
  lastSavedAt: null,
  saveState: 'idle', // idle | saving | saved | error
  chatMessages: [],
  party: [],        // Array of { id, username }
  partyInvites: [], // Array of { id, username }
  otherPlayers: {}, // Map of socket.id -> player state
  
  activeDuel: null, // { id, username }
  duelRequests: [], // Array of { id, username }
  
  // ── Quests ─────────────────────────────────────────────────────────
  activeQuest: null,     // { id, title, description, targetEnemyType, targetCount, currentCount, rewardXp, rewardCredits }

  // ── Auth ───────────────────────────────────────────────────────────
  login: (profile) => set({
    isLoggedIn: true,
    userProfile: { id: profile.id, username: profile.username },
    friends: parseJson(profile.friends, []),
    characters: profile.characters || []
  }),

  logout: () => set({
    isLoggedIn: false, userProfile: null, characters: [],
    activeCharacter: null, characterConfig: null
  }),

  setCharacters: (characters) => set({ characters }),

  // ── Character selection (WoW-style) ────────────────────────────────
  selectCharacter: (char) => {
    const unlockedSkills = parseJson(char.unlocked_skills, [])
    const equipped = parseJson(char.equipped, { weapon: null, armor: null })
    const position = parseJson(char.position, { x: 0, z: 0, area: 'hub' })
    const passives = aggregatePassives(char.char_class, unlockedSkills)
    const stats = computeDerivedStats(char.char_class, char.level, equipped, passives)
    const spent = unlockedSkills.filter(id => getNode(char.char_class, id)).length

    runtime.playerPos.x = position.x || 0
    runtime.playerPos.z = position.z || 0
    runtime.cooldowns = {}
    runtime.buffs = {}
    runtime.isDead = false

    const loadedHotbar = parseJson(char.hotbar, Array(10).fill(null))
    const loadedKeybinds = parseJson(char.keybinds, ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'])

    set({
      activeCharacter: char,
      characterConfig: { id: char.id, name: char.name, class: char.char_class, race: char.char_race },
      level: char.level,
      xp: char.xp,
      currency: char.currency,
      unlockedSkills,
      hotbar: loadedHotbar,
      keybinds: loadedKeybinds,
      inventory: parseJson(char.inventory, []),
      equipped,
      currentArea: position.area || 'hub',
      stats,
      maxHealth: stats.maxHealth,
      health: stats.maxHealth,
      maxResource: stats.maxResource,
      resource: stats.maxResource,
      skillPoints: Math.max(0, totalSkillPoints(char.level) - spent)
    })
  },

  // Return to the character select screen (saving first).
  exitToCharacterSelect: async () => {
    await get().saveCharacter()
    const { userProfile } = get()
    try {
      const characters = await api.getCharacters(userProfile.id)
      set({ characters })
    } catch { /* keep the stale roster */ }
    set({ activeCharacter: null, characterConfig: null, isMapOpen: false, isSkillTreeOpen: false, isInventoryOpen: false, isMerchantOpen: false, isQuestNPCOpen: false })
  },

  // ── Derived stats ──────────────────────────────────────────────────
  recomputeStats: () => set(state => {
    if (!state.characterConfig) return {}
    const passives = aggregatePassives(state.characterConfig.class, state.unlockedSkills)
    const stats = computeDerivedStats(state.characterConfig.class, state.level, state.equipped, passives)
    const spent = state.unlockedSkills.filter(id => getNode(state.characterConfig.class, id)).length
    return {
      stats,
      maxHealth: stats.maxHealth,
      maxResource: stats.maxResource,
      health: Math.min(state.health, stats.maxHealth),
      resource: Math.min(state.resource, stats.maxResource),
      skillPoints: Math.max(0, totalSkillPoints(state.level) - spent)
    }
  }),

  // ── Persistence: background auto-save ──────────────────────────────
  saveCharacter: async () => {
    const state = get()
    if (!state.characterConfig?.id) return
    set({ saveState: 'saving' })
    try {
      await api.saveCharacter(state.characterConfig.id, {
        level: state.level,
        xp: state.xp,
        currency: state.currency,
        unlockedSkills: JSON.stringify(state.unlockedSkills),
        hotbar: JSON.stringify(state.hotbar),
        keybinds: JSON.stringify(state.keybinds),
        inventory: state.inventory,
        equipped: state.equipped,
        position: { x: runtime.playerPos.x, z: runtime.playerPos.z, area: state.currentArea }
      })
      set({ lastSavedAt: Date.now(), saveState: 'saved' })
    } catch (err) {
      console.error('Auto-save failed:', err)
      set({ saveState: 'error' })
    }
  },
  // Legacy alias
  saveProgress: () => get().saveCharacter(),

  // ── Progression ────────────────────────────────────────────────────
  addLoot: (gainedXp, gainedCurrency) => {
    const state = get()
    let newXp = state.xp + gainedXp
    let newLevel = state.level
    let leveledUp = false
    while (newLevel < MAX_LEVEL && newXp >= xpForLevel(newLevel)) {
      newXp -= xpForLevel(newLevel)
      newLevel += 1
      leveledUp = true
    }
    set({ xp: newXp, level: newLevel, currency: state.currency + gainedCurrency })
    if (leveledUp) {
      get().recomputeStats()
      const s = get()
      // Full heal + refill on level up (ECS picks up the flag next frame)
      runtime.pendingFullHeal = true
      set({ health: s.maxHealth, resource: s.maxResource })
      get().addFloatingText(`LEVEL ${newLevel}!`, [runtime.playerPos.x, 3, runtime.playerPos.z], '#fbbf24')
      get().addFloatingText('+1 SKILL POINT', [runtime.playerPos.x, 3.8, runtime.playerPos.z], '#60a5fa')
      get().saveCharacter()
    }
  },

  unlockSkill: (skillId) => {
    const state = get()
    const node = getNode(state.characterConfig?.class, skillId)
    if (!node) return
    if (state.unlockedSkills.includes(skillId)) return
    if (state.skillPoints < 1) return
    if (state.level < (node.requiresLevel || 1)) return
    if (node.requires && !state.unlockedSkills.includes(node.requires)) return
    set({ unlockedSkills: [...state.unlockedSkills, skillId] })
    get().recomputeStats()
    // Auto-slot new actives into the first free hotbar slot
    if (node.type === 'active') {
      const hb = [...get().hotbar]
      const free = hb.indexOf(null)
      if (free !== -1 && !hb.includes(skillId)) {
        hb[free] = skillId
        set({ hotbar: hb })
      }
    }
    get().saveCharacter()
  },

  updateHotbar: (index, skillId) => {
    set(state => {
      const newHotbar = [...state.hotbar]
      // remove duplicates of the same skill
      for (let i = 0; i < newHotbar.length; i++) if (newHotbar[i] === skillId) newHotbar[i] = null
      newHotbar[index] = skillId
      return { hotbar: newHotbar }
    })
    get().saveCharacter()
  },

  updateKeybind: (index, code) => {
    set(state => {
      const newKeybinds = [...state.keybinds]
      // if already bound, swap them
      const existingIdx = newKeybinds.indexOf(code)
      if (existingIdx !== -1) {
        newKeybinds[existingIdx] = newKeybinds[index]
      }
      newKeybinds[index] = code
      return { keybinds: newKeybinds }
    })
    get().saveCharacter()
  },
  
  // ── Quests ─────────────────────────────────────────────────────────
  acceptQuest: (quest) => set({ activeQuest: { ...quest, currentCount: 0 } }),
  abandonQuest: () => set({ activeQuest: null }),
  updateQuestProgress: (amount) => set(s => {
    if (!s.activeQuest) return s;
    const newCount = s.activeQuest.currentCount + amount;
    if (newCount >= s.activeQuest.targetCount) {
      // Quest Complete!
      setTimeout(() => {
        useStore.getState().addLoot(s.activeQuest.rewardXp, s.activeQuest.rewardCredits)
        useStore.getState().addFloatingText(`QUEST COMPLETE!`, [0, 4, 0], '#fbbf24')
        useStore.getState().abandonQuest()
      }, 500)
      return { activeQuest: { ...s.activeQuest, currentCount: s.activeQuest.targetCount } }
    }
    return { activeQuest: { ...s.activeQuest, currentCount: newCount } }
  }),

  // ── Abilities ──────────────────────────────────────────────────────
  triggerSkill: (skillId) => {
    const state = get()
    const ability = ABILITIES[skillId]
    if (!ability) return
    const cd = runtime.cooldowns[skillId]
    if (cd && cd.readyAt > Date.now()) return
    if (state.resource < (ability.cost || 0)) {
      get().addFloatingText('NOT ENOUGH ENERGY', [runtime.playerPos.x, 2.5, runtime.playerPos.z], '#94a3b8')
      return
    }
    const duration = (ability.cooldown || 1) * state.stats.cooldownMult
    runtime.cooldowns[skillId] = { readyAt: Date.now() + duration * 1000, duration }
    set({ resource: Math.max(0, state.resource - (ability.cost || 0)), triggeredSkill: skillId })
  },
  clearTriggeredSkill: () => set({ triggeredSkill: null }),

  // ── Inventory & equipment ──────────────────────────────────────────
  addInventoryItem: (item) => set(state => ({ inventory: [...state.inventory, item] })),

  equipItem: (item) => {
    set(state => {
      const type = item.slot || (item.id.includes('weapon') ? 'weapon' : 'armor')
      const currentlyEquipped = state.equipped[type]
      const newInventory = state.inventory.filter(i => i.id !== item.id)
      if (currentlyEquipped) newInventory.push(currentlyEquipped)
      return { inventory: newInventory, equipped: { ...state.equipped, [type]: item } }
    })
    get().recomputeStats()
    get().saveCharacter()
  },

  consumeItem: (item) => {
    set(state => {
      if (item.type === 'consumable') {
        if (item.effect === 'heal') {
          // Because updateHealth uses state updater, we can just call it
          // Wait, updateHealth is a separate function, we can call it outside set
        }
        const newInv = [...state.inventory]
        const idx = newInv.findIndex(i => i.id === item.id)
        if (idx !== -1) newInv.splice(idx, 1)
        return { inventory: newInv }
      }
      return state
    })
    
    if (item.type === 'consumable' && item.effect === 'heal') {
      get().updateHealth(item.power)
      get().addFloatingText(`+${item.power} HP`, [runtime.playerPos.x, 2.5, runtime.playerPos.z], '#22c55e')
    }
    
    get().saveCharacter()
  },

  buyItem: (item, cost) => {
    const state = get()
    if (state.currency < cost) return
    set({ currency: state.currency - cost, inventory: [...state.inventory, item] })
    get().saveCharacter()
  },

  sellItem: (item) => {
    set(state => {
      let newEquipped = { ...state.equipped }
      const type = item.slot || (item.id.includes('weapon') ? 'weapon' : 'armor')
      if (newEquipped[type]?.id === item.id) newEquipped[type] = null
      return {
        inventory: state.inventory.filter(i => i.id !== item.id),
        equipped: newEquipped,
        currency: state.currency + (item.value || item.power * 2)
      }
    })
    get().recomputeStats()
    get().saveCharacter()
  },

  addFriend: (username) => set(state => {
    if (state.friends.includes(username)) return {}
    return { friends: [...state.friends, username] }
  }),

  // ── Vitals (called at high frequency — selectors should floor) ─────
  setHealth: (amount) => {
    if (get().health !== amount) set({ health: amount })
  },
  updateHealth: (amount) => set(state => ({ health: Math.min(state.maxHealth, Math.max(0, state.health + amount)) })),
  updateResource: (amount) => set(state => ({ resource: Math.min(state.maxResource, Math.max(0, state.resource + amount)) })),
  tickRegen: (delta) => {
    const s = get()
    if (runtime.isDead) return
    const nr = Math.min(s.maxResource, s.resource + s.stats.resourceRegen * delta)
    if (nr !== s.resource) set({ resource: nr })
  },

  // ── World / UI ─────────────────────────────────────────────────────
  setArea: (areaId) => set({ currentArea: areaId, isMapOpen: false }),
  setCurrentArea: (areaId) => set({ currentArea: areaId, isMapOpen: false }),
  toggleMap: () => set(state => ({ isMapOpen: !state.isMapOpen })),
  toggleCharacter: () => set(state => ({ isCharacterOpen: !state.isCharacterOpen, isInventoryOpen: false, isMerchantOpen: false, isQuestNPCOpen: false })),
  toggleInventory: () => set(state => ({ isInventoryOpen: !state.isInventoryOpen, isCharacterOpen: false, isMerchantOpen: false, isQuestNPCOpen: false })),
  toggleMerchant: () => set(state => ({ isMerchantOpen: !state.isMerchantOpen, isInventoryOpen: false, isCharacterOpen: false, isQuestNPCOpen: false })),
  toggleQuestNPC: () => set(state => ({ isQuestNPCOpen: !state.isQuestNPCOpen, isInventoryOpen: false, isCharacterOpen: false, isMerchantOpen: false })),
  toggleSkillTree: () => set(state => ({ isSkillTreeOpen: !state.isSkillTreeOpen })),

  addFloatingText: (text, position, color) => set(state => ({
    floatingTexts: [...state.floatingTexts, { id: Math.random(), text, position, color, createdAt: Date.now() }]
  })),
  removeFloatingText: (id) => set(state => ({
    floatingTexts: state.floatingTexts.filter(ft => ft.id !== id)
  })),
  
  // ── Chat ───────────────────────────────────────────────────────────
  addChatMessage: (msg) => set(state => {
    const newChat = [...state.chatMessages, msg];
    if (newChat.length > 50) newChat.shift(); // Keep max 50 messages
    return { chatMessages: newChat };
  }),

  // ── Party ──────────────────────────────────────────────────────────
  setParty: (party) => set({ party }),
  addPartyInvite: (invite) => set(state => {
    if (state.partyInvites.find(i => i.id === invite.id)) return state;
    return { partyInvites: [...state.partyInvites, invite] };
  }),
  removePartyInvite: (id) => set(state => ({ partyInvites: state.partyInvites.filter(i => i.id !== id) })),
  
  // ── Duels ──────────────────────────────────────────────────────────
  setActiveDuel: (duel) => set({ activeDuel: duel }),
  addDuelRequest: (req) => set(state => {
    if (state.duelRequests.find(r => r.id === req.id)) return state;
    return { duelRequests: [...state.duelRequests, req] };
  }),
  removeDuelRequest: (id) => set(state => ({ duelRequests: state.duelRequests.filter(r => r.id !== id) })),

  // ── Network Players ────────────────────────────────────────────────
  setOtherPlayers: (players) => set({ otherPlayers: players }),
  updateOtherPlayer: (id, data) => set(state => ({ 
    otherPlayers: { ...state.otherPlayers, [id]: { ...state.otherPlayers[id], ...data } }
  })),
  removeOtherPlayer: (id) => set(state => {
    const newPlayers = { ...state.otherPlayers };
    delete newPlayers[id];
    return { otherPlayers: newPlayers };
  })
}))
