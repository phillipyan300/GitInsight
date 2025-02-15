import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ingest_repository(repo_url, timeout=30):
    """
    Convert github URL to gitingest URL and fetch the content using Selenium.
    Waits for dynamic content to load.
    """
    driver = None
    try:
        gitingest_url = repo_url.replace('github.com', 'gitingest.com')
        logger.info(f"Fetching from: {gitingest_url}")
        
        # Setup headless Chrome
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=chrome_options)
        
        # Load the page
        driver.get(gitingest_url)
        
        # Wait for the result-text element to be present
        logger.info("Waiting for content to load...")
        content_area = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CLASS_NAME, "result-text"))
        )
        
        content = content_area.text
        if not content.strip():
            return {
                'success': False,
                'error': 'Content was empty'
            }
        
        logger.info(f"Successfully retrieved content")
        return {
            'success': True,
            'content': content
        }
            
    except Exception as e:
        logger.error(f"Error during ingestion: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    test_url = "https://github.com/phillipyan300/GitInsight"
    result = ingest_repository(test_url)
    if result['success']:
        print("Success! First 100 characters of content:")
        print(result['content'][:100])
    else:
        print(f"Error: {result['error']}") 