import { useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useVariable = (state: any) => {
  const varRef = useRef(state)

  useEffect(() => {
    varRef.current = state
  }, [state])

  return varRef
}
