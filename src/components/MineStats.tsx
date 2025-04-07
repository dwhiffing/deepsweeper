import { useStore } from 'zustand'
import { mineStatsStore } from '../utils'

export const MineStats = () => {
  const { mines, cells, spears } = useStore(mineStatsStore)
  return (
    <div className="absolute top-2 left-2 z-20 flex text-white gap-3">
      <p className="">Mines Left: {mines}</p>
      <p className="">Cells Left: {cells}</p>
      <p className="">Spears Left: {spears}</p>
    </div>
  )
}
