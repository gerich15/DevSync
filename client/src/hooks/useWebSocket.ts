import { useEffect, useRef, useState } from 'react'

function getWsBase(): string {
  if (typeof window === 'undefined') return 'ws://localhost:3100'
  const p = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return p + '//' + window.location.host
}

export function useWebSocket(userId: string | null, onMessage?: (event: string, data: unknown) => void) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem('devsync_token')
    if (!token) return
    const url = `${getWsBase()}/ws/updates?token=${encodeURIComponent(token)}`
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        onMessage?.(msg.event, msg.data)
      } catch {}
    }
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [userId, onMessage])

  return { connected }
}
