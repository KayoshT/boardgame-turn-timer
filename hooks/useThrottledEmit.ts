import { useCallback, useRef } from "react"

type ThrottleMap = Record<string, number>

export default function useThrottledEmit(emit: (event: string, payload?: any) => void) {
    const lastAtRef = useRef<ThrottleMap>({})

    return useCallback(
        (event: string, payload: any, throttleMs = 700) => {
            const now = Date.now()
            const lastAt = lastAtRef.current[event] ?? 0
            if (now - lastAt < throttleMs) return false // throttled

            lastAtRef.current[event] = now
            emit(event, payload)
            return true
        },
        [emit]
    )
}
