from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from gitingest_scraper import ingest_repository

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

        return jsonify(result)

    except Exception as e:
        logger.error(f"Error ingesting repository: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")
        repo_url = data.get("repo_url")

        if not message or not repo_url:
            return jsonify({"error": "Message and repo_url are required"}), 400

        response = f"This is a response about {repo_url}. You asked: {message}"
        return jsonify({"response": response})

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8000)
