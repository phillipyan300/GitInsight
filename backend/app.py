from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
from gitingest_scraper import ingest_repository
from chat_pipeline import get_chat_response_sync as get_chat_response

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "https://gitinsight.vercel.app"],
            "methods": ["POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)
# Path for temporary storage
TEMP_STORAGE_FILE = "temp_context.json"

def save_context(content, tree):
    """
    Save the repository context as an array of files.
    
    Expected format for each file section:
      =================================================
      File: <filename>
      =================================================
      <file content lines...>
    
    Args:
        content (str): Raw content from gitingest.
        tree (str): Directory structure from gitingest.
    """
    lines = content.splitlines()
    files = []
    i = 0

    while i < len(lines):
        # Look for the delimiter line indicating a new file section
        if lines[i].strip() == "================================================":
            i += 1  # Move to the next line which should be the file header
            if i < len(lines) and lines[i].startswith("File: "):
                # Extract file name
                current_file = lines[i].replace("File: ", "").strip()
                i += 1
                # Skip the next delimiter line, if it exists
                if i < len(lines) and lines[i].strip() == "================================================":
                    i += 1
                # Gather content lines until the next delimiter or end of file
                current_content = []
                while i < len(lines) and lines[i].strip() != "================================================":
                    current_content.append(lines[i])
                    i += 1
                files.append({
                    "file": current_file,
                    "content": "\n".join(current_content).strip()
                })
            else:
                # If no file header is found, skip to the next line
                i += 1
        else:
            i += 1

    # Add tree structure as a special file entry
    files.append({
        "file": "_directory_structure",
        "content": tree
    })

    # Save the result as a JSON array
    with open(TEMP_STORAGE_FILE, "w") as f:
        json.dump(files, f, indent=2)


def load_context():
    """Load the current context from temporary file"""
    if not os.path.exists(TEMP_STORAGE_FILE):
        return None
    with open(TEMP_STORAGE_FILE, "r") as f:
        return json.load(f)


@app.route("/api/ingest", methods=["POST"])
def ingest_repo():
    try:
        data = request.get_json()
        repo_url = data.get("url")

        if not repo_url:
            return jsonify({"error": "No URL provided"}), 400

        result = ingest_repository(repo_url)

        if not result["success"]:
            return (
                jsonify(
                    {"success": False, "error": result.get("error", "Unknown error")}
                ),
                400,
            )

        # Save the context for later use
        save_context(result["content"], result["tree"])

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error ingesting repository: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat endpoint that uses stored context"""
    try:
        data = request.get_json()
        message = data.get("message")
        repo_url = data.get("repo_url")

        if not message or not repo_url:
            return (
                jsonify(
                    {"success": False, "error": "Message and repo_url are required"}
                ),
                400,
            )

        # Load the stored context
        context = load_context()
        if not context:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "No context available. Please ingest a repository first.",
                    }
                ),
                400,
            )

        # Combine content and tree for context
        full_context = get_full_context(context)

        # Get chat response using our chat pipeline
        result = get_chat_response(message, full_context)

        if not result["success"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": result.get("error", "Failed to get chat response"),
                    }
                ),
                500,
            )

        return jsonify(
            {"success": True, "response": result["response"], "repo_url": repo_url}
        )

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route("/hi")
def hi():
    return "hi"

@app.route("/test")
def test():
    """Test endpoint using a sample repository"""
    try:
        test_url = "https://github.com/phillipyan300/GitInsight"
        result = ingest_repository(test_url)

        if not result["success"]:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": result.get("error", "Unknown error"),
                        "url_tested": test_url,
                    }
                ),
                500,
            )

        # Save the context for later use
        save_context(result["content"], result["tree"])

        return jsonify(
            {
                "success": True,
                "url_tested": test_url,
                "content": result["content"],
                "tree": result["tree"],
            }
        )

    except Exception as e:
        logger.error(f"Error in test endpoint: {str(e)}")
        return jsonify({"success": False, "error": str(e), "url_tested": test_url}), 500


@app.route("/test-curl-get")
def test_curl_get():
    """Even simpler endpoint to test curl GET requests"""
    logger.info("Received GET request to /test-curl-get")
    print("Received GET request to /test-curl-get")  # Direct console output
    return jsonify({"success": True, "message": "GET request successful!"})


@app.route("/")
def hello_world():
    return {"message": "Hello, World!"}


def get_full_context(context):
    """
    Convert context array into a single string for the AI.
    
    Args:
        context (list): Array of file objects with 'file' and 'content' keys
        
    Returns:
        str: Formatted string containing all files and their contents
    """
    # Build context string
    parts = []
    
    # First add all regular files
    for file in context:
        if file["file"] != "_directory_structure":
            parts.append(f"File: {file['file']}\n{file['content']}")
    
    # Then add directory structure at the end
    for file in context:
        if file["file"] == "_directory_structure":
            parts.append(f"Directory Structure:\n{file['content']}")
            break
    
    return "\n\n".join(parts)


if __name__ == "__main__":
    app.run(debug=True, port=8000)
