from app import app, db, init_scheduler
import os
from scraper import scrape_and_save
from app import Job

def create_db():
    """Create the database tables if they don't exist"""
    with app.app_context():
        db.create_all()
        print("Database tables created")

def main():
    """Main entry point for the application"""
    # Create database tables
    create_db()
    
    # Run scraper immediately at startup
    with app.app_context():
        print("Running initial scrape...")
        scrape_and_save(db, Job, app)
        print("Initial scrape completed")
    
    # Initialize the scheduler for regular scraping
    with app.app_context():
        init_scheduler()
    
    # Run the Flask application
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)

if __name__ == "__main__":
    main()

# To run in PowerShell:
# cd E:\Job-listing\backend
# python main.py 