from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize client with API key from .env
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

audio_file = open("./test.mp3", "rb")
transcription = client.audio.transcriptions.create(
    model="whisper-1", 
    file=audio_file
)

print(transcription.text)