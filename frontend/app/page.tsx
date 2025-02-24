"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ingestRepository, sendChatMessage } from "@/lib/api"
import { Send, Mic, MicOff } from "lucide-react"
import type { Message, RepoContent } from "@/lib/types"
// import { ElevenLabsClient } from "elevenlabs"
import type { SpeechRecognition, SpeechRecognitionEvent } from "@/types"

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("")
  const [repoContent, setRepoContent] = useState<RepoContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef("")
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition setup
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = false
        recognitionInstance.interimResults = false

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          transcriptRef.current = transcript
          setInput(transcript)
        }

        recognitionInstance.onerror = () => setIsListening(false)
        
        recognitionInstance.onend = () => {
          setIsListening(false)
          if (transcriptRef.current.trim()) {
            submitButtonRef.current?.click()
          }
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  // Focus input when repo is loaded
  useEffect(() => {
    if (repoContent) {
      inputRef.current?.focus()
    }
  }, [repoContent])

  // Modify the scroll effect to use a timeout to ensure content is rendered
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleListening = () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
    setIsListening(!isListening)
  }

  const speakMessage = async (text: string) => {
    try {
      setIsPlaying(true);
      
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb", {
        method: "POST",
        headers: {
          "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      });
  
      if (!response.ok) throw new Error("Failed to fetch audio");
  
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(url);
      audioRef.current = audioElement;
      
      audioElement.onended = () => {
        URL.revokeObjectURL(url);
        setIsPlaying(false);
        audioRef.current = null;
      };
  
      await audioElement.play();
    } catch (error) {
      console.error("Text-to-speech failed:", error);
      setIsPlaying(false);
      audioRef.current = null;
    }
  };

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
        await speakMessage(response.response)
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

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      audioRef.current = null;
    }
  }

  // Add function to handle suggested question clicks
  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Submit the question immediately
    const userMessage: Message = { role: "user", content: question }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    sendChatMessage(question, repoUrl)
      .then(response => {
        if (response.success) {
          const aiMessage: Message = {
            role: "assistant",
            content: response.response
          }
          setMessages(prev => [...prev, aiMessage])
          speakMessage(response.response)
        } else {
          throw new Error(response.error || 'Failed to get response')
        }
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
        setError(errorMessage)
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `Error: ${errorMessage}`
        }])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <main className="container flex flex-col items-center min-h-screen py-24 gap-8">
      <div className="fixed top-4 right-8">
        <a 
          href="https://github.com/phillipyan300/GitInsight" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gray-900 hover:-translate-y-0.5 transition-transform flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
        </a>
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">
          GitInsights
        </h1>
        <p className="text-xl text-muted-foreground">
          Ask questions about any GitHub repository using text or voice.
        </p>
      </div>

      <Card className="w-full max-w-3xl bg-[#fffbf0] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <form onSubmit={handleRepoSubmit} className="flex gap-2">
            <Input
              className="border-2 border-black bg-white"
              placeholder="https://github.com/..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <Button 
              type="submit"
              className="bg-[#ffd698] text-black border-2 border-black hover:bg-[#ffc570]"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Analyze"}
            </Button>
          </form>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-[#f5e6d3] border-2 border-black hover:bg-[#f0d9bf]"
                onClick={() => setRepoUrl("https://github.com/phillipyan300/GitInsight")}
              >
                GitInsight
              </Button>
              <Button
                variant="outline"
                className="bg-[#f5e6d3] border-2 border-black hover:bg-[#f0d9bf]"
                onClick={() => setRepoUrl("https://github.com/ssocolow/flare_insure")}
              >
                Flare Insure
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea 
            ref={scrollAreaRef} 
            className="h-[450px] w-full rounded-md border p-6"
          >
            <div className="space-y-6">
              {error && (
                <div className="text-red-500 mb-6 p-4 bg-red-50 rounded-md">
                  Error: {error}
                </div>
              )}
              {repoContent && (
                <div className="space-y-6">
                  <div className="text-green-600 font-medium p-4 bg-green-50 rounded-md">
                    Repository was ingested successfully!
                  </div>
                  <div className="space-y-6">
                    {messages.map((message, i) => (
                      <div key={i} className="space-y-2 py-4">
                        {message.role === 'user' ? (
                          <div className="space-y-2">
                            <span className="font-semibold text-blue-600">You: </span>
                            <p className="text-gray-700">{message.content}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="font-semibold text-purple-600">GitInsights: </span>
                            <p className="text-gray-700">{message.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
        {repoContent && (
          <CardFooter className="pt-6">
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm bg-[#f5e6d3] border-2 border-black hover:bg-[#f0d9bf]"
                    onClick={() => handleSuggestedQuestion("Walk me through how this repository works")}
                  >
                    &ldquo;Walk me through how this repository works&rdquo;
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm bg-[#f5e6d3] border-2 border-black hover:bg-[#f0d9bf]"
                    onClick={() => handleSuggestedQuestion("What are the most important files in this repo?")}
                  >
                    &ldquo;What are the most important files in this repo?&rdquo;
                  </Button>
                </div>
              </div>
              <form onSubmit={handleChatSubmit} className="flex w-full space-x-4">
                <Input
                  ref={inputRef}
                  placeholder="Ask a question about the repository..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="text-lg border-2 border-black bg-white"
                />
                <div className="flex space-x-2">
                  <Button 
                    ref={submitButtonRef}
                    type="submit" 
                    disabled={isLoading}
                    className="px-6 bg-[#ffd698] text-black border-2 border-black hover:bg-[#ffc570]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                  <Button
                    type="button"
                    onClick={toggleListening}
                    variant={isListening ? "destructive" : "default"}
                    className="px-4"
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={stopSpeaking}
                    variant="outline"
                    className="px-4"
                    disabled={!isPlaying}
                  >
                    <span className="sr-only">Stop Speaking</span>
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                  </Button>
                </div>
              </form>
            </div>
          </CardFooter>
        )}
      </Card>
    </main>
  )
}