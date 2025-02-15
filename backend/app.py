from flask import Flask, request, jsonify
from flask_cors import CORS
from gitingest import ingest
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/ingest-sync', methods=['POST'])
def ingest_repository_sync():
    """Synchronous version of the ingest endpoint"""
    try:
        data = request.get_json()
        repo_url = data.get('url')
        
        if not repo_url:
            return jsonify({'error': 'No URL provided'}), 400

        # Use the synchronous version
        summary, tree, content = ingest(repo_url)
        
        # Log first 100 characters of content
        logger.info(f"First 100 chars of content: {content[:100]}")
        
        return jsonify({
            'success': True,
            'summary': summary,
            'tree': tree,
            'content': content
        })
            
    except Exception as e:
        logger.error(f"Error processing repository: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/test', methods=['GET'])
def test_gitingest():
    """Test endpoint using their own repository"""
    try:
        test_url = "https://github.com/cyclotruc/gitingest"
        summary, tree, content = ingest(test_url)
        
        # Log first 100 characters of content
        logger.info(f"First 1000 chars of test content: {content[:1000]}")
        
        return jsonify({
            'success': True,
            'url_tested': test_url,
            'summary': summary,
            'tree': tree,
            'content': content
        })
            
    except Exception as e:
        logger.error(f"Error in test endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'url_tested': test_url
        }), 500

@app.route('/')
def hello_world():
    return {'message': 'Hello, World!'}

if __name__ == '__main__':
    app.run(debug=True, port=5000) 