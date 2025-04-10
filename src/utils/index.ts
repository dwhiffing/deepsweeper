import { Triplet } from '@react-three/cannon'
import { v4 as uuidv4 } from 'uuid'
import { Cube } from '../prefabs/Cube'
import { createStore } from 'zustand'
import { mineSize } from './constants'

const directions = [-1, 0, 1]

export const getBoxes = (gridSize: number, sp: number) => {
  const boxes = []
  const cubeMap: Record<string, Cube> = {}
  const size = mineSize + sp

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const cube = {
          uuid: uuidv4(),
          position: [
            x * size - (gridSize / 2) * size + size / 2,
            y * size - (gridSize / 2) * size + size / 2,
            z * size - (gridSize / 2) * size + size / 2,
          ] as Triplet,
          x,
          y,
          z,
          number: 0,
          revealed: false,
          isMine: false,
        }
        boxes.push(cube)
        cubeMap[`${x},${y},${z}`] = cube
      }
    }
  }

  return { boxes: boxes as Cube[], cubeMap }
}

export const assignMines = (
  gridSize: number,
  mineCount: number,
  cubeMap: Record<string, Cube>,
  blacklistId: string,
) => {
  // Step 2: Randomly select 'mineCount' cells to be mines
  const availablePositions = [...Array(gridSize * gridSize * gridSize).keys()]
  let i = 0
  while (i < mineCount) {
    // Randomly select an index from available positions
    const randomIndex = Math.floor(Math.random() * availablePositions.length)
    const selectedIndex = availablePositions[randomIndex]
    availablePositions.splice(randomIndex, 1) // Remove the selected position

    // Convert the index to 3D coordinates (x, y, z)
    const x = Math.floor(selectedIndex / (gridSize * gridSize))
    const y = Math.floor((selectedIndex % (gridSize * gridSize)) / gridSize)
    const z = selectedIndex % gridSize

    // Mark the cube as a mine
    const cube = cubeMap[`${x},${y},${z}`]
    if (cube.uuid !== blacklistId) {
      i++
      cube.isMine = true
    }
  }

  // count adjacent mines
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const current = cubeMap[`${x},${y},${z}`]
        if (current.isMine) continue

        const neighbors = getAdjacent(current, cubeMap)

        current.number = neighbors.filter((n) => n.isMine).length
      }
    }
  }
}
export const getAdjacent = (
  cube: Cube,
  cubeMap: Record<string, Cube>,
  recurse = false,
  visited = new Set<string>(),
): Cube[] => {
  const key = `${cube.x},${cube.y},${cube.z}`
  if (visited.has(key)) return []
  visited.add(key)

  const neighbors: Cube[] = []

  for (const dx of directions) {
    for (const dy of directions) {
      for (const dz of directions) {
        if (dx === 0 && dy === 0 && dz === 0) continue

        const nx = cube.x + dx
        const ny = cube.y + dy
        const nz = cube.z + dz
        const nKey = `${nx},${ny},${nz}`

        const neighbor = cubeMap[nKey]
        if (!neighbor || visited.has(nKey)) continue

        neighbors.push(neighbor)

        if (neighbor.number === 0 && recurse) {
          neighbors.push(...getAdjacent(neighbor, cubeMap, recurse, visited))
        }
      }
    }
  }

  return neighbors
}
export function formatTime(s: number) {
  const totalSeconds = Math.floor(s / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0')

  const result: T[][] = []

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }

  return result
}

export const mineStatsStore = createStore<{
  mines: number
  cells: number
  spears: number
}>(() => ({ mines: 0, cells: 0, spears: 0 }))
