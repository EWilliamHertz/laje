import { create } from 'zustand'

export const useStore = create((set) => ({
  characterConfig: null,
  health: 100,
  maxHealth: 100,
  resource: 100,
  maxResource: 100,
  level: 1,
  xp: 0,
  currency: 0,
  currentArea: 'hub',
  isMapOpen: false,
  floatingTexts: [],
  isLoggedIn: false,
  userProfile: null,
  isSkillTreeOpen: false,
  unlockedSkills: [],
  hotbar: [null, null, null, null, null],
  triggeredSkill: null,
  
  triggerSkill: (skillId) => set({ triggeredSkill: skillId }),
  clearTriggeredSkill: () => set({ triggeredSkill: null }),

  toggleSkillTree: () => set(state => ({ isSkillTreeOpen: !state.isSkillTreeOpen })),
  
  saveProgress: async () => {
    const state = get()
    if (!state.userProfile) return
    let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    baseUrl = baseUrl.trim()
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`
    baseUrl = baseUrl.replace(/\/$/, '')
    
    fetch(`${baseUrl}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: state.userProfile.id,
        level: state.level,
        xp: state.xp,
        currency: state.currency,
        unlockedSkills: state.unlockedSkills,
        hotbar: state.hotbar
      })
    }).catch(console.error)
  },

  updateHotbar: (index, skillId) => {
    set(state => {
      const newHotbar = [...state.hotbar]
      newHotbar[index] = skillId
      return { hotbar: newHotbar }
    })
    get().saveProgress()
  },

  unlockSkill: (skillId, cost) => {
    set(state => {
      if (state.currency >= cost && !state.unlockedSkills.includes(skillId)) {
        return { 
          currency: state.currency - cost, 
          unlockedSkills: [...state.unlockedSkills, skillId] 
        }
      }
      return state
    })
    get().saveProgress()
  },

  login: (profile) => set({ 
    isLoggedIn: true, 
    userProfile: profile,
    level: profile.level || 1,
    xp: profile.xp || 0,
    currency: profile.currency || 0,
    unlockedSkills: profile.unlocked_skills ? (typeof profile.unlocked_skills === 'string' ? JSON.parse(profile.unlocked_skills) : profile.unlocked_skills) : [],
    hotbar: profile.hotbar ? (typeof profile.hotbar === 'string' ? JSON.parse(profile.hotbar) : profile.hotbar) : [null, null, null, null, null]
  }),
  setCharacterConfig: (config) => set({ characterConfig: config }),
  setHealth: (amount) => set({ health: amount }),
  updateHealth: (amount) => set((state) => ({ health: Math.min(state.maxHealth, Math.max(0, state.health + amount)) })),
  updateResource: (amount) => set((state) => ({ resource: Math.min(state.maxResource, Math.max(0, state.resource + amount)) })),
  setArea: (areaId) => set({ currentArea: areaId, isMapOpen: false }),
  toggleMap: () => set((state) => ({ isMapOpen: !state.isMapOpen })),
  
  // Progression System
  addLoot: (gainedXp, gainedCurrency) => set((state) => {
    let newXp = state.xp + gainedXp
    let newLevel = state.level
    let xpNeeded = newLevel * 100 // Level 1 = 100, Level 2 = 200, etc.

    while (newXp >= xpNeeded) {
      newXp -= xpNeeded
      newLevel += 1
      xpNeeded = newLevel * 100
    }

    return {
      xp: newXp,
      level: newLevel,
      currency: state.currency + gainedCurrency,
      maxHealth: state.maxHealth + ((newLevel - state.level) * 10),
      health: state.health + ((newLevel - state.level) * 10) // Heal on level up
    }
  }),

  // Visual Notifications
  addFloatingText: (text, position, color) => set((state) => ({
    floatingTexts: [...state.floatingTexts, { id: Math.random(), text, position, color, createdAt: Date.now() }]
  })),
  removeFloatingText: (id) => set((state) => ({
    floatingTexts: state.floatingTexts.filter(ft => ft.id !== id)
  })),
}))
