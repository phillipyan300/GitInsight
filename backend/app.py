from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from gitingest_scraper import ingest_repository

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/ingest', methods=['POST'])
def ingest_from_web():
    """Ingest a repository by scraping gitingest.com"""
    try:
        data = request.get_json()
        repo_url = data.get('url')
        
        if not repo_url:
            return jsonify({'error': 'No URL provided'}), 400

        result = ingest_repository(repo_url)
        return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error in ingest endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test', methods=['GET'])
def test_gitingest():
    """Test endpoint using GitInsight repository"""
    try:
        test_url = "https://github.com/phillipyan300/GitInsight"
        result = ingest_repository(test_url)
        print(result)
        
        return jsonify({
            'success': True,
            'url_tested': test_url,
            'content': result['content']
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