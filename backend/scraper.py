import time
import logging
import random
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User agents to rotate - expanded list for better scraping success
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/113.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15'
]

def get_random_user_agent():
    """Return a random user agent from the list"""
    return random.choice(USER_AGENTS)

def setup_driver():
    """Set up and return a Selenium webdriver with appropriate options"""
    chrome_options = Options()
    
    # Add options to make Chrome run in headless mode
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Set user agent
    chrome_options.add_argument(f"user-agent={get_random_user_agent()}")
    
    # Additional options to avoid detection
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    
    # Initialize the Chrome driver with options
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Set the page load timeout
        driver.set_page_load_timeout(30)
        
        return driver
    except WebDriverException as e:
        logger.error(f"Error setting up WebDriver: {e}")
        return None

def get_linkedin_page(driver, search, location, max_retries=3):
    """Navigate to LinkedIn job search page using Selenium"""
    url = f'https://www.linkedin.com/jobs/search?keywords={search}&location={location}&geoId=&trk=public_jobs_jobs-search-bar_search-submit&position=1&pageNum=0'
    
    for attempt in range(max_retries):
        try:
            # Add random delay between requests
            delay = random.uniform(1.0, 3.0)
            time.sleep(delay)
            
            # Navigate to the URL
            driver.get(url)
            
            # Wait for page to load with more flexibility
            try:
                # First try to wait for the results list
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "ul.jobs-search__results-list"))
                )
                logger.info(f"Found main results list for {search} in {location}")
                # Add a more substantial wait to ensure the page loads properly
                time.sleep(random.uniform(3.0, 5.0))
                return True
            except TimeoutException:
                # If results list not found, try looking for any job cards
                selectors = [
                    "div.base-search-card__info",
                    "li.jobs-search-results__list-item",
                    "div.job-search-card",
                    "div.job-card-container",
                    ".job-card-list"
                ]
                
                for selector in selectors:
                    try:
                        WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                        logger.info(f"Found job cards using selector {selector} for {search} in {location}")
                        # Add a more substantial wait to ensure the page loads properly
                        time.sleep(random.uniform(3.0, 5.0))
                        return True
                    except TimeoutException:
                        continue
                
                # If we got here, no specific job card selector worked, 
                # but the page might still have loaded (LinkedIn can have different structures)
                # Check if we at least have the main content area
                try:
                    WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "main"))
                    )
                    logger.info(f"Found main content area for {search} in {location}")
                    # Take a screenshot to debug
                    try:
                        screenshot_path = f"linkedin_search_{search}_{location}.png"
                        driver.save_screenshot(screenshot_path)
                        logger.info(f"Saved screenshot to {screenshot_path}")
                    except Exception as e:
                        logger.warning(f"Could not save screenshot: {e}")
                    
                    # Even if we couldn't find specific job card selectors, return True as the page loaded
                    # Add a more substantial wait to ensure the page loads properly
                    time.sleep(random.uniform(3.0, 5.0))
                    return True
                except TimeoutException:
                    logger.warning(f"Could not find main content for {search} in {location}")
                    # Continue to retry
            
        except WebDriverException as e:
            logger.error(f"Error loading LinkedIn jobs (attempt {attempt+1}/{max_retries}): {e}")
            time.sleep(random.uniform(2.0, 4.0))  # Longer delay after error
            
    logger.error(f"Failed to load LinkedIn jobs after {max_retries} attempts")
    return False

def extract_job_details_selenium(job_element):
    """Extract job details from a job card element using Selenium"""
    try:
        # Try multiple selectors for job title
        title = ''
        title_selectors = [
            "h3.base-search-card__title",
            "h3.job-search-card__title",
            ".job-card-container__title", 
            ".job-card-list__title"
        ]
        
        for selector in title_selectors:
            try:
                title_element = job_element.find_element(By.CSS_SELECTOR, selector)
                title = title_element.text.strip()
                if title:
                    break
            except NoSuchElementException:
                continue
                
        # If title not found, try looking at parent element
        if not title:
            try:
                # Look for parent card and then find title
                parent_card = job_element.find_element(By.XPATH, "./..")
                title_elements = parent_card.find_elements(By.CSS_SELECTOR, "h3")
                if title_elements:
                    title = title_elements[0].text.strip()
            except NoSuchElementException:
                pass
        
        # Try multiple selectors for company name
        company_name = ''
        company_selectors = [
            "h4.base-search-card__subtitle",
            "h4.job-search-card__subtitle",
            ".job-card-container__company-name",
            ".job-card-container__primary-description",
            ".job-card-list__company-name"
        ]
        
        for selector in company_selectors:
            try:
                company_element = job_element.find_element(By.CSS_SELECTOR, selector)
                company_name = company_element.text.strip()
                if company_name:
                    break
            except NoSuchElementException:
                continue
                
        # If company not found, try looking at parent element
        if not company_name:
            try:
                parent_card = job_element.find_element(By.XPATH, "./..")
                company_elements = parent_card.find_elements(By.CSS_SELECTOR, "h4")
                if company_elements:
                    company_name = company_elements[0].text.strip()
            except NoSuchElementException:
                pass
        
        # Try multiple selectors for location
        location = ''
        location_selectors = [
            "span.job-search-card__location",
            ".job-card-container__metadata-item",
            ".job-card-container__metadata-wrapper",
            ".job-card-list__location"
        ]
        
        for selector in location_selectors:
            try:
                location_element = job_element.find_element(By.CSS_SELECTOR, selector)
                location = location_element.text.strip()
                if location:
                    break
            except NoSuchElementException:
                continue
        
        # Extract time posted if available
        posted_time = 'N/A'
        date = datetime.utcnow().isoformat()
        try:
            time_element = job_element.find_element(By.TAG_NAME, "time")
            posted_time = time_element.text.strip()
            date = time_element.get_attribute("datetime")
        except NoSuchElementException:
            # Try alternative selectors for time
            time_selectors = [".job-search-card__listdate", ".job-card-container__metadata-item--posted-date"]
            for selector in time_selectors:
                try:
                    time_element = job_element.find_element(By.CSS_SELECTOR, selector)
                    posted_time = time_element.text.strip()
                    date_attr = time_element.get_attribute("datetime")
                    if date_attr:
                        date = date_attr
                    break
                except NoSuchElementException:
                    continue
        
        # Extract job URL
        job_url = 'N/A'
        try:
            # Try first for anchor tag directly in the job element
            link_element = job_element.find_element(By.TAG_NAME, "a")
            job_url = link_element.get_attribute("href")
        except NoSuchElementException:
            # Try parent element if no anchor found
            try:
                parent = job_element.find_element(By.XPATH, "./..")
                link_element = parent.find_element(By.TAG_NAME, "a")
                job_url = link_element.get_attribute("href")
            except NoSuchElementException:
                # Try grandparent
                try:
                    grandparent = job_element.find_element(By.XPATH, "./../..")
                    link_element = grandparent.find_element(By.TAG_NAME, "a")
                    job_url = link_element.get_attribute("href")
                except NoSuchElementException:
                    pass
        
        # Skip jobs with missing essential data
        if not title or not company_name:
            logger.warning(f"Skipping job with missing data: Title='{title}', Company='{company_name}'")
            return None
        
        # Use job_url as the description as per original code
        description = job_url
        
        # Set salary to N/A since LinkedIn doesn't typically show salary on the cards
        salary = 'N/A'
        
        # Create job data dictionary
        job_data = {
            'title': title,
            'company': company_name,
            'location': location or 'Not specified',
            'description': description,  # Using job_url as description
            'url': job_url,
            'salary': salary,
            'posted_date': datetime.utcnow(),  # Convert to datetime object for database
            'is_active': True
        }
        
        logger.info(f"Extracted job: {title} at {company_name}")
        return job_data
        
    except Exception as e:
        logger.error(f"Error extracting job details: {e}")
        return None

def scrape_linkedin(search_terms=None, max_retries=3):
    """Scrape job listings from LinkedIn using Selenium"""
    logger.info("Starting LinkedIn scraper with Selenium")
    
    if search_terms is None:
        # Default search terms if none provided
        search_terms = [
            {"search": "software engineer", "location": "Pakistan"},
            {"search": "developer", "location": "Pakistan"},
            {"search": "web developer", "location": "Pakistan"},
            {"search": "python", "location": "Pakistan"}
        ]
    
    all_jobs = []
    driver = None
    # Track unique jobs during extraction to prevent duplicates
    seen_job_identifiers = set()
    
    try:
        # Initialize the driver
        driver = setup_driver()
        if not driver:
            logger.error("Failed to initialize WebDriver")
            return all_jobs
        
        for terms in search_terms:
            search = terms["search"]
            location = terms["location"]
            
            logger.info(f"Searching for {search} in {location}")
            
            # Navigate to LinkedIn jobs page
            success = get_linkedin_page(driver, search, location, max_retries)
            
            if not success:
                logger.warning(f"Could not load LinkedIn jobs page for {search} in {location}")
                continue
            
            # Wait for a moment to ensure the page is fully loaded
            time.sleep(5)
            
            # Try different selectors for job cards - expanded list with more options
            job_cards = []
            selectors = [
                "div.base-search-card__info",
                "li.jobs-search-results__list-item",
                "div.job-search-card",
                "div.job-card-container",
                "li.jobs-search-two-pane__job-card-container--viewport-tracking-0",
                "div.jobs-search-results__list-item",
                ".job-card-list",
                "ul.jobs-search__results-list > li",
                ".job-card-container__link"
            ]
            
            # First try to get the list container
            try:
                results_list = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "ul.jobs-search__results-list"))
                )
                # Get all list items from the results list
                job_cards = results_list.find_elements(By.TAG_NAME, "li")
                logger.info(f"Found {len(job_cards)} job cards from results list")
            except (TimeoutException, NoSuchElementException, WebDriverException) as e:
                logger.warning(f"Could not find main results list: {e}")
                # Continue with other selectors
            
            # If no job cards found yet, try the different selectors
            if not job_cards:
                for selector in selectors:
                    try:
                        job_cards = driver.find_elements(By.CSS_SELECTOR, selector)
                        if job_cards:
                            logger.info(f"Found {len(job_cards)} job cards using selector: {selector}")
                            break
                    except WebDriverException as e:
                        logger.warning(f"Error finding elements with selector {selector}: {e}")
            
            if not job_cards:
                # One last attempt - get all divs with certain classes that might contain job info
                try:
                    job_cards = driver.find_elements(By.CSS_SELECTOR, "div[class*='job-']")
                    logger.info(f"Found {len(job_cards)} potential job cards using general job class selector")
                except WebDriverException as e:
                    logger.warning(f"Error finding elements with general job class selector: {e}")
            
            if not job_cards:
                logger.warning(f"No job cards found for {search} in {location}")
                continue
            
            logger.info(f"Found {len(job_cards)} job cards for {search} in {location}")
            
            valid_jobs = 0
            duplicates_skipped = 0
            
            for job in job_cards:
                job_data = extract_job_details_selenium(job)
                if job_data:
                    # Create a unique identifier for this job
                    job_identifier = f"{job_data['title']}|{job_data['company']}|{job_data['location']}"
                    
                    # Skip if we've already seen this job
                    if job_identifier in seen_job_identifiers:
                        duplicates_skipped += 1
                        logger.info(f"Skipping duplicate during extraction: {job_data['title']} at {job_data['company']}")
                        continue
                    
                    # Add to seen jobs
                    seen_job_identifiers.add(job_identifier)
                    all_jobs.append(job_data)
                    valid_jobs += 1
            
            logger.info(f"Successfully extracted {valid_jobs} valid jobs, skipped {duplicates_skipped} duplicates out of {len(job_cards)} cards")
            
            # If we found jobs, we can continue to next search term
            # Don't break early to get more variety of jobs
        
    except Exception as e:
        logger.error(f"Error in scrape_linkedin: {e}")
    
    finally:
        # Close the driver
        if driver:
            try:
                driver.quit()
                logger.info("WebDriver closed successfully")
            except Exception as e:
                logger.error(f"Error closing WebDriver: {e}")
    
    logger.info(f"Scraping completed. Found {len(all_jobs)} unique jobs")
    return all_jobs

def scrape_and_save(db, Job, app=None):
    """Scrape jobs from LinkedIn and save to database"""
    try:
        # Define search terms to try
        search_terms = [
            {"search": "software engineer", "location": "Pakistan"},
            {"search": "developer", "location": "Pakistan"},
            {"search": "web developer", "location": "Pakistan"},
            {"search": "python", "location": "Pakistan"},
            {"search": "data scientist", "location": "Pakistan"},
            {"search": "frontend developer", "location": "Pakistan"}
        ]
        
        # Scrape LinkedIn jobs
        jobs = scrape_linkedin(search_terms)
        
        if not jobs:
            logger.error("Could not scrape any jobs from LinkedIn")
            return
        
        # If app is provided, ensure we're in app context
        if app:
            ctx = app.app_context()
            ctx.push()
        
        try:
            jobs_added = 0
            jobs_skipped = 0
            
            # Create a set to track unique job combinations
            seen_jobs = set()
            
            for job_data in jobs:
                # Create a unique identifier using title, company, and location
                job_identifier = f"{job_data['title']}|{job_data['company']}|{job_data['location']}"
                
                # Check if job already exists by URL or by title+company+location combination
                existing_job = Job.query.filter(
                    (Job.url == job_data['url']) | 
                    ((Job.title == job_data['title']) & 
                     (Job.company == job_data['company']) & 
                     (Job.location == job_data['location']))
                ).first()
                
                # Also check if we've already seen this job in the current batch
                if existing_job or job_identifier in seen_jobs:
                    jobs_skipped += 1
                    logger.info(f"Skipping duplicate job: {job_data['title']} at {job_data['company']}")
                    continue
                
                # Add to seen jobs set
                seen_jobs.add(job_identifier)
                
                # Log description to debug
                logger.info(f"Adding job with description length: {len(str(job_data['description']))}")
                
                # Create new job
                new_job = Job(
                    title=job_data['title'],
                    company=job_data['company'],
                    location=job_data['location'],
                    description=job_data['description'],
                    url=job_data['url'],
                    salary=job_data['salary'],
                    posted_date=job_data['posted_date'],
                    is_active=True
                )
                
                db.session.add(new_job)
                jobs_added += 1
                logger.info(f"Added new job: {job_data['title']}")
            
            db.session.commit()
            logger.info(f"Jobs saved to database. {jobs_added} new jobs added, {jobs_skipped} duplicates skipped.")
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error saving jobs to database: {e}")
        
        finally:
            # Pop the context if we pushed it
            if app:
                ctx.pop()
    
    except Exception as e:
        logger.error(f"Error in scrape_and_save: {e}") 