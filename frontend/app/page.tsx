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

  return (
    <main className="container flex flex-col items-center min-h-screen py-24 gap-8">
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
                Next.js
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[450px] w-full rounded-md border p-6">
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
          </ScrollArea>
        </CardContent>
        {repoContent && (
          <CardFooter className="pt-6">
            <form onSubmit={handleChatSubmit} className="flex w-full space-x-4">
              <Input
                ref={inputRef}
                placeholder="Ask a question about the repository..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="text-lg"
              />
              <div className="flex space-x-2">
                <Button 
                  ref={submitButtonRef}
                  type="submit" 
                  disabled={isLoading}
                  className="px-6"
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
          </CardFooter>
        )}
      </Card>
    </main>
  )
}