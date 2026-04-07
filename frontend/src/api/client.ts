import axios from 'axios';

const API_KEY = import.meta.env.VITE_EBPFSCOPE_API_KEY || "default_unsafe_token";

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${API_KEY}`
  }
});
