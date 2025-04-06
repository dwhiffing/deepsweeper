export const clickSound2 = new Audio('/audio/jump.wav')
export const clickSound = new Audio('/audio/click.wav')
export const explosionSound = new Audio('/audio/explosion.wav')
export const flagSound = new Audio('/audio/flag.wav')
export const jumpSound = new Audio('/audio/jump.wav')
clickSound2.preservesPitch = false
clickSound.preservesPitch = false
explosionSound.preservesPitch = false
flagSound.preservesPitch = false
jumpSound.preservesPitch = false

export const playSound = (
  sound: HTMLAudioElement,
  minRate = 1,
  maxRate = 1,
) => {
  sound.playbackRate = Math.random() * (maxRate - minRate) + minRate
  sound.play()
  sound.playbackRate = 1
}
