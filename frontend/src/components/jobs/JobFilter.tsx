import React, { useState } from 'react';
import api, { Job, JobQuery } from '../../services/api';

interface JobFilterProps {
    onFilterChange: (filters: JobQuery) => void;
}

const JobFilter: React.FC<JobFilterProps> = ({ onFilterChange }) => {
    const [search, setSearch] = useState('');
    const [company, setCompany] = useState('');
    const [location, setLocation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const filters: JobQuery = {};
        if (search) filters.search = search;
        if (company) filters.company = company;
        if (location) filters.location = location;

        onFilterChange(filters);
    };

    const handleReset = () => {
        setSearch('');
        setCompany('');
        setLocation('');
        onFilterChange({});
    };

    return (
        <div className="filter-panel mb-4">
            <div className="filter-heading">
                <i className="fas fa-filter me-2"></i> Filter Jobs
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-3 search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by keywords..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filter by company..."
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Filter by location..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>

                <div className="d-flex justify-content-end">
                    <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={handleReset}
                    >
                        <i className="fas fa-undo me-1"></i> Reset
                    </button>
                    <button type="submit" className="btn btn-primary">
                        <i className="fas fa-search me-1"></i> Apply Filters
                    </button>
                </div>
            </form>
        </div>
    );
};

export default JobFilter; 