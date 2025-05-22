import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { Job, JobQuery } from '../../services/api';
import JobFilter from './JobFilter';


const JobList: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<JobQuery>({});

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const data = await api.getJobs(filters);
                setJobs(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch jobs. Please try again later.');
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [filters]);

    const handleFilterChange = (newFilters: JobQuery) => {
        setFilters(newFilters);
    };

    const handleDeleteJob = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await api.deleteJob(id);
                setJobs(jobs.filter(job => job.id !== id));
            } catch (err) {
                setError('Failed to delete job. Please try again.');
                console.error('Error deleting job:', err);
            }
        }
    };

    return (
        <div className="container my-4">
            <h1 className="mb-4 text-center">Job Listings</h1>

            <JobFilter onFilterChange={handleFilterChange} />

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading jobs...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    No jobs found. Try adjusting your filters or add a new job.
                </div>
            ) : (
                <div className="row">
                    {jobs.map(job => (
                        <div className="col-md-6 col-lg-4 mb-4" key={job.id}>
                            <div className="job-card h-100">
                                <h2 className="job-title">{job.title}</h2>
                                <div className="job-company">
                                    <i className="fas fa-building me-2"></i> {job.company}
                                </div>
                                <div className="job-location">
                                    <i className="fas fa-map-marker-alt me-2"></i> {job.location || 'Not specified'}
                                </div>
                                <div className="job-salary">
                                    <i className="fas fa-money-bill-wave me-2"></i> {job.salary || 'Not specified'}
                                </div>
                                <div className="job-date">
                                    <i className="far fa-calendar-alt me-2"></i> Posted: {new Date(job.posted_date).toLocaleDateString()}
                                </div>
                                <p className="job-description">
                                    {job.description?.length > 100
                                        ? `${job.description.substr(0, 100)}...`
                                        : job.description || 'No description available.'}
                                </p>
                                <div className="job-actions">
                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm me-2"
                                    >
                                        <i className="fas fa-external-link-alt me-1"></i> Apply
                                    </a>
                                    <Link
                                        to={`/jobs/${job.id}`}
                                        className="btn btn-info btn-sm text-white me-2"
                                    >
                                        <i className="fas fa-eye me-1"></i> View
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        <i className="fas fa-trash-alt me-1"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center mt-4">
                <Link to="/add-job" className="btn btn-primary">
                    <i className="fas fa-plus-circle me-2"></i> Add New Job
                </Link>
            </div>
        </div>
    );
};

export default JobList; 