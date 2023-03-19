import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

const cache = setupCache({
  maxAge: 15 * 60 * 1000, // cache responses for 15 minutes
});

const axiosInstance = axios.create({
  adapter: cache.adapter,
});


// add token to request headers

const token = localStorage.getItem('jwtToken');

if (token) {

  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

axiosInstance.interceptors.request.use((config) => {
  // Add any request headers here
  return config;
});

axiosInstance.interceptors.response.use((response) => {
  // Add any response processing here
  return response;
});

export default axiosInstance;
