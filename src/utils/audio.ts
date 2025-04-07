export const clickSound2 = new Audio('audio/click-error.wav')
export const clickSound = new Audio('audio/click.wav')
export const explosionSound = new Audio('audio/explosion.wav')
export const flagSound = new Audio('audio/flag.wav')
export const jumpSound = new Audio('audio/swim.wav')
export const winSound = new Audio('audio/win.wav')
clickSound2.preservesPitch = false
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
  sound.playbackRate = Math.random() * (maxRate - minRate) + minRate
  sound.volume = volume
  sound.play()
}
