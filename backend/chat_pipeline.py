import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Gemini client
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key=api_key)

async def get_chat_response(text, context=""):
    """Get a response from Gemini using chat format"""
    try:
        logger.info("Creating chat session with Gemini")
        
        # Create chat session
        model = genai.GenerativeModel('gemini-2.0-flash-thinking-exp')
        chat = model.start_chat()
        
        # Format context as a structured message
        context_msg = f"""You are a senior developer with experience in frontend and backend. I will show you a codebase. Please analyze it and help answer questions about it.
        Keep responses under 100 words and reference specific code when relevant. Use plain text in paragraph f
        
        Here is the codebase:
        
        {context}
        
        Please confirm you've received the codebase."""
        
        # Send context and wait for confirmation
        await chat.send_message(context_msg)
        
        # Send the actual question
        question = f"""Based on the codebase I just shared, please answer this question:
        {text}"""
        
        response = await chat.send_message(question)
        
        logger.info("Received response from Gemini")
        return {
            'success': True,
            'response': response.text
        }
        
    except Exception as e:
        logger.error(f"Gemini chat request failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

# Synchronous wrapper for Flask
def get_chat_response_sync(text, context=""):
    """Synchronous wrapper for get_chat_response"""
    return asyncio.run(get_chat_response(text, context))

if __name__ == "__main__":
    # Test the chat pipeline
    test_input = "What are the key principles of clean code?"
    test_context = "We are discussing software development best practices."
    
    logger.info(f"Testing chat pipeline with input: {test_input}")
    result = get_chat_response_sync(test_input, test_context)
    
    if result['success']:
        print("\n=== Chat Response ===")
        print(result['response'])
        print("\n=== End of Response ===")
    else:
        logger.error(f"Test failed: {result['error']}")



# from openai import OpenAI
# from dotenv import load_dotenv
# import os
# import logging

# # Configure logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# # Load environment variables
# load_dotenv()

# # Initialize OpenAI client
# client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# def get_chat_response(text, context=""):
#     """
#     Get a response from ChatGPT for the given text and context.
    
#     Args:
#         text (str): The user's input text
#         context (str): Optional context to help guide the response
        
#     Returns:
#         dict: {
#             'success': bool,
#             'response': str,  # The chat response if successful
#             'error': str     # Error message if not successful
#         }
#     """
#     try:
#         logger.info("Sending request to ChatGPT")
        
#         # System message sets up how the AI should approach the repository
#         system_content = """You are an AI assistant that:
#         1. Specializes in analyzing and explaining code repositories
#         2. Speaks in a natural, conversational way (as if having a friendly chat)
#         3. References specific parts of the code when relevant
#         4. Keeps responses clear and concise
        
#         When analyzing repositories:
#         - Point out interesting patterns or design choices
#         - Explain technical concepts in simple terms
#         - Use examples from the actual codebase
#         """
        
#         # User message contains the specific question and repository context
#         user_content = f"""Repository Context:
#         {context}
        
#         User Question: {text}"""
        
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {"role": "system", "content": system_content},
#                 {"role": "user", "content": user_content}
#             ]
#         )
        
#         logger.info("Received response from ChatGPT")
#         return {
#             'success': True,
#             'response': response.choices[0].message.content
#         }
#     except Exception as e:
#         logger.error(f"ChatGPT request failed: {str(e)}")
#         return {
#             'success': False,
#             'error': str(e)
#         }

# if __name__ == "__main__":
#     # Test the chat pipeline
#     test_input = "What are the key principles of clean code?"
#     test_context = "We are discussing software development best practices."
    
#     logger.info(f"Testing chat pipeline with input: {test_input}")
#     result = get_chat_response(test_input, test_context)
    
#     if result['success']:
#         print("\n=== Chat Response ===")
#         print(result['response'])
#         print("\n=== End of Response ===")
#     else:
#         logger.error(f"Test failed: {result['error']}") 