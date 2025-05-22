import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { Job } from '../../services/api';

const JobDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                if (id) {
                    const jobData = await api.getJob(parseInt(id));
                    setJob(jobData);
                }
            } catch (err) {
                console.error('Error fetching job:', err);
                setError('Failed to load job details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;

        try {
            setDeleting(true);
            await api.deleteJob(parseInt(id));
            setShowDeleteModal(false);
            navigate('/');
        } catch (err) {
            console.error('Error deleting job:', err);
            setError('Failed to delete job. Please try again.');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading job details...</p>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error || 'Job not found'}
                </div>
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/')}
                >
                    Back to Jobs
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="container py-5">
                <div className="card shadow">
                    <div className="card-header d-flex justify-content-between align-items-center"
                        style={{ background: 'linear-gradient(150deg, #00c271 20%, #00657a 43%, #00367e 60%)', color: 'white' }}>
                        <h3 className="mb-0">{job.title}</h3>
                        <div>
                            <Link to={`/jobs/edit/${job.id}`} className="btn btn-light btn-sm me-2">
                                <i className="fas fa-edit me-1"></i> Edit
                            </Link>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <i className="fas fa-trash-alt me-1"></i> Delete
                            </button>
                        </div>
                    </div>

                    <div className="card-body p-4">
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">Company</h5>
                                <p className="fs-5">{job.company}</p>
                            </div>
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">Location</h5>
                                <p className="fs-5">{job.location || 'Not specified'}</p>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">Salary</h5>
                                <p className="fs-5">{job.salary || 'Not specified'}</p>
                            </div>
                            <div className="col-md-6">
                                <h5 className="text-muted mb-2">Posted Date</h5>
                                <p className="fs-5">{new Date(job.posted_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {job.url && (
                            <div className="mb-4">
                                <h5 className="text-muted mb-2">Application URL</h5>
                                <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-success">
                                    {job.url} <i className="fas fa-external-link-alt ms-1"></i>
                                </a>
                            </div>
                        )}

                        <div className="mb-4">
                            <h5 className="text-muted mb-2">Job Description</h5>
                            <div className="job-description p-3 bg-light rounded">
                                {job.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br />') }} />
                                ) : (
                                    <p className="text-muted">No description provided</p>
                                )}
                            </div>
                        </div>

                        <div className="d-flex justify-content-between mt-4">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate('/')}
                            >
                                <i className="fas fa-arrow-left me-1"></i> Back to Jobs
                            </button>

                            {job.url && (
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-success"
                                >
                                    <i className="fas fa-paper-plane me-1"></i> Apply Now
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Deletion</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete the job posting: <strong>{job.title}</strong>?</p>
                                <p className="text-danger"><i className="fas fa-exclamation-triangle me-1"></i> This action cannot be undone.</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Job'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default JobDetail; 