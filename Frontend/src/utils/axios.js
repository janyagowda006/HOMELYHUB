//centeralized API setup

import axios from 'axios';
import qs from 'qs';

const rawBackendUrl =
  import.meta.env?.VITE_BACKEND_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  "";

const baseApi = rawBackendUrl
  ? `${rawBackendUrl.replace(/\/$/, "")}/api`
  : "/api";

export const axiosInstance = axios.create({
  baseURL: baseApi,
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

// Avoid double /api/api if caller path already starts with /api
axiosInstance.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  return config;
});


