import { useEffect } from 'react'
import { useStore } from 'zustand'
import { stopWatch } from '../hooks/useStopwatch'
import { formatTime } from '../utils'

export const StopWatch = (props: { gameStarted: boolean }) => {
  const { start, stop, time } = useStore(stopWatch)
  useEffect(() => {
    if (props.gameStarted) {
      start()
    } else {
      stop()
    }
    // eslint-disable-next-line
  }, [props.gameStarted])
  return (
    <p className="text-white z-20 absolute top-2 right-2">{formatTime(time)}</p>
  )
}
