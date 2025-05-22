# Job Listings Web Application

A full-stack web application for managing job listings. Built with Flask (backend) and React (frontend).

## Features

- View, add, and delete job listings
- Filter jobs by company, location, or search terms
- Responsive UI based on Bootstrap
- Selenium-based job scraper that automatically collects job postings
- Scheduled scraping to keep job listings up-to-date

## Technology Stack

### Backend
- Flask (Python web framework)
- SQLAlchemy (ORM)
- Flask-Cors (Cross-Origin Resource Sharing)
- Flask-Migrate (Database migrations)
- MySQL/PostgreSQL (Database)
- Selenium (Web scraping)

### Frontend
- React (UI library)
- TypeScript (Type-safe JavaScript)
- React Router (Navigation)
- Axios (API client)
- Bootstrap (Styling)
- FontAwesome (Icons)

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js and npm
- MySQL or PostgreSQL
- Chrome/Chromium (for Selenium)
- ChromeDriver (for Selenium)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file with your database configuration:
   ```
   DATABASE_URL=mysql://username:password@localhost/joblistings
   ```

6. Create the database:
   - MySQL: `CREATE DATABASE joblistings;`
   - PostgreSQL: `CREATE DATABASE joblistings;`

7. Run the application:
   ```
   python main.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the API URL:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```
   npm start
   ```

## Usage

- The frontend will be available at `http://localhost:3000`
- The backend API will be available at `http://localhost:5000/api`
- The job scraper runs automatically daily at 2 AM
- You can manually trigger the scraper by running `python scraper.py`

## API Endpoints

- `GET /api/jobs` - Get all job listings (with optional filters)
- `GET /api/jobs/:id` - Get a specific job listing
- `POST /api/jobs` - Create a new job listing
- `PUT /api/jobs/:id` - Update a job listing
- `DELETE /api/jobs/:id` - Delete a job listing

## Database Configuration

The application supports both MySQL and PostgreSQL. You can switch between them by updating the database URL in your `.env` file:

- MySQL:
  ```
  DATABASE_URL=mysql://username:password@localhost/joblistings
  ```

- PostgreSQL:
  ```
  DATABASE_URL=postgresql://username:password@localhost/joblistings
  ``` 