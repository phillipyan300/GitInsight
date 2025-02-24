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