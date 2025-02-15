"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ingestRepository, sendChatMessage } from "@/lib/api"
import { Send, Mic, MicOff } from "lucide-react"
import type { Message, RepoContent } from "@/lib/types"

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [repoContent, setRepoContent] = useState<RepoContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition setup
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          handleChatSubmit(new Event('submit') as any)
        }

        recognitionInstance.onerror = () => setIsListening(false)
        recognitionInstance.onend = () => setIsListening(false)

        setRecognition(recognitionInstance)
      }

      // Speech Synthesis setup
      if ('speechSynthesis' in window) {
        setSynthesis(window.speechSynthesis)
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
    setIsListening(!isListening)
  }

  const speakMessage = (text: string) => {
    if (synthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      synthesis.speak(utterance)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !repoUrl) return

    const userMessage: Message = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input // Store current input
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await sendChatMessage(currentInput, repoUrl)
      if (response.success) {
        const aiMessage: Message = {
          role: "assistant",
          content: response.response
        }
        setMessages(prev => [...prev, aiMessage])
        if (synthesis) {
          speakMessage(response.response)
        }
      } else {
        throw new Error(response.error || 'Failed to get response')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      setError(errorMessage)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${errorMessage}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await ingestRepository(repoUrl)
      setRepoContent(result)
      setMessages([{
        role: "assistant",
        content: `Repository ingested successfully! I'm ready to chat about the repository: ${repoUrl}. What would you like to know?`
      }])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setRepoContent(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>GitHub Repo Analysis</CardTitle>
          <CardDescription>Enter a GitHub repository URL to analyze its content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRepoSubmit} className="flex space-x-2 mb-4">
            <Input
              type="url"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Analyze"}
            </Button>
          </form>

          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {error && (
              <div className="text-red-500 mb-4">
                Error: {error}
              </div>
            )}
            {repoContent && (
              <div className="space-y-4">
                <div className="text-green-600 font-medium mb-4">
                  Repository was ingested successfully!
                </div>
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div key={i} className="space-y-1">
                      {message.role === 'user' ? (
                        <div>
                          <span className="font-semibold">You: </span>
                          {message.content}
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold">Gitman: </span>
                          {message.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        {repoContent && (
          <CardFooter>
            <form onSubmit={handleChatSubmit} className="flex w-full space-x-2">
              <Input
                placeholder="Ask a question about the repository..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send"}
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
        )}
      </Card>
    </main>
  )
}