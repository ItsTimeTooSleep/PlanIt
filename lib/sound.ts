'use client'

const LOG_PREFIX = '[PlanIt Sound]'

let audioContext: AudioContext | null = null

/**
 * 初始化 AudioContext
 * @returns AudioContext 实例
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: new () => AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

/**
 * 生成任务开始音效
 */
function playTaskStartSound() {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
    
    console.log(`${LOG_PREFIX} Task start sound played`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to play task start sound:`, error)
  }
}

/**
 * 生成任务结束音效
 */
function playTaskEndSound() {
  try {
    const ctx = getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, ctx.currentTime)
    oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.15)
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
    
    console.log(`${LOG_PREFIX} Task end sound played`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to play task end sound:`, error)
  }
}

/**
 * 生成任务完成音效
 */
function playTaskCompleteSound() {
  try {
    const ctx = getAudioContext()
    const frequencies = [523, 659, 784, 1047]
    
    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1)
      
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime + index * 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.3)
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.start(ctx.currentTime + index * 0.1)
      oscillator.stop(ctx.currentTime + index * 0.1 + 0.3)
    })
    
    console.log(`${LOG_PREFIX} Task complete sound played`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to play task complete sound:`, error)
  }
}

/**
 * 音效类型
 */
export type SoundType = 'taskStart' | 'taskEnd' | 'taskComplete'

/**
 * 播放音效
 * @param type - 音效类型
 */
export function playSound(type: SoundType) {
  console.log(`${LOG_PREFIX} playSound called with type:`, type)
  
  if (typeof window === 'undefined') {
    console.warn(`${LOG_PREFIX} Window is undefined (SSR), skipping sound`)
    return
  }
  
  switch (type) {
    case 'taskStart':
      playTaskStartSound()
      break
    case 'taskEnd':
      playTaskEndSound()
      break
    case 'taskComplete':
      playTaskCompleteSound()
      break
  }
}
