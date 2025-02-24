const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function ingestRepository(url: string) {
    const response = await fetch(`${API_URL}/api/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to ingest repository');
    }

    return data;
}

export async function sendChatMessage(message: string, repo_url: string) {
    const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, repo_url }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
    }

    if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
    }

    return data;
} 