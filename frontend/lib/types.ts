export interface Message {
    role: "user" | "assistant"
    content: string
}

export interface RepoContent {
    success: boolean
    content: string
    tree: string
    error?: string
}

// Add proper types for Web Speech API
interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string
            }
        }
    }
}

declare global {
    interface Window {
        webkitSpeechRecognition: any
        SpeechRecognition: any
    }
}

export interface SpeechRecognition {
    continuous: boolean
    interimResults: boolean
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: () => void
    onend: () => void
    start: () => void
    stop: () => void
} 