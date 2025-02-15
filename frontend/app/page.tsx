"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  const handleRepoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Here you would typically start a new chat session
    console.log("Starting chat for repo:", repoUrl)
    setMessages([
      {
        role: "assistant",
        content: `Hello! I'm ready to chat about the repository: ${repoUrl}. What would you like to know?`,
      },
    ])
  }

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")

    // Here you would typically send the message to your backend
    console.log("Sending message:", input)

    // Simulating an AI response
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content:
          "This is a simulated response. In a real application, this would be the response from your AI backend.",
      }
      setMessages((prevMessages) => [...prevMessages, aiMessage])
    }, 1000)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>GitHub Repo Chat</CardTitle>
          <CardDescription>Enter a GitHub repository URL to start a conversation about the project.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRepoSubmit} className="flex space-x-2 mb-4">
            <Input
              type="url"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
            <Button type="submit">Start Chat</Button>
          </form>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {messages.map((message, index) => (
              <div key={index} className="mb-4">
                <div className="font-bold">{message.role === "user" ? "You" : "AI"}:</div>
                <div>{message.content}</div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleChatSubmit} className="flex w-full space-x-2">
            <Input
              placeholder="Ask a question about the repository..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}

