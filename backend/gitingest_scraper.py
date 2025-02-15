import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

# Configure logging to show info level messages
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ingest_repository(repo_url, timeout=30):
    """
    Scrapes a GitHub repository's content from gitingest.com
    
    Args:
        repo_url (str): URL of the GitHub repository to analyze
        timeout (int): Maximum time to wait for page elements to load (default: 30s)
    
    Returns:
        dict: {
            'success': bool,
            'content': str,  # The full repository content digest
            'tree': str,     # The directory structure
            'error': str     # Only present if success is False
        }
    """
    driver = None
    try:
        # Convert GitHub URL to gitingest URL
        gitingest_url = repo_url.replace('github.com', 'gitingest.com')
        logger.info(f"Fetching from: {gitingest_url}")
        
        # Setup Chrome browser options
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Enable headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')  # Sometimes needed for headless
        chrome_options.add_argument('--window-size=1920,1080')  # Set a standard window size
        
        # Initialize the Chrome driver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Navigate to the gitingest page
        driver.get(gitingest_url)
        
        # Wait for both content elements to be present in the page
        logger.info("Waiting for content to load...")
        
        # Find the main content textarea using its full class list
        content_area = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((
                By.CSS_SELECTOR, 
                "textarea.result-text.w-full.p-4.bg-\\[\\#fff4da\\].border-\\[3px\\].border-gray-900.rounded.font-mono.text-sm.resize-y.focus\\:outline-none.relative.z-10"
            ))
        )
        
        # Find the directory structure in the hidden input field
        directory_structure = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.ID, "directory-structure-content"))
        )
        
        # Debug pause to visually verify the selected elements
        # logger.info("Found content! Pausing for 100 seconds so you can see what's selected...")
        # time.sleep(100)
        
        # Extract the text content and directory structure
        content = content_area.text
        tree = directory_structure.get_attribute('value')
        
        # Verify that content was actually retrieved
        if not content.strip():
            return {
                'success': False,
                'error': 'Content was empty'
            }
        
        logger.info(f"Successfully retrieved content and directory structure")
        return {
            'success': True,
            'content': content,
            'tree': tree
        }
            
    except Exception as e:
        logger.error(f"Error during ingestion: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
    finally:
        # Always close the browser
        if driver:
            driver.quit()

if __name__ == "__main__":
    # Test the script with a sample repository
    test_url = "https://github.com/phillipyan300/GitInsight"
    result = ingest_repository(test_url)
    
    if result['success']:
        print("\n=== Content Preview (first 100 chars) ===")
        print(result['content'][:100])
        print("\n=== Directory Structure ===")
        print(result['tree'])
        print("\n=== End of Test ===")
    else:
        print(f"Error: {result['error']}") 