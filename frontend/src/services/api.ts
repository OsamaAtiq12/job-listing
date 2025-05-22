import axios from "axios";

// Define the base URL for the API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Define the Job interface
export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary: string;
  posted_date: string;
  is_active: boolean;
}

// Define query parameters for filtering jobs
export interface JobQuery {
  company?: string;
  location?: string;
  search?: string;
}

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API functions
const api = {
  // Get all jobs with optional filtering
  getJobs: async (query?: JobQuery): Promise<Job[]> => {
    try {
      const response = await apiClient.get("/jobs", { params: query });
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  // Get a specific job by ID
  getJob: async (id: number): Promise<Job> => {
    try {
      const response = await apiClient.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  // Create a new job
  createJob: async (
    job: Omit<Job, "id" | "posted_date" | "is_active">
  ): Promise<Job> => {
    try {
      const response = await apiClient.post("/jobs", job);
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Update an existing job
  updateJob: async (id: number, job: Partial<Job>): Promise<Job> => {
    try {
      const response = await apiClient.put(`/jobs/${id}`, job);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  // Delete a job
  deleteJob: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/jobs/${id}`);
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },
};

export default api;
