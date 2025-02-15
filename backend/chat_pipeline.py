import google.generativeai as genai
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY not found in environment variables")

# Initialize Gemini client if API key is available
if api_key:
    genai.configure(api_key=api_key)


def get_chat_response(text, context=""):
    """
    Get a response from Gemini for the given text and context.

    Args:
        text (str): The user's input text
        context (str): Optional context to help guide the response

    Returns:
        dict: {
            'success': bool,
            'response': str,  # The chat response if successful
            'error': str     # Error message if not successful
        }
    """
    try:
        if not api_key:
            return {"success": False, "error": "Google API key not configured"}

        logger.info("Sending request to Gemini")

        # Create the model
        model = genai.GenerativeModel("gemini-pro")

        # Truncate context if too long (Gemini has a token limit)
        max_context_length = 10000  # Adjust this value based on testing
        if len(context) > max_context_length:
            context = context[:max_context_length] + "..."

        # System prompt to set behavior
        system_prompt = """You are Gitman, an AI assistant that:
        1. Specializes in analyzing and explaining code repositories
        2. Speaks in a natural, conversational way
        3. References specific parts of the code when relevant
        4. Keeps responses clear and concise
        
        When analyzing repositories:
        - Point out interesting patterns or design choices
        - Explain technical concepts in simple terms
        - Use examples from the actual codebase
        """

        # Combine system prompt, context, and user question
        full_prompt = f"""{system_prompt}

        Repository Context:
        {context}

        User Question: {text}"""

        try:
            # Generate response with safety checks
            response = model.generate_content(full_prompt)

            if not response or not response.text:
                return {"success": False, "error": "Failed to generate response"}

            logger.info("Received response from Gemini")
            return {"success": True, "response": response.text}

        except Exception as e:
            logger.error(f"Generation error: {str(e)}")
            return {"success": False, "error": f"Failed to generate response: {str(e)}"}

    except Exception as e:
        logger.error(f"Gemini request failed: {str(e)}")
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    # Test the chat pipeline
    test_input = "What are the key principles of clean code?"
    test_context = "We are discussing software development best practices."

    logger.info(f"Testing chat pipeline with input: {test_input}")
    result = get_chat_response(test_input, test_context)

    if result["success"]:
        print("\n=== Chat Response ===")
        print(result["response"])
        print("\n=== End of Response ===")
    else:
        logger.error(f"Test failed: {result['error']}")
