import React from 'react';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="footer mt-auto py-3">
            <div className="container">
                <div className="text-center">
                    <span>Job Listings &copy; {year}</span>
                    <div className="mt-2">
                        <a href="#!" className="text-white mx-2">
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="#!" className="text-white mx-2">
                            <i className="fab fa-twitter"></i>
                        </a>
                        <a href="#!" className="text-white mx-2">
                            <i className="fab fa-linkedin-in"></i>
                        </a>
                        <a href="#!" className="text-white mx-2">
                            <i className="fab fa-github"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 