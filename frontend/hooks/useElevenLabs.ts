import { useMemo } from 'react'
import { ElevenLabsClient } from 'elevenlabs'

export function useElevenLabs() {
  const client = useMemo(() => new ElevenLabsClient({
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY as string
  }), [])
  
  return client
} 