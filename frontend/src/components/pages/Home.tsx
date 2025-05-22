import React, { useState, useEffect, useCallback } from 'react';
import api, { JobQuery } from '../../services/api';
import { Link } from 'react-router-dom';
import axios from 'axios';

type JobListing = {
    id: number;
    title: string;
    company: string;
    location: string;
    country: string;
    city: string;
    type: string;
    tags: string[];
    experienceLevel: string;
    category: string;
    isNew: boolean;
    postedAgo: string;
    postedDate?: Date; // Add postedDate for sorting
};

type SortOption = 'newest' | 'oldest' | 'company-az' | 'company-za' | 'salary-high-low' | 'salary-low-high';

const Home: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>(['All countries']);
    const [selectedCities, setSelectedCities] = useState<string[]>(['All cities']);
    const [jobListings, setJobListings] = useState<JobListing[]>([]);
    const [sortedListings, setSortedListings] = useState<JobListing[]>([]);
    const [sortOrder, setSortOrder] = useState<SortOption>('newest');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<{ companies: string[], locations: string[] }>({
        companies: [],
        locations: []
    });
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Function to fetch all jobs without any filters
    const fetchAllJobs = async () => {
        try {
            setIsLoading(true);
            const response = await api.getJobs();
            console.log('Fetched all jobs:', response.length);

            // Transform API job data
            const transformedJobs: JobListing[] = response.map(job => {
                // Extract city and country from location
                const locationParts = job.location.split(',').map(part => part.trim());
                const city = locationParts[0];
                const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

                // Calculate posted ago from posted_date
                const postedDate = new Date(job.posted_date);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - postedDate.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                let postedAgo = '';
                if (diffDays === 0) {
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                    postedAgo = `${diffHours}h ago`;
                } else {
                    postedAgo = `${diffDays}d ago`;
                }

                // Detect if job is new (posted within last 2 days)
                const isNew = diffDays < 2;

                // Create tags from location and company
                const tags = [country, city].filter(Boolean);

                return {
                    id: job.id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    country: country,
                    city: city,
                    type: job.salary || 'Not specified',
                    tags: tags,
                    experienceLevel: 'Analyst (Experienced)',
                    category: job.description.includes('Fellow') ? 'Actuary (Fellow)' :
                        job.description.includes('Associate') ? 'Actuary (Associate)' : 'Analyst',
                    isNew: isNew,
                    postedAgo: postedAgo,
                    postedDate: postedDate
                };
            });

            setJobListings(transformedJobs);

            // Extract unique companies and locations
            const companies = Array.from(new Set(transformedJobs.map(job => job.company)));
            const locations = Array.from(new Set(transformedJobs.map(job => job.location)));

            setSearchResults({
                companies: companies,
                locations: locations
            });
        } catch (err) {
            console.error('Failed to fetch all jobs:', err);
            setError('Failed to load job listings. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Add debounce function to delay search
    const debounce = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return function (...args: any[]) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Create debounced search function
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setSearchQuery(value);
        }, 500), // 500ms delay
        []
    );

    // Fetch all jobs when component mounts
    useEffect(() => {
        console.log("INITIAL MOUNT: FETCHING ALL JOBS");

        // Direct API call on component mount
        (async () => {
            try {
                setIsLoading(true);

                // Use a completely fresh API call with no parameters
                const response = await axios.get("http://localhost:5000/api/jobs");
                console.log('Initial load: API returned', response.data.length, 'jobs');

                // Transform and set job listings
                const transformedJobs = response.data.map((job: any) => {
                    // Basic job transformation code
                    const locationParts = job.location.split(',').map((part: string) => part.trim());
                    const city = locationParts[0];
                    const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

                    // Calculate posted time
                    const postedDate = new Date(job.posted_date);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const postedAgo = diffDays === 0
                        ? `${Math.floor(diffTime / (1000 * 60 * 60))}h ago`
                        : `${diffDays}d ago`;

                    return {
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        country: country,
                        city: city,
                        type: job.salary || 'Not specified',
                        tags: [country, city].filter(Boolean),
                        experienceLevel: 'Analyst (Experienced)',
                        category: job.description.includes('Fellow') ? 'Actuary (Fellow)' :
                            job.description.includes('Associate') ? 'Actuary (Associate)' : 'Analyst',
                        isNew: diffDays < 2,
                        postedAgo: postedAgo,
                        postedDate: postedDate
                    };
                });

                // Set job listings directly
                setJobListings(transformedJobs);

                // Update search results
                const companies = Array.from(new Set(transformedJobs.map((job: JobListing) => job.company))) as string[];
                const locations = Array.from(new Set(transformedJobs.map((job: JobListing) => job.location))) as string[];
                setSearchResults({
                    companies: companies,
                    locations: locations
                });

                console.log('Initial load: Successfully displayed', transformedJobs.length, 'jobs');
            } catch (err) {
                console.error('Error fetching initial jobs:', err);
                setError('Failed to load job listings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []); // Empty dependency array means it only runs once on mount

    // Parse search query for location and company keywords
    const parseSearchQuery = (query: string): JobQuery => {
        const queryParams: JobQuery = {};

        // If we have active filters, use them regardless of search query
        if (companyFilter) {
            queryParams.company = companyFilter;
        }

        if (locationFilter) {
            queryParams.location = locationFilter;
        }

        // If there's a search query but no specific filters yet
        if (query.trim() !== '' && !companyFilter && !locationFilter) {
            // Check for explicit company: prefix
            const companyMatch = query.match(/company:([^,]+)/i);
            if (companyMatch && companyMatch[1]) {
                queryParams.company = companyMatch[1].trim();
            }
            // Check for explicit location: prefix
            else if (query.match(/location:(.+)$/i)) {
                const locationMatch = query.match(/location:(.+)$/i);
                if (locationMatch && locationMatch[1]) {
                    queryParams.location = locationMatch[1].trim();
                }
            }
            // No explicit prefix, use the search parameter which checks title, description, and company
            else {
                queryParams.search = query.trim();
            }
        }

        return queryParams;
    };

    // Fetch jobs when search parameters change
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Create a simple query object based ONLY on company and location filters
                const queryParams: JobQuery = {};

                // Add company filter if exists
                if (companyFilter) {
                    queryParams.company = companyFilter;
                    console.log(`Filtering by company: "${companyFilter}"`);
                }

                // Add location filter if exists
                if (locationFilter) {
                    queryParams.location = locationFilter;
                    console.log(`Filtering by location: "${locationFilter}"`);
                }

                // If we have a search term but no specific filters
                if (searchQuery && !companyFilter && !locationFilter) {
                    // Try to determine if the search is more likely a company or location
                    const searchTerm = searchQuery.toLowerCase();

                    // Check if search term matches any known companies
                    const companyMatch = searchResults.companies.find(company =>
                        company.toLowerCase().includes(searchTerm));

                    // Check if search term matches any known locations
                    const locationMatch = searchResults.locations.find(location =>
                        location.toLowerCase().includes(searchTerm));

                    if (companyMatch) {
                        // If it matches a company name, use company filter
                        queryParams.company = companyMatch;
                        console.log(`Search "${searchTerm}" matched company: "${companyMatch}"`);
                    } else if (locationMatch) {
                        // If it matches a location, use location filter
                        queryParams.location = locationMatch;
                        console.log(`Search "${searchTerm}" matched location: "${locationMatch}"`);
                    } else {
                        // If no specific match, use general search which covers title, description, company
                        queryParams.search = searchTerm;
                        console.log(`Using general search for: "${searchTerm}"`);
                    }
                }

                console.log('Searching with query params:', queryParams);

                // Fetch jobs from API
                const response = await api.getJobs(queryParams);
                console.log('Found', response.length, 'jobs');

                // Transform API job data to match our JobListing type
                const transformedJobs: JobListing[] = response.map(job => {
                    // Extract city and country from location
                    const locationParts = job.location.split(',').map(part => part.trim());
                    const city = locationParts[0];
                    const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

                    // Calculate posted ago from posted_date
                    const postedDate = new Date(job.posted_date);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    let postedAgo = '';
                    if (diffDays === 0) {
                        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                        postedAgo = `${diffHours}h ago`;
                    } else {
                        postedAgo = `${diffDays}d ago`;
                    }

                    // Detect if job is new (posted within last 2 days)
                    const isNew = diffDays < 2;

                    // Create tags from location and company
                    const tags = [country, city].filter(Boolean);

                    return {
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        country: country,
                        city: city,
                        type: job.salary || 'Not specified',
                        tags: tags,
                        experienceLevel: 'Analyst (Experienced)',
                        category: job.description.includes('Fellow') ? 'Actuary (Fellow)' :
                            job.description.includes('Associate') ? 'Actuary (Associate)' : 'Analyst',
                        isNew: isNew,
                        postedAgo: postedAgo,
                        postedDate: postedDate
                    };
                });

                setJobListings(transformedJobs);

                // Extract unique companies and locations for search suggestions
                const companies = Array.from(new Set(transformedJobs.map(job => job.company)));
                const locations = Array.from(new Set(transformedJobs.map(job => job.location)));

                setSearchResults({
                    companies: companies,
                    locations: locations
                });
            } catch (err) {
                console.error('Failed to fetch jobs:', err);
                setError('Failed to load job listings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [searchQuery, companyFilter, locationFilter, refreshCounter]);

    // Sort job listings whenever the jobs array or sort order changes
    useEffect(() => {
        if (jobListings.length === 0) {
            setSortedListings([]);
            return;
        }

        const sortJobs = () => {
            const sorted = [...jobListings];

            switch (sortOrder) {
                case 'newest':
                    sorted.sort((a, b) => {
                        if (!a.postedDate || !b.postedDate) return 0;
                        return b.postedDate.getTime() - a.postedDate.getTime();
                    });
                    break;
                case 'oldest':
                    sorted.sort((a, b) => {
                        if (!a.postedDate || !b.postedDate) return 0;
                        return a.postedDate.getTime() - b.postedDate.getTime();
                    });
                    break;
                case 'company-az':
                    sorted.sort((a, b) => a.company.localeCompare(b.company));
                    break;
                case 'company-za':
                    sorted.sort((a, b) => b.company.localeCompare(a.company));
                    break;
                case 'salary-high-low':
                    sorted.sort((a, b) => {
                        // Extract numeric salary values for comparison
                        const getSalaryValue = (salary: string): number => {
                            if (salary === 'Not specified') return 0;
                            const match = salary.match(/\d+/g);
                            return match ? parseInt(match.join(''), 10) : 0;
                        };
                        return getSalaryValue(b.type) - getSalaryValue(a.type);
                    });
                    break;
                case 'salary-low-high':
                    sorted.sort((a, b) => {
                        // Extract numeric salary values for comparison
                        const getSalaryValue = (salary: string): number => {
                            if (salary === 'Not specified') return 0;
                            const match = salary.match(/\d+/g);
                            return match ? parseInt(match.join(''), 10) : 0;
                        };
                        return getSalaryValue(a.type) - getSalaryValue(b.type);
                    });
                    break;
                default:
                    break;
            }

            setSortedListings(sorted);
        };

        sortJobs();
    }, [jobListings, sortOrder]);

    const handleSearch = () => {
        console.log(`Searching for: "${searchQuery}"`);

        // If search field is empty, clear only company and location filters
        if (searchQuery.trim() === '') {
            console.log("CLEARING COMPANY AND LOCATION FILTERS FROM SEARCH BUTTON");

            // Reset only the search-related filters
            setSearchQuery('');
            setCompanyFilter('');
            setLocationFilter('');

            // Directly fetch all jobs with a clean API call
            (async () => {
                try {
                    setIsLoading(true);

                    // Use a completely fresh API call with no parameters
                    const response = await axios.get("http://localhost:5000/api/jobs");
                    console.log('API returned', response.data.length, 'jobs with no filters');

                    // Transform and set job listings
                    const transformedJobs = response.data.map((job: any) => {
                        // Basic job transformation code
                        const locationParts = job.location.split(',').map((part: string) => part.trim());
                        const city = locationParts[0];
                        const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

                        // Calculate posted time
                        const postedDate = new Date(job.posted_date);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - postedDate.getTime());
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const postedAgo = diffDays === 0
                            ? `${Math.floor(diffTime / (1000 * 60 * 60))}h ago`
                            : `${diffDays}d ago`;

                        return {
                            id: job.id,
                            title: job.title,
                            company: job.company,
                            location: job.location,
                            country: country,
                            city: city,
                            type: job.salary || 'Not specified',
                            tags: [country, city].filter(Boolean),
                            experienceLevel: 'Analyst (Experienced)',
                            category: job.description.includes('Fellow') ? 'Actuary (Fellow)' :
                                job.description.includes('Associate') ? 'Actuary (Associate)' : 'Analyst',
                            isNew: diffDays < 2,
                            postedAgo: postedAgo,
                            postedDate: postedDate
                        };
                    });

                    // Set job listings directly
                    setJobListings(transformedJobs);

                    // Update search results
                    const companies = Array.from(new Set(transformedJobs.map((job: JobListing) => job.company))) as string[];
                    const locations = Array.from(new Set(transformedJobs.map((job: JobListing) => job.location))) as string[];
                    setSearchResults({
                        companies: companies,
                        locations: locations
                    });

                    console.log('Successfully displayed', transformedJobs.length, 'jobs');
                } catch (err) {
                    console.error('Error fetching all jobs:', err);
                    setError('Failed to load job listings. Please try again later.');
                } finally {
                    setIsLoading(false);
                }
            })();
        } else {
            // For non-empty search, let the useEffect handle the filtering
            // No additional logic needed here, as the useEffect is triggered by the searchQuery state
        }
    };

    const handleCompanyFilterClick = (company: string) => {
        // Clear any existing location filter
        setLocationFilter('');

        // Set the company filter
        setCompanyFilter(company);

        // Update search query to show what we're filtering on
        setSearchQuery(company);

        console.log(`Filtering by company: "${company}"`);
    };

    const handleLocationFilterClick = (location: string) => {
        // Clear any existing company filter
        setCompanyFilter('');

        // Set the location filter
        setLocationFilter(location);

        // Update search query to show what we're filtering on
        setSearchQuery(location);

        console.log(`Filtering by location: "${location}"`);
    };

    const handleSortChange = (option: SortOption) => {
        setSortOrder(option);
    };

    return (
        <div className="home-container">
            {/* Hero Section with Gradient Background */}
            <section className="hero-section py-5 text-white text-center">
                <div className="container">
                    <h1 className="display-5 fw-bold mb-3">Find Handpicked Actuarial Jobs</h1>
                    <h2 className="display-6 mb-4">That Match Your Expertise</h2>
                    <p className="lead mb-4">With 300+ open roles and 50 new jobs posted weekly, your dream job is just a click away.</p>

                    {/* Search Bar */}
                    <div className="search-container mx-auto" style={{ maxWidth: '800px' }}>
                        <div className="input-group mb-3">
                            <input
                                type="text"
                                className="form-control py-3 px-4"
                                placeholder="Enter any company or location"
                                value={searchQuery}
                                onChange={(e) => {
                                    const newValue = e.target.value;

                                    // Special handling for empty search field
                                    if (newValue.trim() === '') {
                                        console.log("CLEARING COMPANY AND LOCATION FILTERS");

                                        // Reset only the search-related filters
                                        setSearchQuery('');
                                        setCompanyFilter('');
                                        setLocationFilter('');

                                        // Directly fetch all jobs with a clean API call
                                        (async () => {
                                            try {
                                                setIsLoading(true);

                                                // Use a completely fresh API call with no parameters
                                                const response = await axios.get("http://localhost:5000/api/jobs");
                                                console.log('API returned', response.data.length, 'jobs with no filters');

                                                // Transform and set job listings
                                                const transformedJobs = response.data.map((job: any) => {
                                                    // Basic job transformation code
                                                    const locationParts = job.location.split(',').map((part: string) => part.trim());
                                                    const city = locationParts[0];
                                                    const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

                                                    // Calculate posted time
                                                    const postedDate = new Date(job.posted_date);
                                                    const now = new Date();
                                                    const diffTime = Math.abs(now.getTime() - postedDate.getTime());
                                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                    const postedAgo = diffDays === 0
                                                        ? `${Math.floor(diffTime / (1000 * 60 * 60))}h ago`
                                                        : `${diffDays}d ago`;

                                                    return {
                                                        id: job.id,
                                                        title: job.title,
                                                        company: job.company,
                                                        location: job.location,
                                                        country: country,
                                                        city: city,
                                                        type: job.salary || 'Not specified',
                                                        tags: [country, city].filter(Boolean),
                                                        experienceLevel: 'Analyst (Experienced)',
                                                        category: job.description.includes('Fellow') ? 'Actuary (Fellow)' :
                                                            job.description.includes('Associate') ? 'Actuary (Associate)' : 'Analyst',
                                                        isNew: diffDays < 2,
                                                        postedAgo: postedAgo,
                                                        postedDate: postedDate
                                                    };
                                                });

                                                // Set job listings directly
                                                setJobListings(transformedJobs);

                                                // Update search results
                                                const companies = Array.from(new Set(transformedJobs.map((job: JobListing) => job.company))) as string[];
                                                const locations = Array.from(new Set(transformedJobs.map((job: JobListing) => job.location))) as string[];
                                                setSearchResults({
                                                    companies: companies,
                                                    locations: locations
                                                });

                                                console.log('Successfully displayed', transformedJobs.length, 'jobs');
                                            } catch (err) {
                                                console.error('Error fetching all jobs:', err);
                                                setError('Failed to load job listings. Please try again later.');
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        })();
                                    } else {
                                        // For normal search input, just update the search query
                                        // Let the useEffect handle the actual filtering
                                        setSearchQuery(newValue);
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                className="btn btn-success px-4"
                                type="button"
                                onClick={handleSearch}
                            >
                                <i className="fas fa-search me-2"></i>
                                Search Jobs
                            </button>
                        </div>

                    </div>

                    {/* Trust Badges */}
                    <div className="trust-badges mt-4">
                        <div className="d-flex align-items-center justify-content-center">
                            <div className="avatar-group me-2">
                                <img
                                    src="https://www.actuarylist.com/_next/image?url=%2Fimg%2Ffeature-avatars.png&w=96&q=75"
                                    alt="Actuary Avatars"
                                    style={{ height: 'auto', width: '96px', objectFit: 'contain', border: "none" }}
                                />
                            </div>
                            <span className="text-white" style={{ paddingLeft: "15px" }}>Trusted by 1700+ actuaries finding their dream jobs.</span>
                            <button className="btn btn-outline-light ms-3">Join The List <i className="fas fa-chevron-right ms-1"></i></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Job Listings Section */}
            <section className="job-listings-section py-5">
                <div className="container">
                    <div className="row">
                        {/* Filters Sidebar */}
                        <div className="col-lg-3">
                            <div className="filters-container p-3 border rounded">


                                <h5 className="mb-3">Country</h5>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedCountries.includes('All countries')}
                                        id="allCountries"
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCountries(['All countries']);
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="allCountries">
                                        All countries <span className="text-muted">(877)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="usa"
                                        checked={selectedCountries.includes('USA')}
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCountries(prev =>
                                                prev.includes('USA')
                                                    ? prev.filter(c => c !== 'USA')
                                                    : [...prev.filter(c => c !== 'All countries'), 'USA']
                                            );
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="usa">
                                        USA <span className="text-muted">(343)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="uk"
                                        checked={selectedCountries.includes('UK')}
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCountries(prev =>
                                                prev.includes('UK')
                                                    ? prev.filter(c => c !== 'UK')
                                                    : [...prev.filter(c => c !== 'All countries'), 'UK']
                                            );
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="uk">
                                        UK <span className="text-muted">(199)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="india"
                                        checked={selectedCountries.includes('India')}
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCountries(prev =>
                                                prev.includes('India')
                                                    ? prev.filter(c => c !== 'India')
                                                    : [...prev.filter(c => c !== 'All countries'), 'India']
                                            );
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="india">
                                        India <span className="text-muted">(92)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="germany"
                                        checked={selectedCountries.includes('Germany')}
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCountries(prev =>
                                                prev.includes('Germany')
                                                    ? prev.filter(c => c !== 'Germany')
                                                    : [...prev.filter(c => c !== 'All countries'), 'Germany']
                                            );
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="germany">
                                        Germany <span className="text-muted">(40)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="canada"
                                    />
                                    <label className="form-check-label" htmlFor="canada">
                                        Canada <span className="text-muted">(37)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="singapore"
                                    />
                                    <label className="form-check-label" htmlFor="singapore">
                                        Singapore <span className="text-muted">(32)</span>
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="australia"
                                    />
                                    <label className="form-check-label" htmlFor="australia">
                                        Australia <span className="text-muted">(16)</span>
                                    </label>
                                </div>

                                <h5 className="mb-3 mt-4">City</h5>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={selectedCities.includes('All cities')}
                                        id="allCities"
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCities(['All cities']);
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="allCities">
                                        All cities <span className="text-muted">(877)</span>
                                    </label>
                                </div>

                                {/* Dynamically generate popular city checkboxes */}
                                {searchResults.locations
                                    .filter((location, index) => index < 5) // Show top 5 locations
                                    .map((location, index) => {
                                        const cityName = location.split(',')[0].trim();
                                        const idKey = `city-${index}`;
                                        return (
                                            <div className="form-check mb-2" key={idKey}>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={idKey}
                                                    checked={selectedCities.includes(location)}
                                                    onChange={() => {
                                                        // Only update UI state, don't apply filters
                                                        setSelectedCities(prev =>
                                                            prev.includes(location)
                                                                ? prev.filter(c => c !== location)
                                                                : [...prev.filter(c => c !== 'All cities'), location]
                                                        );
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={idKey}>
                                                    {location} <span className="text-muted">({Math.floor(Math.random() * 50) + 10})</span>
                                                </label>
                                            </div>
                                        );
                                    })}

                                {/* Add Remote option as it's common */}
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="remote"
                                        checked={selectedCities.includes('Remote')}
                                        onChange={() => {
                                            // Only update UI state, don't apply filters
                                            setSelectedCities(prev =>
                                                prev.includes('Remote')
                                                    ? prev.filter(c => c !== 'Remote')
                                                    : [...prev.filter(c => c !== 'All cities'), 'Remote']
                                            );
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="remote">
                                        Remote <span className="text-muted">(78)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Job Listings */}
                        <div className="col-lg-9">
                            {/* Loading and Error States */}
                            {isLoading && (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3">Loading job listings...</p>
                                </div>
                            )}

                            {error && !isLoading && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    {error}
                                </div>
                            )}


                            {!isLoading && !error && (
                                <div className="job-listings">
                                    {sortedListings.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                            <h4>No job listings found</h4>
                                            <p className="text-muted">
                                                Try adjusting your search criteria or check back later for new opportunities.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between align-items-center mb-4">

                                                <div className="dropdown">
                                                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                                        Sort by: {sortOrder.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                    </button>
                                                    <ul className="dropdown-menu" aria-labelledby="sortDropdown">
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('newest')}>Newest</a></li>
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('oldest')}>Oldest</a></li>
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('company-az')}>Company A-Z</a></li>
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('company-za')}>Company Z-A</a></li>
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('salary-high-low')}>Salary (High to Low)</a></li>
                                                        <li><a className="dropdown-item" href="#" onClick={() => handleSortChange('salary-low-high')}>Salary (Low to High)</a></li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {sortedListings.map(job => (
                                                <div key={job.id} className="job-card mb-4 p-4 border rounded bg-white">
                                                    <div className="row">
                                                        {/* Company Logo */}
                                                        <div className="col-md-1 d-flex align-items-center">
                                                            <div className="company-logo">
                                                                {job.company === 'MetLife' && (
                                                                    <div className="rounded-circle bg-warning" style={{ width: '50px', height: '50px' }}></div>
                                                                )}
                                                                {job.company === 'L&G' && (
                                                                    <div className="rounded bg-primary" style={{ width: '50px', height: '50px' }}></div>
                                                                )}
                                                                {job.company === 'Royal London' && (
                                                                    <div className="rounded-circle bg-dark" style={{ width: '50px', height: '50px' }}></div>
                                                                )}


                                                                {!['MetLife', 'L&G', 'Royal London'].includes(job.company) && (
                                                                    <div className="rounded-circle bg-secondary" style={{ width: '50px', height: '50px' }}></div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Job Details */}
                                                        <div className="col-md-8">
                                                            <h5 className="mb-1">{job.title}</h5>
                                                            <p className="mb-2">
                                                                <a href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleCompanyFilterClick(job.company);
                                                                    }}
                                                                    className="company-badge text-decoration-none">
                                                                    {job.company}
                                                                </a> •
                                                                <a href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleLocationFilterClick(job.location);
                                                                    }}
                                                                    className="location-badge text-decoration-none ms-1">
                                                                    {job.location}
                                                                </a>


                                                            </p>
                                                            <div className="job-tags">
                                                                {job.tags.map((tag, index) => (
                                                                    <span key={index}
                                                                        className="badge bg-light text-dark me-2 mb-2 p-2"
                                                                        onClick={() => handleLocationFilterClick(tag)}
                                                                        style={{ cursor: 'pointer' }}>
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Experience Level and Time */}
                                                        <div className="col-md-3 text-end">
                                                            {job.isNew && <span className="badge bg-danger mb-2">NEW</span>}
                                                            <p className="mb-1">{job.experienceLevel}</p>
                                                            <p className="mb-1">{job.category}</p>
                                                            <p className="mb-1"><strong>{job.type}</strong></p>
                                                            <p className="text-muted">{job.postedAgo}</p>

                                                            {/* Job action buttons */}
                                                            <div className="mt-2">
                                                                <Link to={`/jobs/${job.id}`} className="btn btn-sm btn-outline-primary me-1">
                                                                    <i className="fas fa-eye"></i>
                                                                </Link>
                                                                <Link to={`/jobs/edit/${job.id}`} className="btn btn-sm btn-outline-success me-1">
                                                                    <i className="fas fa-edit"></i>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="footer py-5" style={{ backgroundColor: '#131a2c' }}>
                <div className="container">
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <h5 className="text-white mb-3">
                                <i className="fas fa-building me-2"></i> Actuary List
                            </h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">About us</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Blog</a></li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <h5 className="text-white mb-3">
                                <i className="fas fa-user-tie text-warning me-2"></i> For actuaries
                            </h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Get job alerts</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Search jobs</a></li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <h5 className="text-white mb-3">
                                <i className="fas fa-briefcase text-info me-2"></i> For employers
                            </h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Start hiring</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Employer directory</a></li>
                            </ul>
                        </div>
                        <div className="col-md-3">
                            <h5 className="text-white mb-3">
                                <i className="fas fa-envelope text-success me-2"></i> Contact
                            </h5>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Email us</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-md-6">
                            <h6 className="text-white mb-3">
                                <i className="fas fa-briefcase text-primary me-2"></i> Job types
                            </h6>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Sectors</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Experience levels</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Keywords</a></li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h6 className="text-white mb-3">
                                <i className="fas fa-map-marker-alt text-danger me-2"></i> Job locations
                            </h6>
                            <ul className="list-unstyled">
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Countries</a></li>
                                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none">Cities</a></li>
                            </ul>
                        </div>
                    </div>

                    <hr className="border-secondary" />

                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <a href="#" className="btn btn-outline-light me-2" style={{ borderRadius: '4px' }}>
                                <i className="fab fa-linkedin"></i>
                            </a>
                            <a href="#" className="btn btn-outline-light" style={{ borderRadius: '4px' }}>
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                        <div>
                            <a href="#" className="text-white-50 text-decoration-none me-3">Cookies</a>
                            <a href="#" className="text-white-50 text-decoration-none">Privacy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home; 