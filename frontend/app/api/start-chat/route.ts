import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { repoUrl } = await req.json()

  try {
    const response = await fetch("http://your-python-backend-url/start-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl }),
    })

    if (!response.ok) {
      throw new Error("Failed to start chat")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to start chat" }, { status: 500 })
  }
}

