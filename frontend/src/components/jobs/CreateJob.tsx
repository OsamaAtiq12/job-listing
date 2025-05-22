import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import JobForm from './JobForm';

const CreateJob: React.FC = () => {
    const navigate = useNavigate();

    const handleSubmit = async (jobData: any) => {
        await api.createJob(jobData);
        navigate('/');
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="container py-5">
            <div className="row">
                <div className="col-lg-8 mx-auto">
                    <div className="card shadow">
                        <div className="card-header" style={{ background: 'linear-gradient(150deg, #00c271 20%, #00657a 43%, #00367e 60%)', color: 'white' }}>
                            <h3 className="card-title mb-0">
                                <i className="fas fa-plus-circle me-2"></i>
                                Post a New Job
                            </h3>
                        </div>
                        <div className="card-body p-4">
                            <p className="text-muted mb-4">
                                Fill out the form below to post your job listing. Fields marked with * are required.
                            </p>
                            <JobForm
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

export default CreateJob; 