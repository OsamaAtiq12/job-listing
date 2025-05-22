from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from datetime import datetime
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
import logging


load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Set a default SQLite database URL if DATABASE_URL environment variable is not set
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///jobs.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

# Initialize database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100))
    description = db.Column(db.Text)
    url = db.Column(db.String(500))
    salary = db.Column(db.String(100))
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'description': self.description,
            'url': self.url,
            'salary': self.salary,
            'posted_date': self.posted_date.strftime('%Y-%m-%d %H:%M:%S'),
            'is_active': self.is_active
        }

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    # Get query parameters for filtering
    company = request.args.get('company')
    location = request.args.get('location')
    search = request.args.get('search')
    
    # Base query
    query = Job.query
    
    # Apply filters if provided
    if company:
        query = query.filter(Job.company.ilike(f'%{company}%'))
    if location:
        query = query.filter(Job.location.ilike(f'%{location}%'))
    if search:
        query = query.filter(
            db.or_(
                Job.title.ilike(f'%{search}%'),
                Job.description.ilike(f'%{search}%'),
                Job.company.ilike(f'%{search}%')
            )
        )
    
    # Get all jobs that match the filters
    jobs = query.order_by(Job.posted_date.desc()).all()
    print(jobs)
    return jsonify([job.to_dict() for job in jobs])



@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get_or_404(job_id)
    return jsonify(job.to_dict())

@app.route('/api/jobs', methods=['POST'])
def create_job():
    data = request.json
    
    if not data or not data.get('title') or not data.get('company'):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_job = Job(
        title=data.get('title'),
        company=data.get('company'),
        location=data.get('location'),
        description=data.get('description'),
        url=data.get('url'),
        salary=data.get('salary')
    )
    
    db.session.add(new_job)
    db.session.commit()
    
    return jsonify(new_job.to_dict()), 201


@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": f"Job {job_id} deleted"}), 200


@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    job = Job.query.get_or_404(job_id)
    data = request.json
    
    if 'title' in data:
        job.title = data['title']
    if 'company' in data:
        job.company = data['company']
    if 'location' in data:
        job.location = data['location']
    if 'description' in data:
        job.description = data['description']
    if 'url' in data:
        job.url = data['url']
    if 'salary' in data:
        job.salary = data['salary']
    if 'is_active' in data:
        job.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(job.to_dict())

# Manual trigger for scraping (useful for testing)
@app.route('/api/scrape', methods=['POST'])
def trigger_scrape():
    try:
        from scraper import scrape_and_save
        scrape_and_save(db, Job)
        return jsonify({"message": "Scraping completed successfully"}), 200
    except Exception as e:
        logger.error(f"Error triggering scrape: {e}")
        return jsonify({"error": str(e)}), 500

def init_scheduler():
    """Initialize the scheduler to run the scraper every minute"""
    try:
        from scraper import scrape_and_save
        
        scheduler = BackgroundScheduler(daemon=True)
        
        # Create a job function that passes the app
        def job_function():
            scrape_and_save(db, Job, app)
                
        scheduler.add_job(
            job_function, 
            'interval', 
            minutes=1,
            id='linkedin_scraper',
            replace_existing=True
        )
        scheduler.start()
        logger.info("Scheduler started. Scraper will run every 60 minutes.")
    except Exception as e:
        logger.error(f"Error initializing scheduler: {e}")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # Initialize the scheduler
    init_scheduler()
    app.run(debug=True) 