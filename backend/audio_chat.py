from openai import OpenAI  # Add explicit import
from elevenlabs import generate, play, set_api_key
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
set_api_key(os.getenv('ELEVENLABS_API_KEY'))

class AudioChatPipeline:
    def __init__(self):
        """Initialize the pipeline components"""
        logger.info("Initializing AudioChatPipeline...")
        logger.info("OpenAI configured successfully")
        
    def transcribe_audio(self, audio_file_path):
        """Convert speech to text using OpenAI Whisper API"""
        try:
            logger.info(f"Starting transcription of {audio_file_path}")
            
            with open(audio_file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            
            logger.info("Transcription completed successfully")
            return {
                'success': True,
                'text': transcription.text
            }
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_chat_response(self, text, context=""):
        """Get response from ChatGPT"""
        try:
            logger.info("Sending request to ChatGPT")
            prompt = f"Context: {context}\n\nUser: {text}\n\nAssistant:"
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant, retain a conversational tone and end the conversation with banana."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            logger.info("Received response from ChatGPT")
            return {
                'success': True,
                'text': response.choices[0].message.content
            }
        except Exception as e:
            logger.error(f"ChatGPT request failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def synthesize_speech(self, text):
        """Convert text to speech using ElevenLabs"""
        try:
            logger.info("Starting speech synthesis with ElevenLabs")
            audio = generate(
                text=text,
                voice="Josh",
                model="eleven_monolingual_v1"
            )
            logger.info("Speech synthesis completed successfully")
            return {
                'success': True,
                'audio': audio
            }
        except Exception as e:
            logger.error(f"Speech synthesis failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_audio_chat(self, audio_file_path, context=""):
        """Run the complete pipeline"""
        logger.info(f"Starting audio chat pipeline for {audio_file_path}")
        
        # 1. Transcribe audio to text
        logger.info("Step 1: Transcribing audio...")
        transcription = self.transcribe_audio(audio_file_path)
        if not transcription['success']:
            logger.error("Pipeline failed at transcription step")
            return transcription
        logger.info(f"Transcribed text: {transcription['text'][:100]}...")
        
        # 2. Get chat response
        logger.info("Step 2: Getting chat response...")
        chat_response = self.get_chat_response(transcription['text'], context)
        if not chat_response['success']:
            logger.error("Pipeline failed at chat response step")
            return chat_response
        logger.info(f"Chat response: {chat_response['text'][:100]}...")
        
        # 3. Convert response to speech
        logger.info("Step 3: Synthesizing speech...")
        speech = self.synthesize_speech(chat_response['text'])
        if not speech['success']:
            logger.error("Pipeline failed at speech synthesis step")
            return speech
        logger.info("Speech synthesis completed")
        
        logger.info("Pipeline completed successfully")
        return {
            'success': True,
            'transcription': transcription['text'],
            'chat_response': chat_response['text'],
            'audio_response': speech['audio']
        }

if __name__ == "__main__":
    # Test the pipeline
    logger.info("Starting test run...")
    
    # Debug: Print current working directory and absolute path
    current_dir = os.getcwd()
    test_file = "./test.m4a"  # Changed to .m4a based on your file tree
    abs_path = os.path.abspath(test_file)
    
    logger.info(f"Current directory: {current_dir}")
    logger.info(f"Looking for file at: {abs_path}")
    
    if not os.path.exists(test_file):
        logger.error(f"Test file {test_file} not found!")
        exit(1)
    
    pipeline = AudioChatPipeline()
    result = pipeline.process_audio_chat(
        test_file,
        context="This is a test conversation about programming."
    )
    
    if result['success']:
        logger.info("Test completed successfully")
        print("\n=== Transcription ===")
        print(result['transcription'])
        print("\n=== Chat Response ===")
        print(result['chat_response'])
        print("\n=== Playing Audio Response ===")
        play(result['audio_response'])
    else:
        logger.error(f"Test failed: {result.get('error')}") 