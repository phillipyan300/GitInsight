from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import os
from gitingest_scraper import ingest_repository
from chat_pipeline import get_chat_response

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)
# Path for temporary storage
TEMP_STORAGE_FILE = "temp_context.json"


def save_context(content, tree):
    """Save the current context to a temporary file"""
    context = {"content": content, "tree": tree}
    with open(TEMP_STORAGE_FILE, "w") as f:
        json.dump(context, f)


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
        full_context = f"Repository Context:\n{context['content']}\n\nDirectory Structure:\n{context['tree']}"

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


if __name__ == "__main__":
    app.run(debug=True, port=8000)
