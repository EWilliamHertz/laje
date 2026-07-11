// Web Audio API Synth for retro sound effects
let audioCtx = null

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playAttackSound() {
  const ctx = initAudio()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = 'square'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start()
  osc.stop(ctx.currentTime + 0.1)
}

export function playHitSound() {
  const ctx = initAudio()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2)
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start()
  osc.stop(ctx.currentTime + 0.2)
}

export function playSkillSound() {
  const ctx = initAudio()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3)
  
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

export function playLevelUpSound() {
  const ctx = initAudio()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1)
  osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2)
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3)
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.start()
  osc.stop(ctx.currentTime + 0.8)
}
