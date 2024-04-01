import axios from 'axios';

export const setAuthorizationToken = (token: any) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.withCredentials = true;
  } else delete axios.defaults.headers.common['Authorization'];
};
