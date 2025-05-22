import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { Job } from '../../services/api';

interface JobFormProps {
    initialJob?: Partial<Job>;
    isEditing?: boolean;
    onSubmit: (job: Partial<Job>) => Promise<void>;
    onCancel: () => void;
}

const JobForm: React.FC<JobFormProps> = ({
    initialJob = {},
    isEditing = false,
    onSubmit,
    onCancel
}) => {
    const [job, setJob] = useState<Partial<Job>>({
        title: initialJob.title || '',
        company: initialJob.company || '',
        location: initialJob.location || '',
        description: initialJob.description || '',
        url: initialJob.url || '',
        salary: initialJob.salary || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!job.title?.trim()) {
            newErrors.title = 'Job title is required';
        }

        if (!job.company?.trim()) {
            newErrors.company = 'Company name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setJob(prev => ({ ...prev, [name]: value }));

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(job);
        } catch (error) {
            console.error('Error submitting job:', error);
            setErrors({ submit: 'Failed to save job. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="job-form-container">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Job Title *</label>
                    <input
                        type="text"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        id="title"
                        name="title"
                        value={job.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Actuary"
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                </div>

                <div className="mb-3">
                    <label htmlFor="company" className="form-label">Company *</label>
                    <input
                        type="text"
                        className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                        id="company"
                        name="company"
                        value={job.company}
                        onChange={handleChange}
                        placeholder="e.g. MetLife"
                    />
                    {errors.company && <div className="invalid-feedback">{errors.company}</div>}
                </div>

                <div className="mb-3">
                    <label htmlFor="location" className="form-label">Location</label>
                    <input
                        type="text"
                        className="form-control"
                        id="location"
                        name="location"
                        value={job.location || ''}
                        onChange={handleChange}
                        placeholder="e.g. London, UK"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="salary" className="form-label">Salary</label>
                    <input
                        type="text"
                        className="form-control"
                        id="salary"
                        name="salary"
                        value={job.salary || ''}
                        onChange={handleChange}
                        placeholder="e.g. $80,000 - $100,000 per year"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="url" className="form-label">Application URL</label>
                    <input
                        type="url"
                        className="form-control"
                        id="url"
                        name="url"
                        value={job.url || ''}
                        onChange={handleChange}
                        placeholder="https://example.com/careers/job123"
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="description" className="form-label">Job Description</label>
                    <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        rows={8}
                        value={job.description || ''}
                        onChange={handleChange}
                        placeholder="Describe the job responsibilities, requirements, and benefits..."
                    />
                </div>

                {errors.submit && (
                    <div className="alert alert-danger" role="alert">
                        {errors.submit}
                    </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {isEditing ? 'Updating...' : 'Posting...'}
                            </>
                        ) : (
                            isEditing ? 'Update Job' : 'Post Job'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobForm; 