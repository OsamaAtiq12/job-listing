import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import Home from './components/pages/Home';
import CreateJob from './components/jobs/CreateJob';
import EditJob from './components/jobs/EditJob';
import JobDetail from './components/jobs/JobDetail';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <div className="flex-grow-1 page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<div className="container py-5"><h2>About Actuary List</h2></div>} />
            <Route path="/blog" element={<div className="container py-5"><h2>Actuary Blog</h2></div>} />
            <Route path="/post-job" element={<CreateJob />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/jobs/edit/:id" element={<EditJob />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/alerts" element={<div className="container py-5"><h2>Job Alerts</h2></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
