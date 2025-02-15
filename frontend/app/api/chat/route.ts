import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages, data } = await req.json()
  const { repoUrl } = data

  const initialMessage = messages[0].content

  const systemMessage = `You are an AI assistant that helps developers understand GitHub repositories. 
  The user has provided the following GitHub repository URL: ${repoUrl}. 
  Analyze the repository structure, code, and documentation to provide insights and answer questions about the project.`

  const result = streamText({
    model: openai("gpt-4o"),
    messages: [{ role: "system", content: systemMessage }, ...messages],
  })

  return result.toDataStreamResponse()
}

