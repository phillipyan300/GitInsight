"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, MicOff } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        handleMessageSubmit(transcript)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSynthesis(window.speechSynthesis)
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop()
    } else {
      recognition?.start()
    }
    setIsListening(!isListening)
  }

  const speakMessage = (text: string) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      synthesis.speak(utterance)
    }
  }

  const handleMessageSubmit = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = { role: "user", content: message }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInput("")

    // Here you would send the message to your backend
    console.log("Sending message:", message)

    // Simulating an AI response
    setTimeout(() => {
      const aiResponse = "This is a simulated response. In a real application, this would be the response from your AI backend."
      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse,
      }
      setMessages((prevMessages) => [...prevMessages, aiMessage])
      speakMessage(aiResponse) // Speak the AI's response
    }, 1000)
  }

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleMessageSubmit(input)
  }

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
            <Button 
              type="button" 
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  )
}

