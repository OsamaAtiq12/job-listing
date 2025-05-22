import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { Job, JobQuery } from '../../services/api';

interface JobFormData {
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    salary: string;
}

const initialFormData: JobFormData = {
    title: '',
    company: '',
    location: '',
    description: '',
    url: '',
    salary: ''
};

const AddJob: React.FC = () => {
    const [formData, setFormData] = useState<JobFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation
        if (!formData.title || !formData.company) {
            setError('Title and company are required fields.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await api.createJob(formData);

            // Redirect to jobs page after successful creation
            navigate('/jobs', { state: { message: 'Job listing created successfully!' } });
        } catch (err) {
            setError('Failed to create job listing. Please try again.');
            console.error('Error creating job:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container my-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">
                                <i className="fas fa-plus-circle me-2"></i> Add New Job Listing
                            </h3>
                        </div>

                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="fas fa-exclamation-circle me-2"></i> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">Job Title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="company" className="form-label">Company *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="company"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="location" className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="salary" className="form-label">Salary</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="salary"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        placeholder="e.g., $70,000 - $90,000"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="url" className="form-label">Application URL</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        id="url"
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/apply"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Job Description</label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        name="description"
                                        rows={5}
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary me-md-2"
                                        onClick={() => navigate('/jobs')}
                                        disabled={loading}
                                    >
                                        <i className="fas fa-times me-1"></i> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i> Save Job
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddJob; 