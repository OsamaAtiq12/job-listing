import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { Job } from '../../services/api';
import JobForm from './JobForm';

const EditJob: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                setError('Failed to load job. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    const handleSubmit = async (jobData: Partial<Job>) => {
        if (id) {
            await api.updateJob(parseInt(id), jobData);
            navigate('/');
        }
    };

    const handleCancel = () => {
        navigate('/');
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
        <div className="container py-5">
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <div className="card shadow">
                        <div className="card-header" style={{ background: 'linear-gradient(150deg, #00c271 20%, #00657a 43%, #00367e 60%)', color: 'white' }}>
                            <h3 className="card-title mb-0">
                                <i className="fas fa-edit me-2"></i>
                                Edit Job
                            </h3>
                        </div>
                        <div className="card-body p-4">
                            <p className="text-muted mb-4">
                                Update the job listing details below. Fields marked with * are required.
                            </p>
                            <JobForm
                                initialJob={job}
                                isEditing={true}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditJob; 