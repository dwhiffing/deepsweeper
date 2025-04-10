export const clickErrorSound = new Audio('audio/click-error.mp3')
export const clickSound = new Audio('audio/click.mp3')
export const explosionSound = new Audio('audio/explosion.mp3')
export const flagSound = new Audio('audio/flag.mp3')
export const jumpSound = new Audio('audio/swim.mp3')
export const winSound = new Audio('audio/win.mp3')
export const spearSound = new Audio('audio/spear.mp3')
export const music = new Audio('audio/music.mp3')
export let muted = false
export const toggleMute = () => {
  muted = !muted
  music.muted = muted
}

music.loop = true
clickErrorSound.preservesPitch = false
clickSound.preservesPitch = false
explosionSound.preservesPitch = false
flagSound.preservesPitch = false
jumpSound.preservesPitch = false

export const playSound = (
  sound: HTMLAudioElement,
  minRate = 1,
  maxRate = 1,
  volume = 0.6,
) => {
  if (muted) return
  sound.playbackRate = Math.random() * (maxRate - minRate) + minRate
  sound.volume = volume
  sound.play()
}
